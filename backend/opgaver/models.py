from django.db import models
from django.contrib.auth.models import User
from core.models import Team, Company
from django.utils.translation import gettext_lazy as _

class OpgaveStatus(models.TextChoices):
    BACKLOG = 'BACKLOG', _('Backlog')
    TODO = 'TODO', _('To Do')
    IN_PROGRESS = 'IN_PROGRESS', _('Igang')
    TEST = 'TEST', _('Test')
    DONE = 'DONE', _('Færdig')
    ON_HOLD = 'ON_HOLD', _('On Hold')

class OpgavePriority(models.TextChoices):
    LOW = 'LOW', _('Lav')
    MEDIUM = 'MEDIUM', _('Middel')
    HIGH = 'HIGH', _('Høj')
    URGENT = 'URGENT', _('Haster')

STATUS_ORDER = {
    OpgaveStatus.BACKLOG: 0,
    OpgaveStatus.ON_HOLD: 0.5, # Place it after Backlog but before ToDo in logical order, though visually handled separately
    OpgaveStatus.TODO: 1,
    OpgaveStatus.IN_PROGRESS: 2,
    OpgaveStatus.TEST: 3,
    OpgaveStatus.DONE: 4,
}

class Opgave(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='opgaver', null=True, blank=True)
    titel = models.CharField(max_length=200)
    beskrivelse = models.TextField(blank=True, verbose_name=_('Beskrivelse (HTML)'))
    
    status = models.CharField(
        max_length=20,
        choices=OpgaveStatus.choices,
        default=OpgaveStatus.BACKLOG,
        db_index=True
    )
    
    prioritet = models.CharField(
        max_length=20,
        choices=OpgavePriority.choices,
        default=OpgavePriority.MEDIUM
    )
    

    
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='opgaver',
        verbose_name=_('Team'),
        null=True, # Allow null for transition if needed, but UI should require it
        blank=True
    )
    
    ansvarlige = models.ManyToManyField(
        User,
        blank=True,
        related_name='opgaver_som_ansvarlig',
        verbose_name=_('Ansvarlige')
    )
    
    deadline = models.DateField(null=True, blank=True)
    
    oprettet_af = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='oprettede_opgaver'
    )
    
    oprettet = models.DateTimeField(auto_now_add=True)
    opdateret = models.DateTimeField(auto_now=True)
    
    index = models.PositiveIntegerField(default=0, help_text="Sortering inden for status")
    kommentar_antal = models.PositiveIntegerField(default=0)
    status_direction = models.IntegerField(default=0, help_text="-1: Retur, 0: Samme, 1: Frem")
    arkiveret = models.BooleanField(default=False, db_index=True, verbose_name=_('Arkiveret'))

    class Meta:
        ordering = ['index', '-opdateret']
        verbose_name = _('Opgave')
        verbose_name_plural = _('Opgaver')

    def __str__(self):
        return self.titel

class OpgaveKommentar(models.Model):
    opgave = models.ForeignKey(Opgave, on_delete=models.CASCADE, related_name='kommentarer')
    tekst = models.TextField()
    bruger = models.ForeignKey(User, on_delete=models.CASCADE)
    oprettet = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['oprettet']

    def __str__(self):
        return f"Kommentar af {self.bruger} på {self.opgave}"

class OpgaveStatusLog(models.Model):
    opgave = models.ForeignKey(Opgave, on_delete=models.CASCADE, related_name='status_logs')
    gammel_status = models.CharField(max_length=20, choices=OpgaveStatus.choices)
    ny_status = models.CharField(max_length=20, choices=OpgaveStatus.choices)
    bruger = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    tidspunkt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-tidspunkt']

    def __str__(self):
        return f"{self.opgave}: {self.gammel_status} -> {self.ny_status}"

    @property
    def direction(self):
        old_val = STATUS_ORDER.get(self.gammel_status, -1)
        new_val = STATUS_ORDER.get(self.ny_status, -1)
        
        if old_val == -1 or new_val == -1:
            return "UNKNOWN"
        if new_val > old_val:
            return "UP"
        if new_val < old_val:
            return "DOWN"
        return "SAME"

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


class PinboardPost(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='prikbord_posts', null=True, blank=True)
    titel = models.CharField(max_length=200)
    beskrivelse = models.TextField(blank=True)
    oprettet_af = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='oprettede_prikbord_posts'
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='prikbord_posts',
        verbose_name=_('Team')
    )
    oprettet = models.DateTimeField(auto_now_add=True)
    opdateret = models.DateTimeField(auto_now=True)
    arkiveret = models.BooleanField(default=False, db_index=True, verbose_name=_('Arkiveret'))

    class Meta:
        ordering = ['-oprettet']
        verbose_name = _('Prikbord Post')
        verbose_name_plural = _('Prikbord Posts')

    def __str__(self):
        return self.titel

class PostEvaluation(models.TextChoices):
    GOD_IDE = 'GOD_IDE', _('God idé')
    INGEN_MENING = 'INGEN_MENING', _('Ved ikke')
    LÆST = 'LÆST', _('Læst')

class PinboardPostEvaluation(models.Model):
    post = models.ForeignKey(PinboardPost, on_delete=models.CASCADE, related_name='evalueringer')
    bruger = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_evalueringer')
    evaluering = models.CharField(max_length=20, choices=PostEvaluation.choices)
    oprettet = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'bruger')
        verbose_name = _('Post Evaluering')
        verbose_name_plural = _('Post Evalueringer')

    def __str__(self):
        return f"{self.bruger.username} - {self.post.titel}: {self.evaluering}"

class PinboardPostComment(models.Model):
    post = models.ForeignKey(PinboardPost, on_delete=models.CASCADE, related_name='kommentarer')
    bruger = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prikbord_kommentarer')
    tekst = models.TextField()
    oprettet = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['oprettet']
        verbose_name = _('Prikbord Kommentar')
        verbose_name_plural = _('Prikbord Kommentarer')

    def __str__(self):
        return f"{self.bruger.username}: {self.tekst[:20]}..."

@receiver(post_save, sender=OpgaveKommentar)
@receiver(post_delete, sender=OpgaveKommentar)
def update_kommentar_antal(sender, instance, **kwargs):
    opgave = instance.opgave
    opgave.kommentar_antal = opgave.kommentarer.count()
    opgave.save(update_fields=['kommentar_antal'])

@receiver(post_save, sender=OpgaveStatusLog)
def update_status_direction(sender, instance, created, **kwargs):
    if created:
        direction_val = instance.direction
        opgave = instance.opgave
        if direction_val == "UP":
            opgave.status_direction = 1
        elif direction_val == "DOWN":
            opgave.status_direction = -1
        else:
            opgave.status_direction = 0
        opgave.save(update_fields=['status_direction'])
