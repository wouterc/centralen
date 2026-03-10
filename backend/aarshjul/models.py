from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import Team

class AarshjulGruppe(models.Model):
    navn = models.CharField(max_length=100)
    raekkefoelge = models.IntegerField(default=0)
    teams = models.ManyToManyField(Team, related_name='aarshjul_grupper', blank=True)
    oprettet = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['raekkefoelge', 'navn']
        verbose_name = _('Årshjul Gruppe')
        verbose_name_plural = _('Årshjul Grupper')

    def __str__(self):
        return self.navn

class Aktivitet(models.Model):
    navn = models.CharField(max_length=200)
    beskrivelse = models.TextField(blank=True)
    start_dato = models.DateField()
    slut_dato = models.DateField()
    farve = models.CharField(max_length=7, default='#3b82f6') # Hex code
    gruppe = models.ForeignKey(AarshjulGruppe, on_delete=models.SET_NULL, null=True, blank=True, related_name='aktiviteter')
    oprettet = models.DateTimeField(auto_now_add=True)
    opdateret = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_dato']
        verbose_name = _('Aktivitet')
        verbose_name_plural = _('Aktiviteter')

    def __str__(self):
        return self.navn
