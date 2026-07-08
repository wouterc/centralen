import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import Company, WorkspaceRequest
from django.contrib.auth.models import User

# Delete CodeBakery
Company.objects.filter(navn='CodeBakery').delete()
WorkspaceRequest.objects.filter(company_name='CodeBakery').delete()

print("Slettet CodeBakery data")
