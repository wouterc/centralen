import pyodbc
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from tidsregistrering.models import OpgaverKode, Tidreg, BrugerProfilTime, KoderGrupper
from django.utils import timezone
import datetime

class Command(BaseCommand):
    help = 'Migrates data from the standalone TidReg database'

    def handle(self, *args, **options):
        # Connection details for the source database
        conn_str = (
            "DRIVER={ODBC Driver 18 for SQL Server};"
            "SERVER=193.104.202.8,44841;"
            "DATABASE=TidReg;"
            "UID=MGLPFelles;"
            "PWD=Mglp074076;"
            "Encrypt=no;"
            "TrustServerCertificate=yes;"
        )

        try:
            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()
            self.stdout.write(self.style.SUCCESS('Connected to TidReg database'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Could not connect to TidReg: {e}'))
            return

        # 1. Migrate KoderGrupper
        self.stdout.write('Migrating KoderGrupper...')
        try:
            cursor.execute("SELECT Gruppe, Beskrivelse FROM KoderGrupper")
            rows = cursor.fetchall()
            for row in rows:
                KoderGrupper.objects.update_or_create(
                    gruppe=row.Gruppe,
                    defaults={'beskrivelse': row.Beskrivelse}
                )
            self.stdout.write(self.style.SUCCESS(f'Migrated {len(rows)} groups'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'KoderGrupper migration failed (table might not exist yet): {e}'))

        # 2. Migrate OpgaverKoder
        self.stdout.write('Migrating OpgaverKoder...')
        cursor.execute("SELECT KodeNr, Beskrivelse, Mtime, Gruppe FROM OpgaverKoder")
        rows = cursor.fetchall()
        for row in rows:
            # Match group if it exists
            gruppe_obj = None
            if row.Gruppe:
                gruppe_obj = KoderGrupper.objects.filter(gruppe=row.Gruppe).first()
            
            OpgaverKode.objects.update_or_create(
                kode_nr=row.KodeNr,
                defaults={
                    'beskrivelse': row.Beskrivelse,
                    'mtime': row.Mtime,
                    'gruppe': gruppe_obj
                }
            )
        self.stdout.write(self.style.SUCCESS(f'Migrated {len(rows)} task codes'))

        # 3. Migrate Registreringer
        self.stdout.write('Migrating Registreringer...')
        cursor.execute("SELECT Bruger, KodeNr, Alias, Fra_Tid, Til_Tid, Tid, Kommentar, Aktiv FROM Registreringer")
        rows = cursor.fetchall()
        
        user_cache = {}
        kode_cache = {}
        
        migrated_count = 0
        for row in rows:
            # Find User
            username = row.Bruger
            if username not in user_cache:
                user = User.objects.filter(username=username).first()
                if not user:
                    # Create user if not exists to preserve history
                    user = User.objects.create_user(username=username, password='temporary_password_migrate')
                    self.stdout.write(self.style.WARNING(f'Created user {username} for migration'))
                user_cache[username] = user
            user = user_cache[username]

            # Find OpgaveKode
            kode_nr = row.KodeNr
            if kode_nr not in kode_cache:
                kode_obj = OpgaverKode.objects.filter(kode_nr=kode_nr).first()
                kode_cache[kode_nr] = kode_obj
            kode_obj = kode_cache[kode_nr]

            if not kode_obj:
                self.stdout.write(self.style.WARNING(f'Skipping registration for unknown code: {kode_nr}'))
                continue

            # Create Tidreg
            # Note: We use Fra_Tid as a unique-ish marker but since multiple might exist, we just create
            Tidreg.objects.get_or_create(
                bruger=user,
                opgave_kode=kode_obj,
                fra_tid=row.Fra_Tid,
                defaults={
                    'alias': row.Alias,
                    'til_tid': row.Til_Tid,
                    'tid': row.Tid,
                    'kommentar': row.Kommentar,
                    'aktiv': row.Aktiv
                }
            )
            migrated_count += 1
            
        self.stdout.write(self.style.SUCCESS(f'Migrated {migrated_count} registrations'))

        # 4. Migrate BrugerProfiler (Favorites)
        self.stdout.write('Migrating BrugerProfiler...')
        try:
            cursor.execute("SELECT Bruger, KodeNr, Alias, Sortering FROM BrugerProfiler")
            rows = cursor.fetchall()
            for row in rows:
                username = row.Bruger
                user = User.objects.filter(username=username).first()
                if not user: continue
                
                kode_obj = OpgaverKode.objects.filter(kode_nr=row.KodeNr).first()
                if not kode_obj: continue
                
                BrugerProfilTime.objects.update_or_create(
                    bruger=user,
                    opgave_kode=kode_obj,
                    defaults={
                        'alias': row.Alias,
                        'sortering': row.Sortering
                    }
                )
            self.stdout.write(self.style.SUCCESS(f'Migrated {len(rows)} user profiles'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'BrugerProfiler migration failed: {e}'))

        conn.close()
        self.stdout.write(self.style.SUCCESS('Data migration completed successfully!'))
