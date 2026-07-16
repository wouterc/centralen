from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import KoderGrupper, OpgaverKode, Tidreg, BrugerProfilTime, BrugerIndstillingTime
from .serializers import (
    KoderGrupperSerializer, OpgaverKodeSerializer, TidregSerializer, 
    BrugerProfilTimeSerializer, BrugerIndstillingTimeSerializer
)
from core.mixins import CompanyFilterMixin, get_active_membership, get_active_company

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        membership = get_active_membership(request)
        return bool(membership and membership.role in ['ADMIN', 'SUPERUSER'])

class KoderGrupperViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    queryset = KoderGrupper.objects.all()
    serializer_class = KoderGrupperSerializer
    permission_classes = [IsAdminOrReadOnly]

class OpgaverKodeViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    queryset = OpgaverKode.objects.select_related('gruppe').all()
    serializer_class = OpgaverKodeSerializer
    permission_classes = [IsAdminOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        used_in_tidreg = instance.registreringer.exists()
        used_in_profile = BrugerProfilTime.objects.filter(opgave_kode=instance).exists()
        
        if used_in_tidreg or used_in_profile:
            return Response(
                {"detail": "Denne kode kan ikke slettes, da den er i brug i tidsregistreringer eller favoritlister."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='export-csv')
    def export_csv(self, request):
        import csv
        from django.http import HttpResponse
        
        queryset = self.get_queryset()
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="opgavekoder.csv"'
        response.write(u'\ufeff'.encode('utf8')) # UTF-8 BOM
        
        writer = csv.writer(response, delimiter=';')
        writer.writerow(['kode_nr', 'beskrivelse', 'gruppe'])
        
        for item in queryset:
            gruppe_str = item.gruppe.gruppe if item.gruppe else ''
            writer.writerow([item.kode_nr, item.beskrivelse, gruppe_str])
            
        return response

    @action(detail=False, methods=['post'], url_path='import-csv')
    def import_csv(self, request):
        import csv
        import io
        
        company = get_active_company(request)
        if not company:
            return Response({"error": "Ingen aktiv arbejdsplads fundet."}, status=400)
            
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({"error": "Ingen fil uploadet."}, status=400)
            
        try:
            file_data = csv_file.read().decode('utf-8-sig')
        except Exception:
            try:
                file_data = csv_file.read().decode('latin-1')
            except Exception:
                return Response({"error": "Kunne ikke afkode fil. Sørg for at den er i UTF-8 eller Latin-1 format."}, status=400)
                
        io_string = io.StringIO(file_data)
        dialect = ';'
        first_line = io_string.readline()
        if ',' in first_line and ';' not in first_line:
            dialect = ','
        io_string.seek(0)
        
        reader = csv.reader(io_string, delimiter=dialect)
        header = next(reader, None)
        
        kode_idx, besk_idx, gruppe_idx = -1, -1, -1
        if header:
            header_lower = [h.strip().lower() for h in header]
            for idx, col in enumerate(header_lower):
                if col in ['kode_nr', 'code', 'kode', 'kodenr', 'kode_no', 'nr']:
                    kode_idx = idx
                elif col in ['beskrivelse', 'description', 'navn', 'name', 'desc']:
                    besk_idx = idx
                elif col in ['gruppe', 'group', 'gruppekode', 'gruppe_kode']:
                    gruppe_idx = idx
        
        if kode_idx == -1:
            kode_idx = 0
        if besk_idx == -1:
            besk_idx = 1
        if gruppe_idx == -1 and header and len(header) > 2:
            gruppe_idx = 2
            
        created_count = 0
        skipped_count = 0
        
        for row in reader:
            if not row or len(row) <= max(kode_idx, besk_idx):
                continue
            
            kode_nr = row[kode_idx].strip()
            beskrivelse = row[besk_idx].strip() if len(row) > besk_idx else ''
            
            if not kode_nr:
                continue
                
            if OpgaverKode.objects.filter(company=company, kode_nr=kode_nr).exists():
                skipped_count += 1
                continue
                
            gruppe_obj = None
            if gruppe_idx != -1 and len(row) > gruppe_idx:
                gruppe_val = row[gruppe_idx].strip()
                if gruppe_val:
                    gruppe_obj, _ = KoderGrupper.objects.get_or_create(
                        company=company,
                        gruppe=gruppe_val,
                        defaults={'beskrivelse': gruppe_val}
                    )
            
            OpgaverKode.objects.create(
                company=company,
                kode_nr=kode_nr,
                beskrivelse=beskrivelse,
                gruppe=gruppe_obj
            )
            created_count += 1
            
        return Response({
            "created": created_count,
            "skipped": skipped_count,
            "message": f"{created_count} koder oprettet, {skipped_count} sprunget over (allerede eksisterende)."
        }, status=200)

class TidregViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    queryset = Tidreg.objects.all()
    serializer_class = TidregSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = {
        'fra_tid': ['exact', 'gte', 'lte', 'gt', 'lt'],
    }

    def get_queryset(self):
        qs = super().get_queryset().select_related('bruger', 'opgave_kode', 'opgave_kode__gruppe')
        user = self.request.user
        
        membership = get_active_membership(self.request)
        is_admin = user.is_superuser or (membership and membership.role == 'ADMIN')
        
        if self.request.query_params.get('all_users') == 'true':
            if is_admin:
                return qs
            else:
                fav_code_ids = BrugerProfilTime.objects.filter(bruger=user).values_list('opgave_kode_id', flat=True)
                return qs.filter(opgave_kode_id__in=fav_code_ids)
                
        return qs.filter(bruger=user)

    def perform_create(self, serializer):
        company = get_active_company(self.request)
        serializer.save(bruger=self.request.user, company=company)

class BrugerProfilTimeViewSet(viewsets.ModelViewSet):
    serializer_class = BrugerProfilTimeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        company = get_active_company(self.request)
        return BrugerProfilTime.objects.select_related('bruger', 'opgave_kode').filter(
            bruger=self.request.user,
            opgave_kode__company=company
        )

    def perform_create(self, serializer):
        serializer.save(bruger=self.request.user)

class BrugerIndstillingTimeViewSet(viewsets.ModelViewSet):
    serializer_class = BrugerIndstillingTimeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BrugerIndstillingTime.objects.filter(bruger=self.request.user)

    def perform_create(self, serializer):
        serializer.save(bruger=self.request.user)
