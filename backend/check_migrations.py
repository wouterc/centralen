import os
import django
from django.conf import settings
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT app, name FROM django_migrations")
    migrations = cursor.fetchall()
    print("Applied migrations in database:")
    for m in migrations:
        print(f"{m[0]}: {m[1]}")
