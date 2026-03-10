import os
import django
import random

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from opgaver.models import PinboardPost, PinboardPostEvaluation
from core.models import Team

def generate_mock_posts():
    users = list(User.objects.filter(is_active=True))
    teams = list(Team.objects.all())
    
    if not users or not teams:
        print("Mangler brugere eller teams i databasen.")
        return

    titles = [
        "Skal vi have kage på fredag?",
        "Nyt kaffeprojekt",
        "Husk at lukke vinduerne",
        "Nyt kursus i Python",
        "Sommerfest idé?",
        "Forbedring af indgangspartiet",
        "Gode råd til tidsregistrering",
        "Hvem har min oplader?",
        "Fælles morgenmad",
        "Projekt deadline rykket",
        "Nye planter til kontoret",
        "Nyt team navn?",
        "Design review kl 14",
        "Møde om strategi",
        "Husk at tømme opvaskeren"
    ]
    
    descriptions = [
        "Jeg har tænkt på om vi ikke skulle fejre ugens afslutning.",
        "Jeg har fundet en ny bønne vi skal prøve.",
        "Det trækker når de står åbne om natten.",
        "Der er et fedt kursus på Udemy jeg har set på.",
        "Lad os finde på noget sjovt i år!",
        "Det ser lidt brugt ud, måske lidt maling?",
        "Jeg har fundet en genvej i systemet.",
        "Jeg glemte min i går, har nogen set den?",
        "Jeg bager boller på tirsdag.",
        "Vi har fået en uge mere til at færdiggøre det.",
        "De nuværende ser lidt vilde ud.",
        "Skal vi hedde noget andet end 'Team Jura'?",
        "Vi kigger på de nye mockups.",
        "Dagsorden er sendt ud på mail.",
        "Det er alles ansvar!"
    ]

    print(f"Genererer 20 mock post-its...")
    
    for _ in range(20):
        creator = random.choice(users)
        team = random.choice(teams)
        title = random.choice(titles)
        desc = random.choice(descriptions)
        
        post = PinboardPost.objects.create(
            titel=title,
            beskrivelse=desc,
            oprettet_af=creator,
            team=team
        )
        print(f"Oprettet: '{title}' for {team.navn} af {creator.username}")

if __name__ == "__main__":
    generate_mock_posts()
