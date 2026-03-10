import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from tidsregistrering.models import BrugerProfilTime
from tidsregistrering.serializers import BrugerProfilTimeSerializer

user = User.objects.get(username='WC')
profs = BrugerProfilTime.objects.filter(bruger=user)
serializer = BrugerProfilTimeSerializer(profs, many=True)

print(json.dumps(serializer.data, indent=2))
