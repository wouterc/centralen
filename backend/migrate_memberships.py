import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from core.models import UserProfile, WorkspaceMembership

def seed_memberships():
    print("MIGRATING: Profile -> WorkspaceMembership...")
    users = User.objects.all()
    count = 0
    for user in users:
        if hasattr(user, 'profile') and user.profile.company:
            mem, created = WorkspaceMembership.objects.get_or_create(
                user=user,
                company=user.profile.company,
                defaults={
                    'role': user.profile.role,
                    'alias': f"{user.first_name} {user.last_name}".strip() or user.username,
                    'color': user.profile.color
                }
            )
            if created:
                count += 1
                print(f"Oprettet medlemskab for {user.username} (Firma: {user.profile.company.navn})")
    print(f"Udført! {count} nye medlemskaber skabt.")

if __name__ == "__main__":
    seed_memberships()
