import os
import django
from django.conf import settings
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT count(*) FROM core_company")
    count = cursor.fetchone()[0]
    print(f"Number of companies: {count}")
