from rest_framework import serializers
from .models import KoderGrupper, OpgaverKode, Tidreg, BrugerProfilTime, BrugerIndstillingTime

class KoderGrupperSerializer(serializers.ModelSerializer):
    class Meta:
        model = KoderGrupper
        fields = ['id', 'gruppe', 'beskrivelse']

class OpgaverKodeSerializer(serializers.ModelSerializer):
    gruppe_navn = serializers.ReadOnlyField(source='gruppe.beskrivelse')
    
    class Meta:
        model = OpgaverKode
        fields = ['id', 'kode_nr', 'beskrivelse', 'mtime', 'gruppe', 'gruppe_navn']

class TidregSerializer(serializers.ModelSerializer):
    bruger_name = serializers.ReadOnlyField(source='bruger.username')
    kode_nr = serializers.ReadOnlyField(source='opgave_kode.kode_nr')
    beskrivelse = serializers.ReadOnlyField(source='opgave_kode.beskrivelse')
    mtime = serializers.ReadOnlyField(source='opgave_kode.mtime')
    gruppe = serializers.ReadOnlyField(source='opgave_kode.gruppe.gruppe')

    class Meta:
        model = Tidreg
        fields = [
            'id', 'bruger', 'bruger_name', 'opgave_kode', 'kode_nr', 
            'beskrivelse', 'mtime', 'gruppe', 'alias', 'fra_tid', 
            'til_tid', 'tid', 'kommentar', 'aktiv'
        ]
        read_only_fields = ['bruger']

class BrugerProfilTimeSerializer(serializers.ModelSerializer):
    kode_nr = serializers.ReadOnlyField(source='opgave_kode.kode_nr')
    beskrivelse = serializers.ReadOnlyField(source='opgave_kode.beskrivelse')

    class Meta:
        model = BrugerProfilTime
        fields = ['id', 'bruger', 'opgave_kode', 'kode_nr', 'beskrivelse', 'alias', 'sortering']
        read_only_fields = ['bruger']

class BrugerIndstillingTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrugerIndstillingTime
        fields = ['id', 'bruger', 'window_x', 'window_y', 'window_width', 'window_height']
        read_only_fields = ['bruger']
