from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import Opgave, OpgaveKommentar, OpgaveStatusLog, PinboardPost, PinboardPostEvaluation, PinboardPostComment
from .serializers import (
    OpgaveSerializer, OpgaveKommentarSerializer, OpgaveListSerializer,
    PinboardPostSerializer, PinboardPostEvaluationSerializer,
    PinboardPostListSerializer
)

class OpgaveViewSet(viewsets.ModelViewSet):
    queryset = Opgave.objects.all() # Required for router basename
    filterset_fields = ['status', 'ansvarlige', 'prioritet']

    def get_serializer_class(self):
        if self.action == 'list':
            return OpgaveListSerializer
        return OpgaveSerializer

    def get_queryset(self):
        user = self.request.user
        
        # Base query with common optimizations
        qs = Opgave.objects.prefetch_related(
            'ansvarlige', 
            'oprettet_af',
            'team',
            'team__medlemmer'
        )

        # Enforce membership: User can only see tasks for teams they are in
        # Or tasks with no team (optional, but requested team logic suggests strictness)
        # For now, let's be strict: if a task has a team, user must be a member.
        # If it has NO team, it's visible to everyone authenticated (legacy).
        # Enforce membership unless Admin
        from django.db.models import Q
        is_admin = user.is_superuser or (hasattr(user, 'profile') and user.profile.role == 'ADMIN')
        
        if not is_admin:
            qs = qs.filter(Q(team__medlemmer=user) | Q(team__isnull=True)).distinct()

        # Specific team filtering from UI
        team_id = self.request.query_params.get('team')
        if team_id and team_id != '0':
            qs = qs.filter(team_id=team_id)
        # If team_id is '0' or None, the membership filter above already handles "all my teams"

        # Action specific filtering
        if self.action == 'list':
            return qs.filter(arkiveret=False)

        if self.action == 'arkiverede':
            return qs.filter(arkiveret=True).order_by('-opdateret')

        # Full prefetch for detail/update
        return qs.prefetch_related(
            'kommentarer',
            'kommentarer__bruger',
            'status_logs',
            'status_logs__bruger'
        )

    def perform_create(self, serializer):
        serializer.save(oprettet_af=self.request.user)

    def perform_update(self, serializer):
        print("PERFORM_UPDATE data:", self.request.data)
        # Capture old status before saving
        old_status = serializer.instance.status
        opgave = serializer.save()
        print("UPDATED instance ansvarlige:", list(opgave.ansvarlige.values_list('id', flat=True)))
        
        new_status = opgave.status
        
        if old_status != new_status:
            OpgaveStatusLog.objects.create(
                opgave=opgave,
                gammel_status=old_status,
                ny_status=new_status,
                bruger=self.request.user
            )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        opgave = self.get_object()
        old_status = opgave.status
        new_status = request.data.get('status')
        new_index = request.data.get('index')
        
        if new_status and new_status != old_status:
            opgave.status = new_status
            OpgaveStatusLog.objects.create(
                opgave=opgave,
                gammel_status=old_status,
                ny_status=new_status,
                bruger=request.user
            )
        
        if new_index is not None:
            opgave.index = new_index
            
        opgave.save()
        
        # Re-fetch the object to get the updated status_logs relation
        # We must use the viewset's queryset to ensure prefetches are applied
        opgave = self.get_queryset().get(pk=opgave.pk)
        
        return Response(self.get_serializer(opgave).data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        opgave = self.get_object()
        opgave.arkiveret = True
        opgave.save()
        return Response({'status': 'arkiveret'})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        opgave = self.get_object()
        opgave.arkiveret = False
        opgave.save()
        return Response({'status': 'gendannet'})

    @action(detail=False, methods=['get'])
    def arkiverede(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def status_historik(self, request, pk=None):
        opgave = self.get_object()
        logs = OpgaveStatusLog.objects.filter(opgave=opgave).select_related('bruger').order_by('-tidspunkt')
        from .serializers import OpgaveStatusLogSerializer
        serializer = OpgaveStatusLogSerializer(logs, many=True)
        return Response(serializer.data)

class OpgaveKommentarViewSet(viewsets.ModelViewSet):
    queryset = OpgaveKommentar.objects.all()
    serializer_class = OpgaveKommentarSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(bruger=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.bruger != self.request.user:
            raise permissions.PermissionDenied("Du kan kun redigere dine egne kommentarer.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.bruger != self.request.user:
            raise permissions.PermissionDenied("Du kan kun slette dine egne kommentarer.")
        instance.delete()

class PinboardPostViewSet(viewsets.ModelViewSet):
    def get_serializer_class(self):
        if self.action == 'list':
            return PinboardPostListSerializer
        return PinboardPostSerializer

    def get_queryset(self):
        user = self.request.user
        is_admin = user.is_superuser or (hasattr(user, 'profile') and user.profile.role == 'ADMIN')
        
        # Optimize fetch according to patterns.md
        # Annotate counts to avoid N+1 in evaluation_summary
        qs = PinboardPost.objects.annotate(
            eval_count=Count('evalueringer', distinct=True),
            good_idea_count=Count('evalueringer', filter=Q(evalueringer__evaluering='GOD_IDE'), distinct=True),
            dont_know_count=Count('evalueringer', filter=Q(evalueringer__evaluering='INGEN_MENING'), distinct=True),
            read_count=Count('evalueringer', filter=Q(evalueringer__evaluering='LÆST'), distinct=True),
            team_member_count=Count('team__medlemmer', distinct=True)
        ).select_related(
            'oprettet_af', 
            'oprettet_af__profile',
            'team'
        ).prefetch_related(
            'evalueringer', 
            'evalueringer__bruger',
            'evalueringer__bruger__profile',
            'kommentarer',
            'kommentarer__bruger',
            'kommentarer__bruger__profile',
            'team__medlemmer',
            'team__medlemmer__profile'
        )

        # Filter by team if requested
        team_id = self.request.query_params.get('team')
        if team_id and team_id != '0':
            qs = qs.filter(team_id=team_id)

        # Filter by creator if requested
        only_mine = self.request.query_params.get('only_mine') == 'true'
        if only_mine:
            qs = qs.filter(oprettet_af=user)

        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(titel__icontains=search) | Q(beskrivelse__icontains=search))

        # Hide archived by default
        include_archived = self.request.query_params.get('include_archived') == 'true'
        if not include_archived:
            qs = qs.filter(arkiveret=False)

        if not is_admin:
            # For privacy/logic, regular users only see posts for teams they are in
            qs = qs.filter(team__medlemmer=user).distinct()

        return qs

    def perform_create(self, serializer):
        serializer.save(oprettet_af=self.request.user)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        instance = self.get_object()
        # Only creator or admin can archive
        is_admin = request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN')
        if instance.oprettet_af != request.user and not is_admin:
            return Response({'error': 'Kun opretteren kan arkivere dette opslag.'}, status=status.HTTP_403_FORBIDDEN)
        
        instance.arkiveret = True
        instance.save()
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        instance = self.get_object()
        is_admin = request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN')
        if instance.oprettet_af != request.user and not is_admin:
            return Response({'error': 'Kun opretteren kan gendanne dette opslag.'}, status=status.HTTP_403_FORBIDDEN)
        
        instance.arkiveret = False
        instance.save()
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def evaluate(self, request, pk=None):
        # We don't call self.get_object() here because we want to perform the write first,
        # then fetch a fresh object with ALL prefetches correctly populated.
        evaluering = request.data.get('evaluering')
        
        if not evaluering:
            return Response({'error': 'Evaluering mangler'}, status=status.HTTP_400_BAD_REQUEST)

        PinboardPostEvaluation.objects.update_or_create(
            post_id=pk,
            bruger=request.user,
            defaults={'evaluering': evaluering}
        )
        
        # Now fetch the fresh instance using the viewset's queryset (which has prefetches)
        instance = self.get_queryset().get(pk=pk)
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        tekst = request.data.get('tekst')
        
        if not tekst:
            return Response({'error': 'Tekst mangler'}, status=status.HTTP_400_BAD_REQUEST)

        PinboardPostComment.objects.create(
            post_id=pk,
            bruger=request.user,
            tekst=tekst
        )
        
        # Refresh instance with prefetches
        instance = self.get_queryset().get(pk=pk)
        return Response(self.get_serializer(instance).data)
