from rest_framework import serializers
from .models import Flowchart, FlowchartNode, FlowchartEdge


class FlowchartNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlowchartNode
        fields = ['id', 'node_id', 'navn', 'beskrivelse', 'farve', 'form_type',
                  'x_pos', 'y_pos', 'bredde', 'hoejde']


class FlowchartEdgeSerializer(serializers.ModelSerializer):
    source_node_id = serializers.CharField(source='source.node_id', read_only=True)
    target_node_id = serializers.CharField(source='target.node_id', read_only=True)

    class Meta:
        model = FlowchartEdge
        fields = ['id', 'edge_id', 'source', 'target', 'source_node_id', 'target_node_id', 'label']


class FlowchartSerializer(serializers.ModelSerializer):
    nodes = FlowchartNodeSerializer(many=True, read_only=True)
    edges = FlowchartEdgeSerializer(many=True, read_only=True)
    team_details = serializers.SerializerMethodField()

    class Meta:
        model = Flowchart
        fields = ['id', 'navn', 'beskrivelse', 'team', 'team_details', 'oprettet', 'opdateret',
                  'nodes', 'edges']

    def get_team_details(self, obj):
        if obj.team:
            return {'id': obj.team.id, 'navn': obj.team.navn, 'color': obj.team.color}
        return None


class FlowchartSaveSerializer(serializers.Serializer):
    """Used for bulk save of nodes and edges."""
    nodes = serializers.ListField(child=serializers.DictField())
    edges = serializers.ListField(child=serializers.DictField())
