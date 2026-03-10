import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

translations = [
    # Vidensbank (Knowledge Base)
    ('kb.title', 'Knowledge Base', 'Vidensbank'),
    ('kb.subtitle', 'Collection of knowledge, templates, and guides for case processing.', 'Samling af viden, skabeloner og vejledninger til sagsbehandling.'),
    ('kb.add_new', 'Add new knowledge', 'Tilføj ny viden'),
    ('kb.filters', 'Filters', 'Filtre'),
    ('kb.clear_filters', 'Clear', 'Ryd'),
    ('kb.show_archived', 'Show archived', 'Vis arkiverede'),
    ('kb.trash', 'Trash (Deleted)', 'Papirkurv (Slettede)'),
    ('kb.categories', 'Categories', 'Kategorier'),
    ('kb.all_categories', 'All categories', 'Alle kategorier'),
    ('kb.search_placeholder', 'Search title or text...', 'Søg i titel eller tekst...'),
    ('kb.search_deleted_placeholder', 'Search in deleted articles...', 'Søg i slettede artikler...'),
    ('kb.trash_empty', 'The trash is empty.', 'Papirkurven er tom.'),
    ('kb.no_results', 'We found no results matching your search. Try different keywords.', 'Vi fandt ikke noget, der matchede din søgning. Prøv med andre søgeord.'),
    ('kb.clear_all_filters', 'Clear all filters', 'Ryd alle filtre'),

    # Tidsregistrering (Time Tracking)
    ('time.title', 'Time Tracking', 'Tidsregistrering'),
    ('time.subtitle', 'Register your hours and track your time.', 'Registrer dine timer og hold styr på din tid.'),
    ('time.add_entry', 'Add Entry', 'Tilføj registrering'),

    # Aarshjul (Annual Cycle)
    ('calendar.title', 'Annual Calendar', 'Årshjul'),
    ('calendar.subtitle', 'Annual overview of activities and deadlines.', 'Årligt overblik over aktiviteter og deadlines.'),
    
    # Applinks (Apps)
    ('apps.title', 'Applications', 'Applikationer'),
    ('apps.subtitle', 'Links to external systems and tools.', 'Links til eksterne systemer og værktøjer.'),
    
    # Users & Teams 
    ('users.title', 'Users & Teams', 'Brugere & Teams'),
    ('users.subtitle', 'Manage users, roles, and teams.', 'Administrer brugere, roller og teams.'),

    # Common buttons
    ('common.save', 'Save', 'Gem'),
    ('common.cancel', 'Cancel', 'Annuller'),
    ('common.delete', 'Delete', 'Slet'),
    ('common.edit', 'Edit', 'Rediger'),
    ('common.close', 'Close', 'Luk'),
]

for key, en_text, da_text in translations:
    obj, created = UITranslation.objects.get_or_create(key=key, defaults={'en': en_text, 'da': da_text})
    if not created:
        obj.en = en_text
        obj.da = da_text
        obj.save()

print(f"Seeded {len(translations)} translations into the database.")
