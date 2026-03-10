import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Team, UserProfile
from opgaver.models import Opgave

try:
    u = User.objects.get(username='WC')
    print(f"User: {u.username} (ID: {u.id})")
    
    current_team = Team.objects.filter(navn='Home').first()
    if current_team:
        print(f"Team 'Home' ID: {current_team.id}")
        tasks = Opgave.objects.filter(team=current_team, arkiveret=False)
        print(f"Visible Tasks for team 'Home': {tasks.count()}")
        for t in tasks:
            print(f"  ID: {t.id}, Titel: {t.titel}, Status: '{t.status}', Oprettet af: {t.oprettet_af.username}")
    else:
        print("Team 'Home' not found.")

except Exception as e:
    print(f"Error: {e}")
