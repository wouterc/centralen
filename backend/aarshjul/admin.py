from django.contrib import admin
from .models import AarshjulGruppe, Aktivitet

@admin.register(AarshjulGruppe)
class AarshjulGruppeAdmin(admin.ModelAdmin):
    list_display = ('navn', 'company', 'raekkefoelge')
    list_filter = ('company',)
    search_fields = ('navn',)

@admin.register(Aktivitet)
class AktivitetAdmin(admin.ModelAdmin):
    list_display = ('navn', 'company', 'gruppe', 'start_dato', 'slut_dato')
    list_filter = ('company', 'gruppe')
    search_fields = ('navn', 'beskrivelse')
