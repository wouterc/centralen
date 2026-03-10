from rest_framework import serializers
from .models import Aktivitet, AarshjulGruppe
from core.models import Team

class AarshjulGruppeSerializer(serializers.ModelSerializer):
    teams_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = AarshjulGruppe
        fields = ['id', 'navn', 'raekkefoelge', 'teams', 'teams_detail', 'oprettet']

    def get_teams_detail(self, obj):
        from core.serializers import TeamSerializer
        return TeamSerializer(obj.teams.all(), many=True).data

class AktivitetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aktivitet
        fields = '__all__'
