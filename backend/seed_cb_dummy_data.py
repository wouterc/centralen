import os
import django
from django.utils import timezone
from datetime import timedelta
import random

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from core.models import Company, Team, UserProfile
from opgaver.models import Opgave, PinboardPost
from vidensbank.models import VidensKategori, Viden
from tidsregistrering.models import KoderGrupper, OpgaverKode, Tidreg
from aarshjul.models import AarshjulGruppe, Aktivitet
from applinks.models import AppPurpose, AppLink

def create_dummy_data():
    print("Opretter virksomhed CB og dummy data...")

    # 1. Company
    cb, created = Company.objects.get_or_create(
        navn="CB", 
        defaults={'cvr': '87654321', 'slug': 'cb'}
    )
    print(f"Virksomhed CB: {'Oprettet' if created else 'Findes allerede'} (ID: {cb.id})")

    # 2. Users & Profiles
    users_data = [
        ('cb_admin', 'cb_admin@example.com', 'Admin', 'CB'),
        ('cb_user1', 'cb_user1@example.com', 'User 1', 'CB'),
        ('cb_user2', 'cb_user2@example.com', 'User 2', 'CB'),
    ]
    cb_users = []
    for username, email, first, last in users_data:
        user, u_created = User.objects.get_or_create(username=username, defaults={'email': email, 'first_name': first, 'last_name': last})
        if u_created:
            user.set_password('password123')
            user.save()
        profile, p_created = UserProfile.objects.get_or_create(user=user, defaults={'company': cb, 'rolle': 'ADMIN' if 'admin' in username else 'USER'})
        if not p_created and profile.company != cb:
            profile.company = cb
            profile.save()
        cb_users.append(user)
    print(f"Oprettet/opdateret {len(cb_users)} brugere.")

    # 3. Teams
    teams_data = ['Udvikling', 'Salg', 'Support']
    cb_teams = []
    for t_name in teams_data:
        team, t_created = Team.objects.get_or_create(navn=t_name, company=cb)
        if t_created:
            team.medlemmer.add(*cb_users)
        cb_teams.append(team)
    print(f"Oprettet {len(cb_teams)} teams.")

    # 4. Tasks (Opgaver)
    for i in range(5):
        team = random.choice(cb_teams)
        obj, _ = Opgave.objects.get_or_create(
            titel=f"CB Opgave {i+1}",
            company=cb,
            defaults={
                'beskrivelse': f"Dette er en dummy opgave for {cb.navn}",
                'team': team,
                'status': random.choice(['TODO', 'IN_PROGRESS', 'DONE']),
                'prioritet': random.choice(['LOW', 'MEDIUM', 'HIGH']),
                'oprettet_af': cb_users[0]
            }
        )
        obj.ansvarlige.add(random.choice(cb_users))
    print("Oprettet 5 opgaver.")

    # 5. Pinboard
    for i in range(4):
        team = random.choice(cb_teams)
        PinboardPost.objects.get_or_create(
            titel=f"Vigtig CB besked {i+1}",
            company=cb,
            defaults={
                'beskrivelse': "Husk at tjekke op på de nye procedurer.",
                'oprettet_af': random.choice(cb_users),
                'team': team
            }
        )
    print("Oprettet 4 prikbord posts.")

    # 6. Vidensbank
    kategori, k_created = VidensKategori.objects.get_or_create(
        navn="Generel CB Viden", company=cb, defaults={'beskrivelse': 'Fælles viden for CB'}
    )
    for i in range(3):
        Viden.objects.get_or_create(
            titel=f"CB Guide {i+1}",
            company=cb,
            defaults={
                'indhold': f"Her er vejledningen til emne {i+1} for virksomheden CB.",
                'kategori': kategori,
                'oprettet_af': cb_users[0]
            }
        )
    print("Oprettet 1 videnskategori og 3 artikler.")

    # 7. Tidsregistrering
    kg_admin, _ = KoderGrupper.objects.get_or_create(
        company=cb, gruppe="ADM", defaults={'beskrivelse': 'Administration'}
    )
    kg_drift, _ = KoderGrupper.objects.get_or_create(
        company=cb, gruppe="DRIFT", defaults={'beskrivelse': 'Drift'}
    )
    
    koder_data = [
        ("ADM01", "Intern møde", kg_admin),
        ("ADM02", "Mail korrespondance", kg_admin),
        ("DRI01", "Systemvedligehold", kg_drift),
        ("DRI02", "Kundesupport", kg_drift),
    ]
    
    cb_opgavekoder = []
    for knr, besk, grp in koder_data:
        okode, _ = OpgaverKode.objects.get_or_create(
            kode_nr=knr, company=cb, defaults={'beskrivelse': besk, 'gruppe': grp}
        )
        cb_opgavekoder.append(okode)
        
    for user in cb_users:
        for i in range(5):
            Tidreg.objects.get_or_create(
                bruger=user,
                opgave_kode=random.choice(cb_opgavekoder),
                fra_tid=timezone.now() - timedelta(days=random.randint(0, 5), hours=random.randint(1, 5)),
                company=cb,
                defaults={
                    'til_tid': timezone.now() - timedelta(days=random.randint(0, 5)),
                    'tid': f"0{random.randint(1,4)}:{random.randint(10,50)}:00",
                    'alias': "Sagsbehandling",
                    'aktiv': False
                }
            )
    print("Oprettet tidsregistreringsgrupper, koder og tidslogs.")

    # 8. Årshjul
    ag, _ = AarshjulGruppe.objects.get_or_create(navn="CB Driftsopgaver", company=cb)
    for i in range(3):
        start = timezone.now().date() + timedelta(days=i*30)
        Aktivitet.objects.get_or_create(
            navn=f"CB Månedsafslutning {i+1}",
            company=cb,
            start_dato=start,
            slut_dato=start + timedelta(days=2),
            defaults={'beskrivelse': 'Afstemning og rapportering', 'gruppe': ag}
        )
    print("Oprettet 1 Årshjul gruppe og 3 aktiviteter.")

    # 9. AppLinks
    purpose, _ = AppPurpose.objects.get_or_create(name="CB Interne Værktøjer", company=cb)
    AppLink.objects.get_or_create(
        title="CB Intranet",
        company=cb,
        defaults={'path': 'https://intranet.cb.dk', 'description': 'Hovedindgang til CB værktøjer'}
    )
    print("Oprettet AppLinks.")

    print("\nDummy data for CB er nu genereret med succes!")

if __name__ == "__main__":
    create_dummy_data()
