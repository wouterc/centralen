from rest_framework import viewsets
from .models import Aktivitet, AarshjulGruppe
from .serializers import AktivitetSerializer, AarshjulGruppeSerializer
from django.db.models import Q

class AarshjulGruppeViewSet(viewsets.ModelViewSet):
    queryset = AarshjulGruppe.objects.all()
    serializer_class = AarshjulGruppeSerializer

    def get_queryset(self):
        queryset = AarshjulGruppe.objects.all()
        team_id = self.request.query_params.get('team_id')
        user = self.request.user
        
        if team_id and team_id != '0':
            queryset = queryset.filter(teams__id=team_id)
        elif not user.is_superuser and not (hasattr(user, 'profile') and user.profile.role == 'ADMIN'):
            # If "Alle teams" (team_id is 0 or missing), show groups associated with user's teams
            queryset = queryset.filter(teams__medlemmer=user).distinct()
            
        return queryset

class AktivitetViewSet(viewsets.ModelViewSet):
    queryset = Aktivitet.objects.all()
    serializer_class = AktivitetSerializer

    def get_queryset(self):
        queryset = Aktivitet.objects.all()
        team_id = self.request.query_params.get('team_id')
        user = self.request.user
        
        if team_id and team_id != '0':
            queryset = queryset.filter(Q(gruppe__teams__id=team_id) | Q(gruppe__isnull=True))
        elif not user.is_superuser and not (hasattr(user, 'profile') and user.profile.role == 'ADMIN'):
            # If "Alle teams", show activities in user's teams OR unassigned
            queryset = queryset.filter(Q(gruppe__teams__medlemmer=user) | Q(gruppe__isnull=True)).distinct()
            
        return queryset
