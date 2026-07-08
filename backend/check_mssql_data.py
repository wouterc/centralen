import os
import django
from django.conf import settings
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT id, gruppe FROM tidsregistrering_kodergrupper")
    rows = cursor.fetchall()
    print("KoderGrupper in MSSQL:")
    for r in rows:
        print(f"ID: {r[0]}, Gruppe: {r[1]}")
        
    cursor.execute("SELECT id, gruppe_id FROM tidsregistrering_opgaverkode")
    rows = cursor.fetchall()
    print("\nOpgaverKode snippets in MSSQL (ID, gruppe_id):")
    for r in rows[:10]:
        print(f"ID: {r[0]}, Gruppe_ID: {r[1]}")
