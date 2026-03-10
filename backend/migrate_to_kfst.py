import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import Company, Team, UserProfile
from opgaver.models import Opgave, PinboardPost
from vidensbank.models import VidensKategori, Viden, HjaelpPunkt
from tidsregistrering.models import KoderGrupper, OpgaverKode, Tidreg
from aarshjul.models import AarshjulGruppe, Aktivitet
from applinks.models import AppPurpose, AppLink

def migrate_data():
    # 1. Opret eller find Company "KFST"
    company, created = Company.objects.get_or_create(
        navn="KFST",
        defaults={'cvr': '12345678', 'slug': 'kfst'}
    )
    
    if created:
        print(f"Oprettede ny virksomhed: {company.navn} (ID: {company.id})")
    else:
        print(f"Fandt eksisterende virksomhed: {company.navn} (ID: {company.id})")

    # Liste over alle modeller der skal opdateres
    models_to_update = [
        (UserProfile, 'profileer'),
        (Team, 'teams'),
        (Opgave, 'opgaver'),
        (PinboardPost, 'prikbord_posts'),
        (VidensKategori, 'videnskategorier'),
        (Viden, 'viden_artikler'),
        (KoderGrupper, 'kodegrupper'),
        (OpgaverKode, 'opgavekoder'),
        (Tidreg, 'tidsregistreringer'),
        (AarshjulGruppe, 'aarshjul_grupper'),
        (Aktivitet, 'aktiviteter'),
        (AppPurpose, 'app_purposes'),
        (AppLink, 'app_links'),
    ]

    total_updates = 0

    print("\nStarter migrering af data til KFST...")
    
    for ModelClass, name in models_to_update:
        # Find records uden company
        records = ModelClass.objects.filter(company__isnull=True)
        count = records.count()
        
        if count > 0:
            # Opdater direkte i databasen for effektivitet
            updated = records.update(company=company)
            print(f"- Opdaterede {updated} {name}")
            total_updates += updated
        else:
            print(f"- Ingen {name} manglede virksomhed")

    print(f"\nMigrering fuldført! Totalt {total_updates} rækker blev tilknyttet KFST.")

if __name__ == "__main__":
    migrate_data()
