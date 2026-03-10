import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

translations = [
    # Pinboard (Prikbordet)
    ('pinboard.title', 'PINBOARD', 'PRIKBORDET'),
    ('pinboard.subtitle', 'Ideas & dialogue', 'Idéer & dialog'),
    
    # Common labels & placeholders
    ('common.all_teams', 'ALL TEAMS', 'ALLE TEAMS'),
    ('common.only_mine', 'ONLY MINE', 'KUN MINE'),
    ('common.search_placeholder', 'SEARCH...', 'SØG...'),

    # Users page
    ('users.search_users', 'Search for users or teams...', 'Søg efter navn eller team...'),
    ('users.search_teams', 'Search for team...', 'Søg efter team...'),
    ('users.search_groups', 'Search for group...', 'Søg efter gruppe...'),

    # Apps page
    ('apps.search_placeholder', 'Search apps, teams, or purposes...', 'Søg i apps, teams eller formål...'),
    ('apps.teams.all_selected', 'All teams selected', 'Alle teams er valgt'),
]

for key, en_text, da_text in translations:
    obj, created = UITranslation.objects.get_or_create(key=key, defaults={'en': en_text, 'da': da_text})
    if not created:
        obj.en = en_text
        obj.da = da_text
        obj.save()

print(f"Seeded {len(translations)} new translations into the database.")
