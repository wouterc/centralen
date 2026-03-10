from django.contrib import admin
from .models import VidensKategori, Viden, HjaelpPunkt

@admin.register(VidensKategori)
class VidensKategoriAdmin(admin.ModelAdmin):
    list_display = ('navn', 'farve', 'er_privat', 'beskrivelse')
    list_filter = ('er_privat',)
    search_fields = ('navn',)

@admin.register(Viden)
class VidenAdmin(admin.ModelAdmin):
    list_display = ('titel', 'kategori', 'oprettet_af', 'arkiveret', 'slettet', 'oprettet')
    list_filter = ('kategori', 'arkiveret', 'slettet', 'oprettet')
    search_fields = ('titel', 'indhold', 'slug')
    prepopulated_fields = {'slug': ('titel',)}
    autocomplete_fields = ('kategori',)

@admin.register(HjaelpPunkt)
class HjaelpPunktAdmin(admin.ModelAdmin):
    list_display = ('alias', 'kode_navn')
    search_fields = ('alias', 'kode_navn')
    # filter_horizontal = ('artikler',)
