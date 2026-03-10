from django.db import models
from core.models import Team

class AppPurpose(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class AppLink(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    path = models.CharField(max_length=1000)
    
    # Relationships
    teams = models.ManyToManyField(Team, related_name='app_links', blank=True)
    purposes = models.ManyToManyField(AppPurpose, related_name='app_links', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['title']
