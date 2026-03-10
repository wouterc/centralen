from django.contrib import admin
from .models import KoderGrupper, OpgaverKode, Tidreg, BrugerProfilTime, BrugerIndstillingTime

@admin.register(KoderGrupper)
class KoderGrupperAdmin(admin.ModelAdmin):
    list_display = ('gruppe', 'company', 'beskrivelse')
    list_filter = ('company',)
    search_fields = ('gruppe', 'beskrivelse')

@admin.register(OpgaverKode)
class OpgaverKodeAdmin(admin.ModelAdmin):
    list_display = ('kode_nr', 'company', 'beskrivelse', 'gruppe')
    list_filter = ('company', 'gruppe')
    search_fields = ('kode_nr', 'beskrivelse')

@admin.register(Tidreg)
class TidregAdmin(admin.ModelAdmin):
    list_display = ('bruger', 'company', 'opgave_kode', 'fra_tid', 'til_tid', 'aktiv')
    list_filter = ('company', 'aktiv', 'bruger')
    search_fields = ('kommentar', 'alias')

@admin.register(BrugerProfilTime)
class BrugerProfilTimeAdmin(admin.ModelAdmin):
    list_display = ('bruger', 'opgave_kode', 'alias', 'sortering')
    list_filter = ('bruger',)

@admin.register(BrugerIndstillingTime)
class BrugerIndstillingTimeAdmin(admin.ModelAdmin):
    list_display = ('bruger', 'window_x', 'window_y', 'window_width', 'window_height')
