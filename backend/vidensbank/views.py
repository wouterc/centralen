from django.db.models import Count
from rest_framework import viewsets, filters, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from .models import VidensKategori, Viden, HjaelpPunkt, HjaelpPunktViden
from .serializers import VidensKategoriSerializer, VidenSerializer, HjaelpPunktSerializer
from core.mixins import CompanyFilterMixin, get_active_membership

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write operations require admin role
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        membership = get_active_membership(request)
        return bool(membership and membership.role in ['ADMIN', 'SUPERUSER'])

class VidensKategoriViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    queryset = VidensKategori.objects.all()
    serializer_class = VidensKategoriSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        from django.db.models import Q, Count
        
        # 1. Definer filter (hvad må brugeren se?)
        membership = get_active_membership(self.request)
        is_admin = user.is_superuser or (membership and membership.role == 'ADMIN')
        
        # Almindelige brugere ser: (Ikke-arkiveret AND (Offentlig Kat OR Eget dokument))
        if is_admin:
            article_filter = Q(artikler__arkiveret=False, artikler__slettet=False)
        elif user.is_authenticated:
            article_filter = Q(artikler__arkiveret=False, artikler__slettet=False) & (Q(artikler__kategori__er_privat=False) | Q(artikler__oprettet_af=user))
        else:
            article_filter = Q(artikler__arkiveret=False, artikler__slettet=False) & Q(artikler__kategori__er_privat=False)
            
        # 2. Annoter kategorier med sikker optælling
        qs = super().get_queryset().annotate(
            artikler_count=Count('artikler', filter=article_filter),
            total_artikler_count=Count('artikler')
        )
        
        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if category has articles
        has_articles = instance.artikler.exists()
        if has_articles:
            reassign_to_id = request.data.get('reassign_to') or request.query_params.get('reassign_to')
            if not reassign_to_id:
                return Response(
                    {"detail": "Denne kategori indeholder artikler. Vælg venligst en anden kategori at flytte dem til."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                from core.mixins import get_active_company
                company = get_active_company(request)
                target_kat = VidensKategori.objects.get(pk=reassign_to_id, company=company)
            except VidensKategori.DoesNotExist:
                return Response(
                    {"detail": "Den valgte kategori til flytning af artikler eksisterer ikke."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if target_kat == instance:
                return Response(
                    {"detail": "Du kan ikke flytte artikler til den samme kategori, du forsøger at slette."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Reassign articles to the new category
            instance.artikler.update(kategori=target_kat)
            
        instance.delete()
        return Response({"status": "Kategori slettet succesfuldt"}, status=status.HTTP_200_OK)


class VidenViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    queryset = Viden.objects.all()
    serializer_class = VidenSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['kategori', 'slug', 'arkiveret']
    search_fields = ['titel', 'indhold']
    ordering_fields = ['oprettet', 'titel']
    ordering = ['-oprettet']

    def get_queryset(self):
        user = self.request.user
        from django.db.models import Q, Exists, OuterRef
        
        # 1. Start med alle, derfra hvor Mixin lader os se dem
        qs = super().get_queryset().select_related('kategori', 'oprettet_af').prefetch_related('oprettet_af__memberships', 'hjaelp_punkter')
        
        # 2. Hårdt filter på artikler (Privacy & Slettede)
        if user.is_authenticated:
            # Hvis admin spørger efter slettede (via trash filter i frontend), så vis dem
            show_deleted = self.request.query_params.get('show_deleted') == 'true'
            
            if show_deleted:
                # Kun superusers eller admins må se trash
                is_admin = user.is_superuser or (hasattr(user, 'profile') and user.profile.role == 'ADMIN')
                if is_admin:
                    qs = qs.filter(slettet=True)
                else:
                    return Viden.objects.none()
            else:
                # Normal visning: Skjul altid slettede
                qs = qs.filter(slettet=False)
                # Privatliv: Kun egne private eller offentlige
                is_admin = user.is_superuser or (hasattr(user, 'profile') and user.profile.role == 'ADMIN')
                if not is_admin:
                    qs = qs.filter(Q(kategori__er_privat=False) | Q(oprettet_af=user))
            
            # Annoter om den er favorit for denne bruger
            qs = qs.annotate(
                is_favorit=Exists(
                    Viden.favoritter.through.objects.filter(
                        viden_id=OuterRef('pk'),
                        user_id=user.id
                    )
                )
            )
        else:
            qs = qs.filter(slettet=False, kategori__er_privat=False)
            
        # 3. Arkiv filter på lister (kun hvis vi ikke ser trash)
        if self.action == 'list' and not self.request.query_params.get('show_deleted'):
            show_archived = self.request.query_params.get('show_archived') == 'true'
            if not show_archived:
                qs = qs.filter(arkiveret=False)
                
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Manual pagination since global pagination might not be configured
        limit = request.query_params.get('limit')
        offset = request.query_params.get('offset')
        if limit:
            try:
                limit = int(limit)
                offset = int(offset) if offset else 0
                queryset = queryset[offset:offset + limit]
            except ValueError:
                pass
                
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        # Soft delete
        instance.slettet = True
        instance.save()

    def perform_create(self, serializer):
        from core.mixins import get_active_company
        company = get_active_company(self.request)
        serializer.save(oprettet_af=self.request.user, company=company)

    @action(detail=True, methods=['post'])
    def toggle_archive(self, request, pk=None):
        instance = self.get_object()
        instance.arkiveret = not instance.arkiveret
        instance.save()
        return Response({'status': 'arkiv status updated', 'arkiveret': instance.arkiveret})

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        instance = self.get_object()
        user = request.user
        if instance.favoritter.filter(id=user.id).exists():
            instance.favoritter.remove(user)
            return Response({'status': 'removed from favorites', 'favorit': False})
        else:
            instance.favoritter.add(user)
            return Response({'status': 'added to favorites', 'favorit': True})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        membership = get_active_membership(request)
        if not request.user.is_superuser and not (membership and membership.role == 'ADMIN'):
            return Response({'error': 'Unauthorized'}, status=403)
        # company is handled by CompanyFilterMixin or manual filter below
        company = get_active_company(request)
        instance = Viden.objects.filter(pk=pk, company=company).first()
        if not instance:
            return Response({'error': 'Not found'}, status=404)
        instance.slettet = False
        instance.save()
        return Response({'status': 'restored'})

    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        membership = get_active_membership(request)
        if not request.user.is_superuser and not (membership and membership.role == 'ADMIN'):
            return Response({'error': 'Unauthorized'}, status=403)
        company = get_active_company(request)
        instance = Viden.objects.filter(pk=pk, company=company).first()
        if not instance:
            return Response({'error': 'Not found'}, status=404)
        instance.delete()
        return Response({'status': 'deleted permanently'})

class HjaelpPunktViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    queryset = HjaelpPunkt.objects.all()
    serializer_class = HjaelpPunktSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['kode_navn']

    def get_queryset(self):
        user = self.request.user
        from django.db.models import Q, Prefetch
        
        # Samme privacy filter som artikler (vis ikke arkiverede her)
        if user.is_authenticated:
            v_filter = Q(arkiveret=False, slettet=False) & (Q(kategori__er_privat=False) | Q(oprettet_af=user))
        else:
            v_filter = Q(arkiveret=False, slettet=False) & Q(kategori__er_privat=False)
            
        return super().get_queryset().prefetch_related(
            Prefetch(
                'artikler', 
                queryset=Viden.objects.filter(v_filter).select_related('kategori', 'oprettet_af')
            )
        )

    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        hjaelp_punkt = self.get_object()
        article_ids = request.data.get('article_ids', [])
        for i, article_id in enumerate(article_ids):
            HjaelpPunktViden.objects.filter(hjaelp_punkt=hjaelp_punkt, viden_id=article_id).update(sortering=i*10)
        return Response({'status': 'order updated'})

    @action(detail=True, methods=['post'])
    def link_article(self, request, pk=None):
        hjaelp_punkt = self.get_object()
        article_id = request.data.get('article_id')
        if not article_id: return Response({'error': 'No article_id provided'}, status=400)
        if not HjaelpPunktViden.objects.filter(hjaelp_punkt=hjaelp_punkt, viden_id=article_id).exists():
            from django.db.models import Max
            max_val = HjaelpPunktViden.objects.filter(hjaelp_punkt=hjaelp_punkt).aggregate(Max('sortering'))['sortering__max'] or 0
            HjaelpPunktViden.objects.create(hjaelp_punkt=hjaelp_punkt, viden_id=article_id, sortering=max_val + 10)
        return Response({'status': 'linked'})

    @action(detail=True, methods=['post'])
    def unlink_article(self, request, pk=None):
        hjaelp_punkt = self.get_object()
        article_id = request.data.get('article_id')
        if not article_id: return Response({'error': 'No article_id provided'}, status=400)
        HjaelpPunktViden.objects.filter(hjaelp_punkt=hjaelp_punkt, viden_id=article_id).delete()
        return Response({'status': 'unlinked'})
