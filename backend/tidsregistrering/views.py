from rest_framework import viewsets, permissions
from .models import KoderGrupper, OpgaverKode, Tidreg, BrugerProfilTime, BrugerIndstillingTime
from .serializers import (
    KoderGrupperSerializer, OpgaverKodeSerializer, TidregSerializer, 
    BrugerProfilTimeSerializer, BrugerIndstillingTimeSerializer
)
from core.mixins import CompanyFilterMixin

class KoderGrupperViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    queryset = KoderGrupper.objects.all()
    serializer_class = KoderGrupperSerializer
    permission_classes = [permissions.IsAuthenticated]

class OpgaverKodeViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    queryset = OpgaverKode.objects.select_related('gruppe').all()
    serializer_class = OpgaverKodeSerializer
    permission_classes = [permissions.IsAuthenticated]

class TidregViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    queryset = Tidreg.objects.all()
    serializer_class = TidregSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = {
        'fra_tid': ['exact', 'gte', 'lte', 'gt', 'lt'],
    }

    def get_queryset(self):
        return super().get_queryset().select_related('bruger', 'opgave_kode').filter(bruger=self.request.user)

    def perform_create(self, serializer):
        company = self.request.user.profile.company if hasattr(self.request.user, 'profile') else None
        serializer.save(bruger=self.request.user, company=company)

class BrugerProfilTimeViewSet(viewsets.ModelViewSet):
    serializer_class = BrugerProfilTimeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BrugerProfilTime.objects.select_related('bruger', 'opgave_kode').filter(bruger=self.request.user)

    def perform_create(self, serializer):
        serializer.save(bruger=self.request.user)

class BrugerIndstillingTimeViewSet(viewsets.ModelViewSet):
    serializer_class = BrugerIndstillingTimeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BrugerIndstillingTime.objects.filter(bruger=self.request.user)

    def perform_create(self, serializer):
        serializer.save(bruger=self.request.user)
