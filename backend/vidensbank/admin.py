from django.contrib import admin
from .models import VidensKategori, Viden, HjaelpPunkt

@admin.register(VidensKategori)
class VidensKategoriAdmin(admin.ModelAdmin):
    list_display = ('navn', 'company', 'farve', 'er_privat')
    list_filter = ('company', 'er_privat')
    search_fields = ('navn',)

@admin.register(Viden)
class VidenAdmin(admin.ModelAdmin):
    list_display = ('titel', 'company', 'kategori', 'oprettet_af', 'arkiveret')
    list_filter = ('company', 'kategori', 'arkiveret', 'slettet')
    search_fields = ('titel', 'indhold', 'slug')
    prepopulated_fields = {'slug': ('titel',)}
    autocomplete_fields = ('kategori',)

@admin.register(HjaelpPunkt)
class HjaelpPunktAdmin(admin.ModelAdmin):
    list_display = ('alias', 'kode_navn')
    search_fields = ('alias', 'kode_navn')
    # filter_horizontal = ('artikler',)
