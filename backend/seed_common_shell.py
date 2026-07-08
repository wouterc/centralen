
from core.models import UITranslation

translations = {
    # Common
    'common.whoops': 'Hovsa!',
    'common.back_to_login': 'Tilbage til login',
    'common.error_generic': 'Der skete en fejl. Prøv igen senere.',
    'common.save': 'Gem',
    'common.cancel': 'Annuller',
    'common.delete': 'Slet',
    'common.edit': 'Rediger',
    'common.confirm': 'Bekræft',
    'common.loading': 'Henter data...',
    
    # Navigation
    'nav.board': 'Board',
    'nav.knowledge': 'Vidensbank',
    'nav.time': 'Tidsregistrering',
    'nav.calendar': 'Årshjul',
    'nav.pinboard': 'Prikbord',
    'nav.apps': 'Apps',
    'nav.users': 'Brugere & Teams',
    'nav.settings': 'Indstillinger',
    'nav.logout': 'Log ud',

    # Role Names
    'role.admin': 'Administrator',
    'role.superuser': 'Superbruger',
    'role.member': 'Medlem',

    # UsersPage
    'users.tab.users': 'Brugere',
    'users.tab.teams': 'Teams',
    'users.tab.groups': 'Grupper',
    'users.search.users': 'Søg efter bruger...',
    'users.search.teams': 'Søg efter team...',
    'users.search.groups': 'Søg efter gruppe...',
    'users.button.create_user': 'Opret Bruger',
    'users.button.invite_user': 'Inviter Medlem',
    'users.button.create_team': 'Opret Team',
    'users.button.create_group': 'Opret Gruppe',
    'users.status.active': 'Aktive Brugere',
    'users.status.inactive': 'Deaktiverede Brugere',
    'users.modal.delete_user.title_activate': 'Aktivere bruger',
    'users.modal.delete_user.title_deactivate': 'Deaktiver bruger',
    'users.modal.delete_user.title_delete': 'Slet bruger permanent',
    'users.modal.delete_user.confirm_activate': 'Aktiver',
    'users.modal.delete_user.confirm_deactivate': 'Deaktiver',
    'users.modal.delete_user.confirm_delete': 'Slet permanent',
    'users.modal.delete_team.title': 'Slet team',
    'users.modal.delete_team.message': 'Er du sikker på at du vil slette teamet "{{name}}"?',
    'users.modal.delete_group.title': 'Slet gruppe',
    'users.modal.delete_group.message': 'Er du sikker på at du vil slette gruppen "{{name}}"?',
}

for key, val in translations.items():
    UITranslation.objects.update_or_create(
        key=key,
        defaults={'da': val, 'en': key.replace('.', ' ').capitalize()}
    )

print(f"Seed complete for {len(translations)} keys.")
