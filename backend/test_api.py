import os
import django
import json
from django.test import RequestFactory
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from tidsregistrering.views import TidregViewSet, BrugerProfilTimeViewSet

factory = RequestFactory()
user = User.objects.get(username='WC')

print("--- Tidreg ---")
view = TidregViewSet.as_view({'get': 'list'})
request = factory.get('/api/tidsregistrering/registreringer/')
request.user = user
response = view(request)
response.render()
print(f"Status: {response.status_code}")
# print(response.content.decode())

print("\n--- Profiler ---")
view = BrugerProfilTimeViewSet.as_view({'get': 'list'})
request = factory.get('/api/tidsregistrering/profiler/')
request.user = user
response = view(request)
response.render()
print(f"Status: {response.status_code}")
print(f"Count: {len(json.loads(response.content))}")
print(response.content.decode())
