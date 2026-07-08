import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import Company, WorkspaceRequest, WorkspaceMembership
from vidensbank.models import VidensKategori, Viden

def deep_cleanup(company_name):
    companies = Company.objects.filter(navn=company_name)
    for company in companies:
        print(f"Sletter data for firma: {company.navn} ({company.id})")
        # Delete Viden first due to PROTECT on kategori
        Viden.objects.filter(company=company).delete()
        # Delete VidensKategori
        VidensKategori.objects.filter(company=company).delete()
        # Delete Company (will cascade to memberships, teams, invitations)
        company.delete()
    
    # Also cleanup requests
    WorkspaceRequest.objects.filter(company_name=company_name).delete()
    print(f"Færdig med oprydning af {company_name}")

deep_cleanup("CodeBakery")
deep_cleanup("CB")
deep_cleanup("Amelie")
