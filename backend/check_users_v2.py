import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import WorkspaceMembership, Company

users = User.objects.filter(email='wouter.cuyvers@gmail.com')
print(f"Total users found: {users.count()}")

for u in users:
    memberships = WorkspaceMembership.objects.filter(user=u)
    m_info = [f"{m.company.navn} (Role: {m.role})" for m in memberships]
    print(f"User ID: {u.id}, Username: {u.username}, Memberships: {', '.join(m_info) or 'None'}")
