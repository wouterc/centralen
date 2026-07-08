import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import WorkspaceMembership, UserProfile

user = User.objects.get(email='wouter.cuyvers@gmail.com')
print(f"Updating user {user.username} (ID: {user.id}) to ADMIN everywhere...")

# 1. Update WorkspaceMemberships
memberships = WorkspaceMembership.objects.filter(user=user)
for m in memberships:
    m.role = 'ADMIN'
    m.save()
    print(f"Updated membership in {m.company.navn} to ADMIN.")

# 2. Update UserProfile
profile, _ = UserProfile.objects.get_or_create(user=user)
profile.role = 'ADMIN'
profile.save()
print("Updated UserProfile to ADMIN.")

# 3. Update User flags
user.is_superuser = True
user.is_staff = True
user.save()
print("Updated User superuser and staff flags.")

print("Done.")
