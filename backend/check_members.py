
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Team

team = Team.objects.get(id=1)
print(f"Team: {team.navn}")
print("Members:")
for u in team.medlemmer.all():
    print(f" - {u.username} (ID: {u.id})")

user_wc = User.objects.get(username='WC')
print(f"\nUser WC: ID {user_wc.id}")
print(f"Is WC in Home? {user_wc in team.medlemmer.all()}")
