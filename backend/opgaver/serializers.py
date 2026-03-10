from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Opgave, OpgaveKommentar, OpgaveStatusLog, PinboardPost, PinboardPostEvaluation, PinboardPostComment
from core.serializers import UserSerializer, TeamSerializer, UserMinimalSerializer

class OpgaveKommentarSerializer(serializers.ModelSerializer):
    bruger_details = UserMinimalSerializer(source='bruger', read_only=True)
    
    class Meta:
        model = OpgaveKommentar
        fields = ['id', 'opgave', 'tekst', 'bruger', 'bruger_details', 'oprettet']
        read_only_fields = ['bruger', 'oprettet']

class OpgaveStatusLogSerializer(serializers.ModelSerializer):
    bruger_navn = serializers.ReadOnlyField(source='bruger.get_full_name')
    bruger_username = serializers.ReadOnlyField(source='bruger.username')
    direction = serializers.ReadOnlyField()

    class Meta:
        model = OpgaveStatusLog
        fields = ['id', 'gammel_status', 'ny_status', 'bruger', 'bruger_navn', 'bruger_username', 'tidspunkt', 'direction']

class OpgaveSerializer(serializers.ModelSerializer):
    ansvarlige = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), required=False)
    ansvarlige_details = UserSerializer(source='ansvarlige', many=True, read_only=True)
    team_details = TeamSerializer(source='team', read_only=True)
    oprettet_af_details = UserSerializer(source='oprettet_af', read_only=True)
    kommentarer = OpgaveKommentarSerializer(many=True, read_only=True)
    kommentarer_count = serializers.IntegerField(source='kommentar_antal', read_only=True)
    status_historik = OpgaveStatusLogSerializer(source='status_logs', many=True, read_only=True)

    class Meta:
        model = Opgave
        fields = [
            'id', 'titel', 'beskrivelse', 'status', 'prioritet',
            'ansvarlige', 'ansvarlige_details',
            'team', 'team_details',
            'deadline',
            'oprettet_af', 'oprettet_af_details',
            'oprettet', 'opdateret',
            'kommentarer', 'kommentarer_count', 'index',
            'status_historik', 'status_direction', 'arkiveret'
        ]
        read_only_fields = ['oprettet_af', 'oprettet', 'opdateret']

class OpgaveListSerializer(serializers.ModelSerializer):
    ansvarlige_details = UserSerializer(source='ansvarlige', many=True, read_only=True)
    team_details = TeamSerializer(source='team', read_only=True)
    oprettet_af_details = UserSerializer(source='oprettet_af', read_only=True)
    kommentarer_count = serializers.IntegerField(source='kommentar_antal', read_only=True)
    status_direction = serializers.IntegerField(read_only=True)

    class Meta:
        model = Opgave
        fields = [
            'id', 'titel', 'beskrivelse', 'status', 'prioritet',
            'ansvarlige', 'ansvarlige_details',
            'team', 'team_details',
            'deadline',
            'oprettet_af', 'oprettet_af_details',
            'oprettet', 'opdateret',
            'kommentarer_count', 'index',
            'status_direction', 'arkiveret'
        ]

class PinboardPostEvaluationSerializer(serializers.ModelSerializer):
    bruger_details = UserMinimalSerializer(source='bruger', read_only=True)

    class Meta:
        model = PinboardPostEvaluation
        fields = ['id', 'post', 'bruger', 'bruger_details', 'evaluering', 'oprettet']
        read_only_fields = ['bruger', 'oprettet']

class PinboardPostCommentSerializer(serializers.ModelSerializer):
    bruger_details = UserMinimalSerializer(source='bruger', read_only=True)

    class Meta:
        model = PinboardPostComment
        fields = ['id', 'post', 'bruger', 'bruger_details', 'tekst', 'oprettet']
        read_only_fields = ['bruger', 'oprettet']

class PinboardPostSerializer(serializers.ModelSerializer):
    oprettet_af_details = UserMinimalSerializer(source='oprettet_af', read_only=True)
    team_details = TeamSerializer(source='team', read_only=True)
    evalueringer = PinboardPostEvaluationSerializer(many=True, read_only=True)
    kommentarer = PinboardPostCommentSerializer(many=True, read_only=True)
    user_evaluation = serializers.SerializerMethodField()
    requires_evaluation = serializers.SerializerMethodField()
    teaser_text = serializers.SerializerMethodField()
    evaluation_summary = serializers.SerializerMethodField()

    class Meta:
        model = PinboardPost
        fields = [
            'id', 'titel', 'beskrivelse', 'teaser_text', 'oprettet_af', 'oprettet_af_details',
            'team', 'team_details', 'oprettet', 'opdateret', 'arkiveret',
            'evalueringer', 'kommentarer', 'user_evaluation', 'requires_evaluation',
            'evaluation_summary'
        ]
        read_only_fields = ['oprettet_af', 'oprettet', 'opdateret']

    def get_teaser_text(self, obj):
        if len(obj.beskrivelse) > 150:
            return obj.beskrivelse[:147] + "..."
        return obj.beskrivelse

    def get_user_evaluation(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return None
            
        # N+1 FIX: Use prefetched list
        evals = obj.evalueringer.all()
        user_eval = next((e for e in evals if e.bruger_id == request.user.id), None)
        return user_eval.evaluering if user_eval else None

    def get_evaluation_summary(self, obj):
        # N+1 optimization: use annotated values if present
        if hasattr(obj, 'eval_count'):
            return {
                'GOD_IDE': obj.good_idea_count,
                'INGEN_MENING': obj.dont_know_count,
                'LÆST': obj.read_count,
                'TOTAL_EVALUATED': obj.eval_count,
                'PENDING': max(0, obj.team_member_count - obj.eval_count),
                'TEAM_TOTAL': obj.team_member_count,
            }

        # Fallback (e.g. for retrieve if annotations are not used there or for newly created items)
        evals = list(obj.evalueringer.all())
        summary = {
            'GOD_IDE': len([e for e in evals if e.evaluering == 'GOD_IDE']),
            'INGEN_MENING': len([e for e in evals if e.evaluering == 'INGEN_MENING']),
            'LÆST': len([e for e in evals if e.evaluering == 'LÆST']),
            'TOTAL_EVALUATED': len(evals),
        }
        
        team_members_count = obj.team.medlemmer.count()
        summary['PENDING'] = max(0, team_members_count - summary['TOTAL_EVALUATED'])
        summary['TEAM_TOTAL'] = team_members_count
        
        return summary

    def get_requires_evaluation(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return False
            
        # N+1 FIX: Use prefetched lists
        evals = obj.evalueringer.all()
        has_evaluated = any(e.bruger_id == request.user.id for e in evals)
        if has_evaluated:
            return False
            
        team_members = obj.team.medlemmer.all()
        is_member = any(m.id == request.user.id for m in team_members)
        return is_member

class PinboardPostListSerializer(PinboardPostSerializer):
    """Leaner version for the list view to avoid heavy payloads"""
    class Meta(PinboardPostSerializer.Meta):
        fields = [
            'id', 'titel', 'teaser_text', 'oprettet_af', 'oprettet_af_details',
            'team', 'team_details', 'oprettet', 'user_evaluation', 
            'requires_evaluation', 'evaluation_summary'
        ]
