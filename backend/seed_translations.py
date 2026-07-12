import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

translations = [
    # Navigation
    ('nav.board', 'Board', 'Tavlen'),
    ('nav.users', 'Users & Teams', 'Medlemmer'),
    ('nav.knowledge', 'Knowledge Base', 'Vidensbank'),
    ('nav.time', 'Time Tracking', 'Tidsregistrering'),
    ('nav.calendar', 'Annual Calendar', 'Årshjul'),
    ('nav.pinboard', 'Pinboard', 'Prikbord'),
    ('nav.apps', 'Apps', 'Værktøjer'),
    ('nav.flowchart', 'Flowchart', 'Flowchart'),
    ('nav.settings', 'Settings', 'Indstillinger'),
    ('nav.logout', 'Log Out', 'Log ud'),
    ('navigation.invitations.title', 'Pending approval', 'Mangler godkendelse'),
    
    # Roles
    ('role.admin', 'Administrator', 'Administrator'),
    ('role.superuser', 'Superuser', 'Superbruger'),
    ('role.member', 'Member', 'Medlem'),
    
    # Common actions
    ('action.save', 'Save', 'Gem'),
    ('action.cancel', 'Cancel', 'Annuller'),
    ('action.delete', 'Delete', 'Slet'),
    ('action.edit', 'Edit', 'Rediger'),
    ('action.create', 'Create', 'Opret'),
    ('action.search', 'Search...', 'Søg...'),
    
    # Shared / Global
    ('global.loading', 'Loading...', 'Indlæser...'),
    ('global.error', 'An error occurred', 'Der opstod en fejl'),

    # Board (Opgaver)
    ('board.title', 'Board', 'Tavlen'),
    ('board.subtitle', 'Development and bug fixes', 'Udvikling og fejlrettelser'),
    ('board.all_teams', 'All teams', 'Alle teams'),
    ('board.search_placeholder', 'Search tasks...', 'Søg i opgaver...'),
    ('board.my_tasks', 'My tasks', 'Mine opgaver'),
    ('board.all_assignees', 'All assignees', 'Alle ansvarlige'),
    ('board.new_task', 'New Task', 'Ny Opgave'),
    
    ('board.column.backlog', 'Backlog', 'Indbakke'),
    ('board.column.todo', 'Ready to start', 'Klar til start'),
    ('board.column.in_progress', 'In progress', 'Igang'),
    ('board.column.test', 'Testing', 'Test'),
    ('board.column.done', 'Done', 'Færdig'),
    ('board.column.on_hold', 'On Hold', 'On Hold'),
    
    ('board.hide_on_hold', 'Hide On Hold', 'Skjul On Hold'),
    ('board.show_on_hold', 'Show On Hold', 'Vis On Hold'),
]

for key, en_text, da_text in translations:
    obj, created = UITranslation.objects.get_or_create(key=key, defaults={'en': en_text, 'da': da_text})
    if not created:
        obj.en = en_text
        obj.da = da_text
        obj.save()

print(f"Seeded {len(translations)} translations into the database.")
