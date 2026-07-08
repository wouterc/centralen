from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.mixins import CompanyFilterMixin, get_active_company
from .models import Flowchart, FlowchartNode, FlowchartEdge
from .serializers import (
    FlowchartSerializer, FlowchartNodeSerializer,
    FlowchartEdgeSerializer, FlowchartSaveSerializer,
)


class FlowchartViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    serializer_class = FlowchartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        company = get_active_company(self.request)
        if not company:
            return Flowchart.objects.none()
        # Return company-wide charts OR charts belonging to a team the user is in
        return (
            Flowchart.objects
            .filter(company=company)
            .filter(Q(team__isnull=True) | Q(team__medlemmer=self.request.user))
            .select_related('company', 'team')
            .prefetch_related('nodes', 'edges__source', 'edges__target')
            .distinct()
        )

    @action(detail=True, methods=['patch'], url_path='save')
    def save_flowchart(self, request, pk=None):  # noqa: ARG002
        """Bulk-save all nodes and edges for a flowchart in a single request."""
        flowchart = self.get_object()
        serializer = FlowchartSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        nodes_data = serializer.validated_data['nodes']
        edges_data = serializer.validated_data['edges']

        with transaction.atomic():
            # Delete existing nodes and edges (cascade deletes edges too)
            flowchart.nodes.all().delete()

            # Re-create nodes
            node_map = {}  # node_id -> FlowchartNode instance
            for nd in nodes_data:
                node = FlowchartNode.objects.create(
                    flowchart=flowchart,
                    node_id=nd['node_id'],
                    navn=nd.get('navn', ''),
                    beskrivelse=nd.get('beskrivelse', ''),
                    farve=nd.get('farve', '#3b82f6'),
                    form_type=nd.get('form_type', 'rectangle'),
                    x_pos=nd.get('x_pos', 0),
                    y_pos=nd.get('y_pos', 0),
                    bredde=nd.get('bredde', 160),
                    hoejde=nd.get('hoejde', 60),
                )
                node_map[nd['node_id']] = node

            # Re-create edges
            for ed in edges_data:
                source = node_map.get(ed['source_node_id'])
                target = node_map.get(ed['target_node_id'])
                if source and target:
                    FlowchartEdge.objects.create(
                        flowchart=flowchart,
                        edge_id=ed['edge_id'],
                        source=source,
                        target=target,
                        label=ed.get('label', ''),
                    )

        # Re-fetch so the serializer sees fresh nodes/edges (not stale prefetch cache)
        flowchart_fresh = (
            Flowchart.objects
            .prefetch_related('nodes', 'edges__source', 'edges__target')
            .get(pk=flowchart.pk)
        )
        return Response(FlowchartSerializer(flowchart_fresh).data)


class FlowchartNodeViewSet(viewsets.ModelViewSet):
    serializer_class = FlowchartNodeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        company = get_active_company(self.request)
        if not company:
            return FlowchartNode.objects.none()
        return FlowchartNode.objects.filter(flowchart__company=company).select_related('flowchart')


class FlowchartEdgeViewSet(viewsets.ModelViewSet):
    serializer_class = FlowchartEdgeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        company = get_active_company(self.request)
        if not company:
            return FlowchartEdge.objects.none()
        return (
            FlowchartEdge.objects
            .filter(flowchart__company=company)
            .select_related('flowchart', 'source', 'target')
        )
