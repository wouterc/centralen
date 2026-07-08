import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

translations = [
    ('aarshjul.prev_month', 'Previous Month', 'Forrige måned', 'Vorige maand', 'Mois précédent', 'Vorheriger Monat'),
    ('aarshjul.next_month', 'Next Month', 'Næste måned', 'Volgende maand', 'Mois suivant', 'Nächster Monat'),
    ('aarshjul.undo', 'Undo ({{count}})', 'Fortryd ({{count}})', 'Ongedaan maken ({{count}})', 'Annuler ({{count}})', 'Rückgängig ({{count}})'),
    ('aarshjul.today', 'Today', 'I dag', 'Vandaag', "Aujourd'hui", 'Heute'),
    ('aarshjul.refresh_tooltip', 'Refresh data', 'Opdater data', 'Gegevens verversen', 'Actualiser les données', 'Daten aktualisieren'),
    ('aarshjul.new_activity', 'New Activity', 'Ny Aktivitet', 'Nieuwe activiteit', 'Nouvelle activité', 'Neue Aktivität'),
]

for key, en_text, da_text, nl_text, fr_text, de_text in translations:
    obj, created = UITranslation.objects.get_or_create(
        key=key,
        defaults={
            'en': en_text,
            'da': da_text,
            'nl': nl_text,
            'fr': fr_text,
            'de': de_text
        }
    )
    if not created:
        obj.en = en_text
        obj.da = da_text
        obj.nl = nl_text
        obj.fr = fr_text
        obj.de = de_text
        obj.save()

print(f"Successfully seeded {len(translations)} annual calendar control translations into the database.")
