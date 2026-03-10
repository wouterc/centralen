from django.db import models
from core.models import Team

from core.models import Team, Company

class AppPurpose(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='app_purposes', null=True, blank=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class AppLink(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='app_links', null=True, blank=True)
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
