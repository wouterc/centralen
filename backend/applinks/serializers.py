from rest_framework import serializers
from .models import AppLink, AppPurpose
from core.models import Team

class AppPurposeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppPurpose
        fields = ['id', 'name']

class AppLinkSerializer(serializers.ModelSerializer):
    teams = serializers.PrimaryKeyRelatedField(many=True, queryset=Team.objects.all(), required=False)
    purposes = serializers.PrimaryKeyRelatedField(many=True, queryset=AppPurpose.objects.all(), required=False)
    
    # Nested field for GET requests
    teams_details = serializers.SlugRelatedField(many=True, read_only=True, slug_field='navn', source='teams')
    purposes_details = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name', source='purposes')

    class Meta:
        model = AppLink
        fields = [
            'id', 'title', 'description', 'path', 
            'teams', 'purposes', 'teams_details', 'purposes_details',
            'created_at', 'updated_at'
        ]
