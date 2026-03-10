from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from core.models import Company

def vidensbank_dokument_path(instance, filename):
    return f'vidensbank/{instance.id}/{filename}'

class VidensKategori(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='videnskategorier', null=True, blank=True)
    navn = models.CharField(max_length=100)
    beskrivelse = models.TextField(blank=True, null=True)
    farve = models.CharField(max_length=7, default='#2563eb', help_text="Hex farvekode (f.eks. #2563eb)")
    er_privat = models.BooleanField(default=False, verbose_name=_('Privat kategori'), help_text="Hvis markeret, kan artikler i denne kategori kun ses af den person der har oprettet dem.")

    def save(self, *args, **kwargs):
        if not self.farve or self.farve == '#2563eb':
            # Liste af pæne professionelle farver
            colors = [
                '#2563eb', # Blue
                '#16a34a', # Green
                '#dc2626', # Red
                '#d97706', # Amber
                '#7c3aed', # Violet
                '#0891b2', # Cyan
                '#4f46e5', # Indigo
                '#be185d', # Pink
                '#65a30d', # Lime
                '#9333ea', # Purple
            ]
            # Vælg en farve baseret på antallet af eksisterende kategorier
            count = VidensKategori.objects.count()
            self.farve = colors[count % len(colors)]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.navn

    class Meta:
        verbose_name = _('Videns Kategori')
        verbose_name_plural = _('Videns Kategorier')
        ordering = ['navn']

class Viden(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='viden_artikler', null=True, blank=True)
    titel = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True, null=True, help_text="Unik identifikator til brug i links (f.eks. 'gem-chat-app')")
    kategori = models.ForeignKey(VidensKategori, on_delete=models.PROTECT, related_name='artikler')
    indhold = models.TextField(verbose_name=_('Indhold (HTML)'))
    
    # Dokument felt: link eller fil
    link = models.CharField(max_length=512, blank=True, null=True, help_text="Link til ekstern side eller dokument")
    fil = models.FileField(upload_to=vidensbank_dokument_path, blank=True, null=True)
    
    oprettet_af = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='oprettet_viden')
    oprettet = models.DateTimeField(auto_now_add=True)
    opdateret = models.DateTimeField(auto_now=True)
    
    arkiveret = models.BooleanField(default=False, verbose_name=_('Arkiveret'))
    slettet = models.BooleanField(default=False, verbose_name=_('Slettet'))
    favoritter = models.ManyToManyField(User, related_name='viden_favorites', blank=True, verbose_name=_('Favoritter'))

    def __str__(self):
        return self.titel

    class Meta:
        verbose_name = _('Videns artikel')
        verbose_name_plural = _('Vidensbank')
        ordering = ['-oprettet']

class HjaelpPunktViden(models.Model):
    hjaelp_punkt = models.ForeignKey('HjaelpPunkt', on_delete=models.CASCADE, related_name='hjaelp_punkt_links')
    viden = models.ForeignKey('Viden', on_delete=models.CASCADE, related_name='viden_hjaelp_links')
    sortering = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sortering']
        verbose_name = _('Hjælpepunkt Artikel Link')
        verbose_name_plural = _('Hjælpepunkt Artikel Links')
        unique_together = ('hjaelp_punkt', 'viden')

class HjaelpPunkt(models.Model):
    kode_navn = models.CharField(max_length=100, unique=True, help_text="Unik kode brugt i frontend (f.eks. 'CHAT_SIDEBAR_HELP')")
    alias = models.CharField(max_length=255, help_text="Beskrivende navn så vi ved hvor det bruges (f.eks. 'Hjælp i chat sidebaren')")
    artikler = models.ManyToManyField(Viden, through=HjaelpPunktViden, related_name='hjaelp_punkter', blank=True)

    def __str__(self):
        return f"{self.alias} ({self.kode_navn})"

    class Meta:
        verbose_name = _('Hjælpepunkt')
        verbose_name_plural = _('Hjælpepunkter')
        ordering = ['alias']
