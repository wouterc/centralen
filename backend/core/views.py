from django.contrib.auth.models import User
from rest_framework import viewsets, permissions
from rest_framework.decorators import action, authentication_classes
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from .models import Team
from .serializers import UserSerializer, TeamSerializer
from .mixins import CompanyFilterMixin

from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import os


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    return Response({'detail': 'Ugyldigt brugernavn eller adgangskode'}, status=401)

@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'status': 'logged out'})

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user
        base_qs = User.objects.all().prefetch_related('teams')
        
        if hasattr(user, 'profile') and user.profile.company:
            base_qs = base_qs.filter(profile__company=user.profile.company)
            
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            base_qs = base_qs.filter(is_active=is_active.lower() == 'true')
            
        return base_qs.distinct()

    def get_permissions(self):
        if self.action == 'create':
            # Only Admin and Superuser can create users
            return [permissions.IsAuthenticated(), IsAdminOrSuperUser()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class IsAdminOrSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return user.is_superuser or (hasattr(user, 'profile') and user.profile.role in ['ADMIN', 'SUPERUSER'])

class TeamViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TeamSerializer
    queryset = Team.objects.all()

    def get_queryset(self):
        return super().get_queryset().prefetch_related('medlemmer')

    def perform_create(self, serializer):
        team = serializer.save()
        team.medlemmer.add(self.request.user)
        # Apply company to team will be handled in perform_create but since we override it, we need to explicitly call mixin or just set it:
        if hasattr(self.request.user, 'profile') and self.request.user.profile.company:
            team.company = self.request.user.profile.company
            team.save()

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def global_search(request):
    query = request.query_params.get('q', '').strip().lower()
    if not query:
        return Response([])

    user = request.user
    results = []
    
    # 1. SEARCH TASKS (OPGAVER)
    # Check if admin
    is_admin = user.is_superuser or (hasattr(user, 'profile') and user.profile.role == 'ADMIN')
    
    from opgaver.models import Opgave
    from django.db.models import Q
    
    opgave_qs = Opgave.objects.prefetch_related('team')
    if hasattr(user, 'profile') and user.profile.company:
        opgave_qs = opgave_qs.filter(company=user.profile.company)
        
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
    if hasattr(user, 'profile') and user.profile.company:
        viden_qs = viden_qs.filter(company=user.profile.company)
    
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
    kode_matches = OpgaverKode.objects.filter(Q(kode_nr__icontains=query) | Q(beskrivelse__icontains=query))
    
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
    results.sort(key=lambda x: x['score'], reverse=True)
    
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
