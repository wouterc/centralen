from rest_framework import viewsets, permissions
from .models import KoderGrupper, OpgaverKode, Tidreg, BrugerProfilTime, BrugerIndstillingTime
from .serializers import (
    KoderGrupperSerializer, OpgaverKodeSerializer, TidregSerializer, 
    BrugerProfilTimeSerializer, BrugerIndstillingTimeSerializer
)

class KoderGrupperViewSet(viewsets.ModelViewSet):
    queryset = KoderGrupper.objects.all()
    serializer_class = KoderGrupperSerializer
    permission_classes = [permissions.IsAuthenticated]

class OpgaverKodeViewSet(viewsets.ModelViewSet):
    queryset = OpgaverKode.objects.select_related('gruppe').all()
    serializer_class = OpgaverKodeSerializer
    permission_classes = [permissions.IsAuthenticated]

class TidregViewSet(viewsets.ModelViewSet):
    serializer_class = TidregSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = {
        'fra_tid': ['exact', 'gte', 'lte', 'gt', 'lt'],
    }

    def get_queryset(self):
        return Tidreg.objects.select_related('bruger', 'opgave_kode').filter(bruger=self.request.user)

    def perform_create(self, serializer):
        serializer.save(bruger=self.request.user)

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
