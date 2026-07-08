from django.contrib.auth.models import User
from rest_framework import viewsets, permissions
from rest_framework.decorators import action, authentication_classes
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


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    user = authenticate(request, email=email, password=password)
    if user is not None:
        login(request, user)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    return Response({'detail': 'Ugyldigt email eller adgangskode'}, status=401)

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
        
    return Response(data)

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
