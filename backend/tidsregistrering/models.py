from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from core.models import Company

class KoderGrupper(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='kodegrupper', null=True, blank=True)
    gruppe = models.CharField(max_length=6, verbose_name=_('Gruppe'))
    beskrivelse = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('Beskrivelse'))

    class Meta:
        verbose_name = _('Kodegruppe')
        verbose_name_plural = _('Kodegrupper')
        unique_together = ('company', 'gruppe')
        ordering = ['gruppe']

    def __str__(self):
        return f"{self.gruppe} - {self.beskrivelse}"

class OpgaverKode(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='opgavekoder', null=True, blank=True)
    kode_nr = models.CharField(max_length=50, verbose_name=_('KodeNr'))
    beskrivelse = models.CharField(max_length=255, verbose_name=_('Beskrivelse'))
    mtime = models.CharField(max_length=15, blank=True, null=True, verbose_name=_('Mtime'))
    gruppe = models.ForeignKey(KoderGrupper, on_delete=models.SET_NULL, blank=True, null=True, verbose_name=_('Gruppe'))

    class Meta:
        verbose_name = _('Opgavekode')
        verbose_name_plural = _('Opgavekoder')
        unique_together = ('company', 'kode_nr')
        ordering = ['kode_nr']

    def __str__(self):
        return f"{self.kode_nr} - {self.beskrivelse}"

class Tidreg(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='tidsregistreringer', null=True, blank=True)
    bruger = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tidsregistreringer', verbose_name=_('Bruger'))
    opgave_kode = models.ForeignKey(OpgaverKode, on_delete=models.CASCADE, related_name='registreringer', verbose_name=_('Opgavekode'))
    alias = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('Alias'))
    fra_tid = models.DateTimeField(verbose_name=_('Fra tid'))
    til_tid = models.DateTimeField(blank=True, null=True, verbose_name=_('Til tid'))
    tid = models.CharField(max_length=20, blank=True, null=True, verbose_name=_('Tid'))
    kommentar = models.TextField(blank=True, null=True, verbose_name=_('Kommentar'))
    aktiv = models.BooleanField(default=True, verbose_name=_('Aktiv'))

    class Meta:
        verbose_name = _('Tidsregistrering')
        verbose_name_plural = _('Tidsregistreringer')
        ordering = ['-fra_tid']

    def __str__(self):
        return f"{self.bruger.username} - {self.opgave_kode.kode_nr} ({self.fra_tid})"

class BrugerProfilTime(models.Model):
    bruger = models.ForeignKey(User, on_delete=models.CASCADE, related_name='time_profiler', verbose_name=_('Bruger'))
    opgave_kode = models.ForeignKey(OpgaverKode, on_delete=models.CASCADE, verbose_name=_('Opgavekode'))
    alias = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('Alias'))
    sortering = models.IntegerField(blank=True, null=True, verbose_name=_('Sortering'))

    class Meta:
        verbose_name = _('Bruger Time Profil')
        verbose_name_plural = _('Bruger Time Profiler')
        ordering = ['sortering', 'id']

class BrugerIndstillingTime(models.Model):
    bruger = models.OneToOneField(User, on_delete=models.CASCADE, related_name='time_indstillinger', verbose_name=_('Bruger'))
    window_x = models.IntegerField(blank=True, null=True)
    window_y = models.IntegerField(blank=True, null=True)
    window_width = models.IntegerField(blank=True, null=True)
    window_height = models.IntegerField(blank=True, null=True)

    class Meta:
        verbose_name = _('Bruger Time Indstilling')
        verbose_name_plural = _('Bruger Time Indstillinger')
