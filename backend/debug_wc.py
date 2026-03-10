
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Team

user = User.objects.filter(username='WC').first()
if user:
    print(f"User: {user.username}")
    print(f"Is Superuser: {user.is_superuser}")
    print(f"Is Staff: {user.is_staff}")
    if hasattr(user, 'profile'):
        print(f"Profile Role: {user.profile.role}")
    else:
        print("No profile found")
    
    print("\nTeams membership:")
    teams = user.teams.all()
    for team in teams:
        print(f" - {team.navn} (ID: {team.id})")
    
    print("\nAll Teams in DB:")
    all_teams = Team.objects.all()
    for team in all_teams:
        is_member = user in team.medlemmer.all()
        print(f" - {team.navn} (ID: {team.id}) {'[MEMBER]' if is_member else '[NOT MEMBER]'}")

else:
    print("User WC not found")
