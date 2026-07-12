from rest_framework import serializers
from .models import VidensKategori, Viden, HjaelpPunkt
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class VidensKategoriSerializer(serializers.ModelSerializer):
    artikler_count = serializers.IntegerField(read_only=True)
    total_artikler_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = VidensKategori
        fields = ['id', 'navn', 'beskrivelse', 'farve', 'artikler_count', 'total_artikler_count', 'er_privat']

class VidenSerializer(serializers.ModelSerializer):
    kategori_details = VidensKategoriSerializer(source='kategori', read_only=True)
    oprettet_af_details = UserSerializer(source='oprettet_af', read_only=True)
    hjaelp_punkt_ids = serializers.PrimaryKeyRelatedField(
        many=True, source='hjaelp_punkter', queryset=HjaelpPunkt.objects.all(), required=False
    )
    
    favorit = serializers.SerializerMethodField()
    slettet = serializers.BooleanField(read_only=True)

    def get_favorit(self, obj):
        user = self.context.get('request').user
        if user and user.is_authenticated:
            # We will annotate this in the queryset for performance
            if hasattr(obj, 'is_favorit'):
                return obj.is_favorit
            return obj.favoritter.filter(id=user.id).exists()
        return False

    class Meta:
        model = Viden
        fields = [
            'id', 'titel', 'slug', 'kategori', 'kategori_details', 
            'indhold', 'link', 'fil', 
            'oprettet_af', 'oprettet_af_details', 
            'oprettet', 'opdateret', 'hjaelp_punkt_ids',
            'arkiveret', 'slettet', 'favorit'
        ]
        read_only_fields = ['oprettet_af', 'oprettet', 'opdateret', 'slettet', 'favorit']

class HjaelpPunktSerializer(serializers.ModelSerializer):
    artikler_details = VidenSerializer(source='artikler', many=True, read_only=True)

    class Meta:
        model = HjaelpPunkt
        fields = ['id', 'kode_navn', 'alias', 'artikler', 'artikler_details']
