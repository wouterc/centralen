import os
import sys
import time

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

print("Oversaetter eksisterende poster i databasen...")
records = UITranslation.objects.all()
count = 0
for idx, obj in enumerate(records):
    # Tjek om der er tomme eller '-' felter
    needs_save = False
    for field in ('da', 'nl', 'fr', 'de'):
        val = getattr(obj, field)
        if not val or val.strip() in ('', '-'):
            needs_save = True
            break
            
    if needs_save:
        print(f"[{idx+1}/{len(records)}] Oversaetter noegle: {obj.key} ('{obj.en[:30]}')")
        obj.save() # Udloeser den automatiske pre_save signal oversaettelse!
        count += 1
        time.sleep(0.3) # Undgaa rate limit paa API'en

print(f"Faerdig! Udloeste automatisk oversaettelse paa {count} eksisterende poster.")
