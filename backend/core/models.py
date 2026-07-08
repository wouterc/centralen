import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    navn = models.CharField(max_length=255)
    cvr = models.CharField(max_length=20, blank=True, null=True)
    slug = models.SlugField(unique=True, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Virksomhed')
        verbose_name_plural = _('Virksomheder')

    def __str__(self):
        return self.navn

class Team(models.Model):
    navn = models.CharField(max_length=100)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='teams', null=True, blank=True)
    color = models.CharField(max_length=20, default='#3b82f6')
    medlemmer = models.ManyToManyField(User, related_name='teams', blank=True)
    oprettet = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Team')
        verbose_name_plural = _('Teams')
        unique_together = ('navn', 'company')
        ordering = ['navn']

    def __str__(self):
        return f"{self.navn} ({self.company.navn if self.company else 'Ingen virksomhed'})"

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', _('Administrator')
    SUPERUSER = 'SUPERUSER', _('Superbruger')
    MEMBER = 'MEMBER', _('Medlem')

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='profiles', null=True, blank=True)
    color = models.CharField(max_length=20, default='#3b82f6')
    role = models.CharField(
        max_length=20, 
        choices=UserRole.choices, 
        default=UserRole.MEMBER
    )
    vidensbank_category_order = models.JSONField(default=list, blank=True)
    language = models.CharField(max_length=10, default='da', help_text=_("Brugerens foretrukne sprog"))

    def __str__(self):
        return f"Profil for {self.user.username} ({self.company.navn if self.company else 'Ingen virksomhed'})"

class WorkspaceMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(
        max_length=20, 
        choices=UserRole.choices, 
        default=UserRole.MEMBER
    )
    alias = models.CharField(max_length=255, blank=True, null=True, help_text=_("Visningsnavn i dette arbejdsrum"))
    color = models.CharField(max_length=20, default='#3b82f6')
    oprettet = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Arbejdsrum Medlemskab')
        verbose_name_plural = _('Arbejdsrum Medlemskaber')
        unique_together = ('user', 'company')

    def __str__(self):
        return f"{self.user.email} i {self.company.navn} ({self.role})"

class Invitation(models.Model):
    email = models.EmailField()
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='invitations')
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.MEMBER)
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sent_invitations')
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _('Invitation')
        verbose_name_plural = _('Invitationer')

    def __str__(self):
        return f"Invitation til {self.email} ({self.company.navn})"

class WorkspaceRequest(models.Model):
    email = models.EmailField()
    company_name = models.CharField(max_length=255)
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _('Arbejdsrum forespørgsel')
        verbose_name_plural = _('Arbejdsrum forespørgsler')

    def __str__(self):
        return f"Anmodning: {self.company_name} af {self.email}"

class UITranslation(models.Model):
    key = models.CharField(max_length=255, unique=True)
    en = models.TextField(verbose_name=_('Engelsk (Base)'))
    da = models.TextField(verbose_name=_('Dansk'), blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('UI Oversættelse')
        verbose_name_plural = _('UI Oversættelser')

    def __str__(self):
        return self.key

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if kwargs.get('raw', False):
        return
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if kwargs.get('raw', False):
        return
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        UserProfile.objects.get_or_create(user=instance)
