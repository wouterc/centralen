from django.contrib.auth.models import User
from rest_framework import viewsets, permissions
from rest_framework.decorators import action, authentication_classes, throttle_classes
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from .models import Team, Invitation, WorkspaceMembership, Company, UITranslation, WorkspaceRequest
from vidensbank.models import VidensKategori
from .serializers import (
    UserSerializer, TeamSerializer, InvitationSerializer, 
    CompanySerializer, WorkspaceRequestSerializer, WorkspaceMembershipSerializer
)
from .mixins import CompanyFilterMixin, get_active_company, get_active_membership

from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import exceptions
from django.db.models import Q
import os
from django.core import signing
from django.core.mail import send_mail
from rest_framework.throttling import AnonRateThrottle


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    user = authenticate(request, email=email, password=password)
    if user is not None:
        if not user.is_active:
            return Response({
                'detail': 'Kontoen er ikke godkendt endnu, skal mailen sendes igen?',
                'code': 'not_activated',
                'email': user.email
            }, status=401)
        login(request, user)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    return Response({'detail': 'Ugyldigt email eller adgangskode', 'code': 'invalid_credentials'}, status=401)

@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'status': 'logged out'})

class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    queryset = Company.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or (hasattr(user, 'profile') and user.profile.role == 'ADMIN'):
            return Company.objects.all()
        return Company.objects.filter(memberships__user=user).distinct()

    def perform_create(self, serializer):
        company = serializer.save()
        # Automatically make the creator an ADMIN of the new company
        WorkspaceMembership.objects.create(
            user=self.request.user,
            company=company,
            role='ADMIN',
            alias=f"{self.request.user.first_name} {self.request.user.last_name}".strip() or self.request.user.username,
            color='#3b82f6'
        )
        # Create defaults
        Team.objects.create(navn="Generelt", company=company, color="#3b82f6")
        VidensKategori.objects.create(navn="Generelt", company=company, farve="#2563eb")

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        company = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id mangler'}, status=400)
        
        membership = WorkspaceMembership.objects.filter(company=company, user_id=user_id).first()
        if not membership:
            return Response({'error': 'Medlemsskabet blev ikke fundet'}, status=404)
            
        if int(user_id) == request.user.id:
            return Response({'error': 'Du kan ikke fjerne dig selv herfra. Brug "Forlad arbejdsrum" i stedet.'}, status=400)
            
        membership.delete()
        return Response({'status': 'Medlem fjernet fra arbejdsrum'})

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        company = self.get_object()
        membership = WorkspaceMembership.objects.filter(company=company, user=request.user).first()
        if not membership:
            return Response({'error': 'Du er ikke medlem af dette arbejdsrum'}, status=404)
        
        # Tjek om det er den sidste admin
        if membership.role == 'ADMIN' and WorkspaceMembership.objects.filter(company=company, role='ADMIN').count() == 1:
            return Response({'error': 'Du er den sidste administrator. Udpeg en anden administrator før du forlader arbejdsrummet.'}, status=400)
            
        membership.delete()
        return Response({'status': 'Du har forladt arbejdsrummet'})

    @action(detail=True, methods=['get'])
    def check_leave(self, request, pk=None):
        company = self.get_object()
        membership = WorkspaceMembership.objects.filter(company=company, user=request.user).first()
        if not membership:
            return Response({'can_leave': False, 'error': 'Medlemskab ikke fundet.'})
        
        if membership.role == 'ADMIN' and WorkspaceMembership.objects.filter(company=company, role='ADMIN').count() == 1:
            return Response({
                'can_leave': False, 
                'error': 'Du er den sidste administrator. Udpeg en anden administrator før du forlader.'
            })
            
        return Response({'can_leave': True})

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user
        base_qs = User.objects.all().prefetch_related('teams', 'memberships', 'memberships__company')
        
        company = get_active_company(self.request)
        if company:
            base_qs = base_qs.filter(memberships__company=company)
            
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            base_qs = base_qs.filter(is_active=is_active.lower() == 'true')
            
        return base_qs.distinct()

    def get_permissions(self):
        if self.action == 'create':
            # Only Admin and Superuser can create users
            return [permissions.IsAuthenticated(), IsAdminOrSuperUser()]
        return super().get_permissions()

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        # We fetch the user through the queryset to use prefetch_related optimizations
        user = self.get_queryset().get(id=request.user.id)
        
        if request.method == 'PATCH':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
            
        serializer = self.get_serializer(user)
        return Response(serializer.data)

class IsAdminOrSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user.is_superuser:
            return True
        m = get_active_membership(request)
        return m and m.role in ['ADMIN', 'SUPERUSER']

class WorkspaceMembershipViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkspaceMembershipSerializer
    queryset = WorkspaceMembership.objects.all()

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        company = get_active_company(request)
        if not company:
            return Response({'detail': 'Ingen aktiv virksomhed.'}, status=400)
        
        membership = WorkspaceMembership.objects.get(user=request.user, company=company)
        
        if request.method == 'PATCH':
            serializer = self.get_serializer(membership, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
            
        serializer = self.get_serializer(membership)
        return Response(serializer.data)

class TeamViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TeamSerializer
    queryset = Team.objects.all()

    def get_queryset(self):
        return super().get_queryset().prefetch_related('medlemmer')

    def perform_create(self, serializer):
        team = serializer.save()
        team.medlemmer.add(self.request.user)
        # Apply company to team
        company = get_active_company(self.request)
        if company:
            team.company = company
            team.save()

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def global_search(request):
    query = request.query_params.get('q', '').strip().lower()
    if not query:
        return Response([])

    user = request.user
    results = []
    
    from opgaver.models import Opgave
    from django.db.models import Q
    opgave_qs = Opgave.objects.prefetch_related('team')
    company = get_active_company(request)
    membership = get_active_membership(request)
    if company:
        opgave_qs = opgave_qs.filter(company=company)
        
    is_admin = user.is_superuser or (membership and membership.role == 'ADMIN')
    
    if not is_admin:
        opgave_qs = opgave_qs.filter(Q(team__medlemmer=user) | Q(team__isnull=True)).distinct()
        
    opgave_matches = opgave_qs.filter(Q(titel__icontains=query) | Q(beskrivelse__icontains=query))
    
    for obj in opgave_matches[:20]:
        score = 0
        titel_lower = obj.titel.lower()
        # Scoring
        if query == titel_lower: score += 100
        elif titel_lower.startswith(query): score += 70
        elif query in titel_lower: score += 50
        
        if query in obj.beskrivelse.lower(): score += 20
        
        results.append({
            'type': 'opgave',
            'id': obj.id,
            'title': obj.titel,
            'subtitle': obj.team.navn if obj.team else 'Personlig',
            'score': score,
            'url': f'/?id={obj.id}' # OpgaverPage handles ?id=
        })

    # 2. SEARCH KNOWLEDGE BASE (VIDENSBANK)
    from vidensbank.models import Viden
    viden_qs = Viden.objects.filter(arkiveret=False, slettet=False).select_related('kategori')
    if company:
        viden_qs = viden_qs.filter(company=company)
    
    # Private filtering: Only see public OR own private
    viden_qs = viden_qs.filter(
        Q(kategori__er_privat=False) | Q(oprettet_af=user)
    )
    
    viden_matches = viden_qs.filter(Q(titel__icontains=query) | Q(indhold__icontains=query))
    
    for obj in viden_matches[:20]:
        score = 0
        titel_lower = obj.titel.lower()
        if query == titel_lower: score += 100
        elif titel_lower.startswith(query): score += 70
        elif query in titel_lower: score += 50
        
        if query in obj.indhold.lower(): score += 20
        
        results.append({
            'type': 'viden',
            'id': obj.id,
            'title': obj.titel,
            'subtitle': obj.kategori.navn,
            'score': score,
            'url': f'/vidensbank?id={obj.id}'
        })

    # 3. SEARCH BILLING CODES (TIDSREGISTRERING)
    from tidsregistrering.models import OpgaverKode
    kode_qs = OpgaverKode.objects.all()
    if company:
        kode_qs = kode_qs.filter(company=company)
    
    kode_matches = kode_qs.filter(Q(kode_nr__icontains=query) | Q(beskrivelse__icontains=query))
    
    for obj in kode_matches[:10]:
        score = 0
        if query == obj.kode_nr.lower(): score += 110 # Codes are very specific
        elif obj.kode_nr.lower().startswith(query): score += 80
        elif query in obj.beskrivelse.lower(): score += 40
        
        results.append({
            'type': 'tidsreg',
            'id': obj.id,
            'title': f"{obj.kode_nr} - {obj.beskrivelse}",
            'subtitle': 'Tidsregistrering',
            'score': score,
            'url': f'/tidsregistrering?kode={obj.kode_nr}'
        })

    # Sort results by score
class InvitationViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InvitationSerializer
    queryset = Invitation.objects.all()

    def _send_invitation_simulation(self, inv):
        host = self.request.get_host()
        proto = 'https' if self.request.is_secure() else 'http'
        accept_url = f"{proto}://{host}/accept-invitation/{inv.token}"
        if 'localhost:8030' in host or '127.0.0.1:8030' in host:
            accept_url = f"http://localhost:5180/accept-invitation/{inv.token}"

        print(f"\n--- INVITATION SENDT ---")
        print(f"Til: {inv.email}")
        print(f"Fra: {inv.invited_by.username} ({inv.company.navn})")
        print(f"Link: {accept_url}")
        print(f"------------------------\n")

        # Determine language (user if registered, otherwise sender)
        target_user = User.objects.filter(email__iexact=inv.email).first()
        if not target_user:
            target_user = inv.invited_by

        default_subject = f"Invitation til at deltage i {inv.company.navn} på Centralen"
        default_body = (
            f"Hej,\n\n"
            f"Du er blevet inviteret af {inv.invited_by.first_name or inv.invited_by.username} til at deltage i arbejdsrummet \"{inv.company.navn}\" på Centralen.\n\n"
            f"Du kan acceptere invitationen ved at klikke på følgende link:\n"
            f"{accept_url}\n\n"
            f"Med venlig hilsen,\n"
            f"Centralen"
        )
        try:
            send_localized_email(
                user=target_user,
                subject_key='email.invitation.subject',
                body_key='email.invitation.body',
                context={
                    'sender': inv.invited_by.first_name or inv.invited_by.username,
                    'workspace': inv.company.navn,
                    'link': accept_url
                },
                request=self.request,
                default_subject=default_subject,
                default_body=default_body,
                recipient_email=inv.email
            )
        except Exception as e:
            print(f"Error sending invitation email: {e}")

    def perform_create(self, serializer):
        company = get_active_company(self.request)
        if not company:
            raise exceptions.ValidationError({"detail": "Du skal være i et arbejdsrum for at invitere nogen."})
        
        # Check if user with this email is already a member
        email = serializer.validated_data.get('email').lower()
        if WorkspaceMembership.objects.filter(company=company, user__email__iexact=email).exists():
            raise exceptions.ValidationError({"detail": ["Brugeren er allerede medlem af dette arbejdsrum."]})

        # Check if an invitation already exists for this email
        if Invitation.objects.filter(company=company, email__iexact=email, used_at__isnull=True).exists():
            raise exceptions.ValidationError({"detail": ["Der er allerede sendt en aktiv invitation til denne e-mail."]})

        # Save the invitation
        inv = serializer.save(company=company, invited_by=self.request.user)
        self._send_invitation_simulation(inv)

    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        inv = self.get_object()
        if inv.used_at:
            return Response({'error': 'Invitationen er allerede brugt.'}, status=400)
        self._send_invitation_simulation(inv)
        return Response({'status': 'Invitation sendt igen!'})

    def get_queryset(self):
        # Only show pending invitations
        return super().get_queryset().filter(used_at__isnull=True)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.used_at:
            return Response({'error': 'Allerede brugt.'}, status=400)
        return super().destroy(request, *args, **kwargs)

@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def accept_invitation(request, token):
    inv = Invitation.objects.filter(token=token, used_at__isnull=True).first()
    if not inv:
        return Response({'error': 'Invitationen er ugyldig eller allerede brugt.'}, status=404)

    if request.method == 'GET':
        # Return info about the invitation
        return Response({
            'email': inv.email,
            'company_name': inv.company.navn,
            'role': inv.role
        })

    if request.method == 'POST':
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')

        # Check if user exists
        user = User.objects.filter(email=inv.email).first()
        
        if not user:
            # Create user
            if not password:
                return Response({'error': 'Du skal vælge en adgangskode.'}, status=400)
            
            # Use email prefix as username for now (Django requires a unique username)
            username = inv.email.split('@')[0]
            # Ensure uniqueness
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            user = User.objects.create_user(
                username=username,
                email=inv.email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
        else:
            # User exists, just update info if provided and not set
            if first_name and not user.first_name: user.first_name = first_name
            if last_name and not user.last_name: user.last_name = last_name
            user.save()

        # Create membership
        WorkspaceMembership.objects.get_or_create(
            user=user,
            company=inv.company,
            defaults={
                'role': inv.role,
                'alias': f"{user.first_name} {user.last_name}".strip() or user.username,
                'color': '#3b82f6'
            }
        )

        # Mark invitation as used
        from django.utils import timezone
        inv.used_at = timezone.now()
        inv.save()

        # Log the user in
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')

        return Response({
            'status': 'Invitation accepteret!', 
            'user_id': user.id,
            'company_id': str(inv.company.id)
        })
    
    return Response(results[:30])

@api_view(['GET'])
@permission_classes([AllowAny])
def get_translations_view(request):
    lang = request.query_params.get('lang', 'da')
    translations = UITranslation.objects.all()
    
    data = {}
    for t in translations:
        # Fallback to English if the requested language is missing
        val = getattr(t, lang, None) or t.en
        data[t.key] = val

    response = Response(data)
    response['Cache-Control'] = 'no-store'
    return response

class WorkspaceRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = WorkspaceRequestSerializer
    queryset = WorkspaceRequest.objects.all()

    def perform_create(self, serializer):
        req = serializer.save()
        # Simulate email
        host = self.request.get_host()
        proto = 'https' if self.request.is_secure() else 'http'
        confirm_url = f"{proto}://{host}/confirm-workspace/{req.token}"
        if 'localhost:8030' in host or '127.0.0.1:8030' in host:
            confirm_url = f"http://localhost:5180/confirm-workspace/{req.token}"

        print(f"\n--- ARBEJDSRUM FORESPØRGSEL MODTAGET ---")
        print(f"E-mail: {req.email}")
        print(f"Navn: {req.company_name}")
        print(f"Bekræft link: {confirm_url}")
        print(f"----------------------------------------\n")

    @action(detail=False, methods=['get', 'post'], url_path='confirm/(?P<token>[^/.]+)')
    def confirm(self, request, token=None):
        request_obj = WorkspaceRequest.objects.filter(token=token, confirmed_at__isnull=True).first()
        if not request_obj:
            return Response({'error': 'Anmodningen er ugyldig eller allerede bekræftet.'}, status=404)

        user_exists = User.objects.filter(email=request_obj.email).exists()

        if request.method == 'GET':
            return Response({
                'email': request_obj.email,
                'company_name': request_obj.company_name,
                'user_exists': user_exists
            })

        if request.method == 'POST':
            password = request.data.get('password')
            first_name = request.data.get('first_name', '')
            last_name = request.data.get('last_name', '')

            if not user_exists and not password:
                return Response({'error': 'Du skal angive en adgangskode.'}, status=400)

            # 1. Create Company
            company = Company.objects.create(navn=request_obj.company_name)
            
            # 2. Get or Create User
            if user_exists:
                user = User.objects.get(email=request_obj.email)
            else:
                username = request_obj.email.split('@')[0]
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=request_obj.email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name
                )
                # Set initial role to ADMIN in profile for generic staff access if needed
                user.profile.role = 'ADMIN'
                user.is_staff = True
                user.is_superuser = True # First owner usually is
                user.save()

            # 3. Create Membership
            WorkspaceMembership.objects.create(
                user=user,
                company=company,
                role='ADMIN',
                alias=f"{user.first_name} {user.last_name}".strip() or user.username,
                color='#3b82f6'
            )

            # 4. Create Defaults (Already handled by CompanyViewSet.perform_create if we used it, but here we create manually)
            from vidensbank.models import VidensKategori
            Team.objects.create(navn="Generelt", company=company, color="#3b82f6")
            VidensKategori.objects.create(navn="Generelt", company=company, farve="#2563eb")

            # 5. Mark confirmed
            from django.utils import timezone
            request_obj.confirmed_at = timezone.now()
            request_obj.save()

            # 6. Login
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')

            return Response({'status': 'Arbejdsrum oprettet!', 'workspace_id': str(company.id)})


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([AnonRateThrottle])
def register_user(request):
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password')
    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()
    website = request.data.get('website', '') # Honeypot

    # Honeypot validation: if filled, act as if it succeeded but do nothing
    if website:
        return Response({
            'status': 'success',
            'message': 'Bruger oprettet! Tjek din e-mail for et aktiveringslink.'
        }, status=200)

    if not email or not password or not username:
        return Response({'error': 'Brugernavn, e-mail og adgangskode skal angives.', 'code': 'missing_fields'}, status=400)

    if User.objects.filter(username__iexact=username).exists():
        return Response({'error': 'Brugernavnet er allerede i brug.', 'code': 'username_taken'}, status=400)

    existing_by_email = User.objects.filter(email__iexact=email).first()
    if existing_by_email:
        if existing_by_email.is_active:
            return Response({'error': 'E-mailadressen er allerede registreret.', 'code': 'email_taken'}, status=400)
        return Response({'error': 'E-mailadressen er allerede registreret, men kontoen er endnu ikke aktiveret.', 'code': 'email_pending_activation'}, status=400)

    # Create the user but inactive
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    user.is_active = False
    user.save()

    # Save preferred language on the profile
    language = request.data.get('language', 'da').strip().lower()
    if hasattr(user, 'profile'):
        user.profile.language = language
        user.profile.save()

    _send_activation_email(user, request)

    return Response({
        'status': 'success',
        'message': 'Bruger oprettet! Tjek din e-mail for et aktiveringslink.'
    })


def send_localized_email(user, subject_key, body_key, context, request, default_subject, default_body, recipient_email=None):
    from core.models import UITranslation
    # Get user preferred language (defaults to 'da')
    lang_code = 'da'
    if hasattr(user, 'profile') and user.profile.language:
        # Strip potential region tag (e.g. 'da-DK' -> 'da')
        lang_code = user.profile.language.split('-')[0].lower()
    
    # Ensure lang_code is one of the supported columns
    if lang_code not in ('en', 'da', 'nl', 'fr', 'de'):
        lang_code = 'da'

    # Retrieve subject
    subject_obj = UITranslation.objects.filter(key=subject_key).first()
    subject_text = default_subject
    if subject_obj:
        translated_subject = getattr(subject_obj, lang_code, None)
        if translated_subject and translated_subject.strip() not in ('', '-'):
            subject_text = translated_subject
        elif subject_obj.en:
            subject_text = subject_obj.en

    # Retrieve body
    body_obj = UITranslation.objects.filter(key=body_key).first()
    body_text = default_body
    if body_obj:
        translated_body = getattr(body_obj, lang_code, None)
        if translated_body and translated_body.strip() not in ('', '-'):
            body_text = translated_body
        elif body_obj.en:
            body_text = body_obj.en

    # Replace placeholders
    for k, v in context.items():
        placeholder = "{{" + k + "}}"
        subject_text = subject_text.replace(placeholder, str(v))
        body_text = body_text.replace(placeholder, str(v))

    to_email = recipient_email or user.email
    send_mail(
        subject_text,
        body_text,
        None,
        [to_email],
        fail_silently=False
    )


def _send_activation_email(user, request):
    token = signing.dumps({'user_id': user.id})

    host = request.get_host()
    proto = 'https' if request.is_secure() else 'http'
    activate_url = f"{proto}://{host}/activate-account/{token}"
    if 'localhost:8030' in host or '127.0.0.1:8030' in host:
        activate_url = f"http://localhost:5180/activate-account/{token}"

    print(f"DEBUG: ACTIVATION LINK FOR {user.email}: {activate_url}")

    default_subject = "Aktiver din konto på Centralen"
    default_body = (
        f"Hej {user.first_name or user.username},\n\n"
        f"Her er dit aktiveringslink til Centralen:\n"
        f"{activate_url}\n\n"
        f"Hvis du ikke har oprettet denne konto, kan du roligt ignorere denne e-mail.\n\n"
        f"Med venlig hilsen,\n"
        f"Centralen"
    )
    try:
        send_localized_email(
            user=user,
            subject_key='email.activation.subject',
            body_key='email.activation.body',
            context={
                'name': user.first_name or user.username,
                'link': activate_url
            },
            request=request,
            default_subject=default_subject,
            default_body=default_body
        )
    except Exception as e:
        print(f"Error sending activation email: {e}")


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([AnonRateThrottle])
def resend_activation_view(request):
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'E-mail skal angives.', 'code': 'email_required'}, status=400)

    user = User.objects.filter(email__iexact=email, is_active=False).first()
    if user:
        _send_activation_email(user, request)

    # Always return success, regardless of whether the account exists,
    # to avoid leaking which email addresses are registered.
    return Response({'status': 'success'})


