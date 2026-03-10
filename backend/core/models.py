from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

class Team(models.Model):
    navn = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=20, default='#3b82f6')
    medlemmer = models.ManyToManyField(User, related_name='teams', blank=True)
    oprettet = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Team')
        verbose_name_plural = _('Teams')
        ordering = ['navn']

    def __str__(self):
        return self.navn

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', _('Administrator')
    SUPERUSER = 'SUPERUSER', _('Superbruger')
    MEMBER = 'MEMBER', _('Medlem')

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    color = models.CharField(max_length=20, default='#3b82f6')
    role = models.CharField(
        max_length=20, 
        choices=UserRole.choices, 
        default=UserRole.MEMBER
    )
    vidensbank_category_order = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Profil for {self.user.username}"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        UserProfile.objects.get_or_create(user=instance)
