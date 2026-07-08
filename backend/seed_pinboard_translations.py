import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

translations = [
    ('pinboard.empty_state', 'The board is empty... Pin something up!', 'Tavlen er tom... Hæng noget op!', 'Het bord is leeg... Hang iets op!', 'Le tableau est vide... Épinglez quelque chose !', 'Die Pinnwand ist leer... Pinne etwas an!'),
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

print(f"Successfully seeded {len(translations)} pinboard translations into the database.")