def _create_default_workspace(user):
    lang = getattr(user, 'profile', None).language if hasattr(user, 'profile') else 'da'
    
    names = {
        'da': 'Mit Lab',
        'en': 'My Lab',
        'nl': 'Mijn Lab',
        'fr': 'Mon Lab',
        'de': 'Mein Lab'
    }
    company_name = names.get(lang, 'Mit Lab')

    # 1. Create company
    company = Company.objects.create(navn=company_name)

    # 2. Create membership
    WorkspaceMembership.objects.create(
        user=user,
        company=company,
        role='ADMIN',
        alias=f"{user.first_name} {user.last_name}".strip() or user.username,
        color='#3b82f6'
    )

    # 3. Create default General team
    Team.objects.create(navn="Generelt", company=company, color="#3b82f6")

    # 4. Create default General category
    VidensKategori.objects.create(navn="Generelt", company=company, farve="#2563eb")
    
    return company


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def activate_user(request, token):
    try:
        # Load token, max age of 24 hours (86400 seconds)
        data = signing.loads(token, max_age=86400)
        user_id = data['user_id']
    except signing.SignatureExpired:
        return Response({'error': 'Aktiveringslinket er udløbet (maks. 24 timer).', 'code': 'activation_link_expired'}, status=400)
    except signing.BadSignature:
        return Response({'error': 'Ugyldigt aktiveringslink.', 'code': 'activation_link_invalid'}, status=400)

    user = User.objects.filter(id=user_id).first()
    if not user:
        return Response({'error': 'Brugeren blev ikke fundet.', 'code': 'user_not_found'}, status=404)

    if not user.is_active:
        user.is_active = True
        user.save()
        _create_default_workspace(user)

    # Log user in
    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    
    # Return user details
    serializer = UserSerializer(user)
    return Response({
        'status': 'Konto aktiveret!',
        'user': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_invitations_view(request):
    user = request.user
    invitations = Invitation.objects.filter(email__iexact=user.email, used_at__isnull=True)
    results = []
    for inv in invitations:
        results.append({
            'id': inv.id,
            'company_name': inv.company.navn,
            'role': inv.role,
            'invited_by': inv.invited_by.username if inv.invited_by else 'System',
            'token': str(inv.token)
        })
    return Response(results)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_my_invitation_view(request, pk):
    user = request.user
    inv = Invitation.objects.filter(id=pk, email__iexact=user.email, used_at__isnull=True).first()
    if not inv:
        return Response({'error': 'Invitationen blev ikke fundet eller er allerede accepteret.'}, status=404)

    # Create workspace membership
    WorkspaceMembership.objects.get_or_create(
        user=user,
        company=inv.company,
        defaults={
            'role': inv.role,
            'alias': f"{user.first_name} {user.last_name}".strip() or user.username,
            'color': '#3b82f6'
        }
    )

    # Mark invitation as used
    from django.utils import timezone
    inv.used_at = timezone.now()
    inv.save()

    return Response({'status': 'success', 'workspace_id': str(inv.company.id)})


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([AnonRateThrottle])
def request_password_reset_view(request):
    from core.models import PasswordResetRequest
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'E-mail skal angives.'}, status=400)

    user = User.objects.filter(email__iexact=email).first()
    if user:
        # Create reset request
        reset_req = PasswordResetRequest.objects.create(user=user)
        
        # Build reset url
        host = request.get_host()
        reset_url = f"https://{host}/reset-password/{reset_req.token}"
        if 'localhost:8030' in host or '127.0.0.1:8030' in host:
            reset_url = f"http://localhost:5180/reset-password/{reset_req.token}"

        print(f"DEBUG: PASSWORD RESET LINK FOR {user.email}: {reset_url}")

        default_subject = "Nulstil din adgangskode på Centralen"
        default_body = (
            f"Hej {user.first_name or user.username},\n\n"
            f"Du har anmodet om at nulstille din adgangskode på Centralen.\n"
            f"Du kan nulstille din adgangskode ved at klikke på følgende link:\n"
            f"{reset_url}\n\n"
            f"Dette link er aktivt i 24 timer.\n\n"
            f"Hvis du ikke har anmodet om at nulstille din adgangskode, kan du roligt ignorere denne e-mail.\n\n"
            f"Med venlig hilsen,\n"
            f"Centralen"
        )
        try:
            send_localized_email(
                user=user,
                subject_key='email.password_reset.subject',
                body_key='email.password_reset.body',
                context={
                    'name': user.first_name or user.username,
                    'link': reset_url
                },
                request=request,
                default_subject=default_subject,
                default_body=default_body
            )
        except Exception as e:
            print(f"Error sending password reset email: {e}")

    # Return success always to protect privacy (User Enumeration protection)
    return Response({'status': 'success', 'message': 'Hvis din e-mailadresse findes i vores system, har vi sendt dig et link til at nulstille din adgangskode.'})


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def reset_password_view(request):
    from core.models import PasswordResetRequest
    from django.utils import timezone
    from datetime import timedelta
    
    token = request.data.get('token', '').strip()
    password = request.data.get('password', '').strip()
    
    if not token or not password:
        return Response({'error': 'Token og ny adgangskode skal angives.'}, status=400)
        
    try:
        reset_req = PasswordResetRequest.objects.get(token=token, used_at__isnull=True)
    except (PasswordResetRequest.DoesNotExist, ValueError):
        return Response({'error': 'Nulstillingslinket er ugyldigt eller har allerede været brugt.', 'code': 'invalid_token'}, status=400)
        
    # Check expiration (24 hours)
    if timezone.now() > reset_req.created_at + timedelta(hours=24):
        return Response({'error': 'Nulstillingslinket er udløbet (maks. 24 timer).', 'code': 'expired_token'}, status=400)
        
    # Reset password
    user = reset_req.user
    user.set_password(password)
    user.save()
    
    # Mark request as used
    reset_req.used_at = timezone.now()
    reset_req.save()
    
    return Response({'status': 'success', 'message': 'Din adgangskode er blevet nulstillet.'})
