from django.contrib import admin
from .models import Company, Team, UserProfile, UITranslation

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('navn', 'cvr', 'slug', 'is_active', 'created_at')
    search_fields = ('navn', 'cvr')

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('navn', 'company', 'color', 'oprettet')
    list_filter = ('company',)
    search_fields = ('navn',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'company', 'role')
    list_filter = ('company', 'role')
    search_fields = ('user__username', 'user__email')

@admin.register(UITranslation)
class UITranslationAdmin(admin.ModelAdmin):
    list_display = ('key', 'en', 'da', 'updated_at')
    search_fields = ('key', 'en', 'da')
