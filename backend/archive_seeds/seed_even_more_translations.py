import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

translations = [
    # Users page sidebar
    ('users.admin_panel', 'Admin Panel', 'Admin Panel'),
    ('users.users_menu', 'Users', 'Brugere'),
    ('users.teams_menu', 'Teams', 'Teams'),
    ('users.groups_menu', 'Annual Cycle Groups', 'Årshjul Grupper'),
    ('users.back_to_board', 'Back to Board', 'Tilbage til Tavlen'),

    # Vidensbank trash
    ('vidensbank.trash', 'Trash', 'Papirkurv'),
    ('vidensbank.trash_deleted', 'Trash (Deleted)', 'Papirkurv (Slettede)'),
    ('vidensbank.unknown_category', 'Unknown category', 'Ukendt kategori'),
    ('vidensbank.toast_moved_to_trash', 'Article is now moved to trash', 'Artikel er nu flyttet til papirkurven'),
    ('vidensbank.toast_restored', 'Article restored from trash', 'Artikel er gendannet og flyttet fra papirkurven'),
    ('vidensbank.modal_delete_title', 'Move to trash', 'Flyt til papirkurv'),
    ('vidensbank.modal_delete_confirm', 'Are you sure you want to delete "{{title}}"? It will be moved to the trash and can be restored by an administrator.', 'Er du sikker på at du vil slette "{{title}}"? Den vil blive flyttet til papirkurven og kan gendannes af en administrator.'),
    ('vidensbank.modal_delete_button', 'Delete (move to trash)', 'Slet (flyt til papirkurv)'),
]

# for key, en_text, da_text in translations:
#     obj, created = UITranslation.objects.get_or_create(key=key, defaults={'en': en_text, 'da': da_text})
#     if not created:
#         obj.en = en_text
#         obj.da = da_text
#         obj.save()

# print(f"Seeded {len(translations)} new translations into the database.")
