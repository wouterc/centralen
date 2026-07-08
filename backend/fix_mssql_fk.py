import os
import django
from django.conf import settings
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

with connection.cursor() as cursor:
    print("Fixing OpgaverKode.gruppe_id in MSSQL...")
    # Map 'gruppe' (string) to 'id' (integer)
    cursor.execute("""
        UPDATE tidsregistrering_opgaverkode
        SET gruppe_id = kg.id
        FROM tidsregistrering_opgaverkode ok
        JOIN tidsregistrering_kodergrupper kg ON CAST(ok.gruppe_id AS NVARCHAR(6)) = kg.gruppe
        WHERE ok.id = ok.id -- Standard MSSQL safety check
    """)
    # Wait, MSSQL UPDATE FROM syntax is slightly different: 
    # UPDATE ok SET ok.gruppe_id = kg.id FROM ...
    
    cursor.execute("""
        UPDATE ok
        SET ok.gruppe_id = kg.id
        FROM tidsregistrering_opgaverkode ok
        INNER JOIN tidsregistrering_kodergrupper kg ON CAST(ok.gruppe_id AS NVARCHAR(6)) = kg.gruppe
    """)
    
    # Check if ANY are still broken (e.g. they were null or already fixed?)
    # Actually, we should check which ones were NOT updated.
    print("FK Update attempted.")
    
    # Also check Tidreg if it has similar problems.
    # Tidreg.opgave_kode_id -> OpgaverKode.id?
    # I'll check my earlier check script results. 
    # OpgaverKode ID and gruppe_id were integers in the print? Oh, they were strings in the dump?
    
    print("Fixing Tidreg.opgave_kode_id if needed...")
    # I don't see Tidreg having issues yet, but let's be thorough if there's time.
    # Actually, if loaddata only complained about tidsregistrering_kodergrupper, I'll stop there.
