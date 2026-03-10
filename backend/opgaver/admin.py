from django.contrib import admin
from .models import Opgave, OpgaveKommentar, OpgaveStatusLog, PinboardPost, PinboardPostEvaluation, PinboardPostComment

@admin.register(Opgave)
class OpgaveAdmin(admin.ModelAdmin):
    list_display = ('titel', 'company', 'status', 'prioritet', 'team', 'deadline', 'arkiveret')
    list_filter = ('company', 'status', 'prioritet', 'team', 'arkiveret')
    search_fields = ('titel', 'beskrivelse')

@admin.register(OpgaveKommentar)
class OpgaveKommentarAdmin(admin.ModelAdmin):
    list_display = ('opgave', 'bruger', 'oprettet')
    search_fields = ('tekst',)

@admin.register(OpgaveStatusLog)
class OpgaveStatusLogAdmin(admin.ModelAdmin):
    list_display = ('opgave', 'gammel_status', 'ny_status', 'bruger', 'tidspunkt')

@admin.register(PinboardPost)
class PinboardPostAdmin(admin.ModelAdmin):
    list_display = ('titel', 'company', 'team', 'oprettet_af', 'arkiveret')
    list_filter = ('company', 'team', 'arkiveret')
    search_fields = ('titel', 'beskrivelse')

admin.site.register(PinboardPostEvaluation)
admin.site.register(PinboardPostComment)
