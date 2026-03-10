import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

translations = [
    # TidsregistreringPage
    ('time.setup_tab', 'Setup', 'Opsætning'),
    ('time.overview_tab', 'Overview', 'Oversigt'),
    ('time.loading_tasks', 'Fetching your tasks...', 'Henter dine opgaver...'),
    ('time.edit_time', 'Edit time', 'Ret tid'),
    ('time.status_active', 'Active', 'Aktiv'),
    ('time.status_last_registered', 'Last registered', 'Sidst registreret'),
    ('time.status_ready', 'Ready', 'Klar'),
    ('time.no_favorites_title', 'No favorites yet', 'Ingen favoritter endnu'),
    ('time.no_favorites_desc', 'Go to "Setup" to add your most used task codes to your dashboard.', 'Gå til "Opsætning" for at tilføje dine mest brugte opgavekoder til din oversigt.'),
    ('time.setup_now', 'SETUP NOW', 'OPSÆT NU'),
    
    # SetupView
    ('time.setup_all_codes', 'All Task Codes', 'Alle Opgavekoder'),
    ('time.setup_search_placeholder', 'Search codes...', 'Søg i koder...'),
    ('time.setup_my_favorites', 'My Favorites (Dashboard)', 'Mine Favoritter (Dashboard)'),
    ('time.setup_drag_info', 'Drag codes to change the sorting order on your dashboard.', 'Flyt koderne for at ændre rækkefølgen på din forside.'),
    ('time.setup_alias_placeholder', 'Give the task a name...', 'Giv opgaven et navn...'),
    ('time.setup_add_hint', 'Add codes from the left side', 'Tilføj koder fra venstre side'),
    
    # OverviewView
    ('time.overview_weekly', 'WEEKLY OVERVIEW', 'UGEOVERSIGT'),
    ('time.overview_period', 'PERIOD', 'PERIODE'),
    ('time.overview_export_csv', 'EXPORT CSV', 'EKSPORTER CSV'),
    ('time.overview_col_date', 'Date', 'Dato'),
    ('time.overview_col_time', 'Time', 'Tid'),
    ('time.overview_col_code', 'Code', 'Kode'),
    ('time.overview_col_desc', 'Description', 'Beskrivelse'),
    ('time.overview_col_action', 'Action', 'Handling'),
    ('time.overview_col_group', 'Group', 'Gruppe'),
    ('time.overview_col_mon', 'Mon', 'Man'),
    ('time.overview_col_tue', 'Tue', 'Tir'),
    ('time.overview_col_wed', 'Wed', 'Ons'),
    ('time.overview_col_thu', 'Thu', 'Tor'),
    ('time.overview_col_fri', 'Fri', 'Fre'),
    ('time.overview_col_sat', 'Sat', 'Lør'),
    ('time.overview_col_sun', 'Sun', 'Søn'),
    ('time.overview_col_total', 'Total', 'Total'),
    ('time.overview_no_registrations', 'No registrations found for this period', 'Ingen registreringer fundet for denne periode'),
    ('time.overview_no_data', 'No data for this week', 'Ingen data for denne uge'),
    ('time.overview_weekly_total', 'Weekly Total:', 'Ugentlig Total:'),
]

for key, en_text, da_text in translations:
    obj, created = UITranslation.objects.get_or_create(key=key, defaults={'en': en_text, 'da': da_text})
    if not created:
        obj.en = en_text
        obj.da = da_text
        obj.save()

print(f"Seeded {len(translations)} new translations into the database.")
