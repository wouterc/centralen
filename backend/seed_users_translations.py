import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

translations = [
    ('users.filter.show_all', 'Show All', 'Viser Alle', 'Toon alles', 'Afficher tout', 'Alle anzeigen'),
    ('users.filter.only_active', 'Only Active', 'Kun Aktive', 'Alleen actief', 'Uniquement actifs', 'Nur aktive'),
    ('users.button.new_user', 'New User', 'Ny Bruger', 'Nieuwe gebruiker', 'Nouvel utilisateur', 'Neuer Benutzer'),
    ('users.button.invite_member', 'Invite Member', 'Inviter Medlem', 'Lid uitnodigen', 'Inviter un membre', 'Mitglied einladen'),
    ('users.button.new_team', 'New Team', 'Nyt Team', 'Nieuw team', 'Nouvelle équipe', 'Neues Team'),
    ('users.table.user', 'User', 'Bruger', 'Gebruiker', 'Utilisateur', 'Benutzer'),
    ('users.table.level', 'Level', 'Niveau', 'Niveau', 'Niveau', 'Ebene'),
    ('users.table.teams', 'Teams', 'Teams', 'Teams', 'Équipes', 'Teams'),
    ('users.table.status', 'Status', 'Status', 'Status', 'Statut', 'Status'),
    ('users.table.actions', 'Actions', 'Handlinger', 'Acties', 'Actions', 'Aktionen'),
    ('users.status.active', 'ACTIVE', 'AKTIV', 'ACTIEF', 'ACTIF', 'AKTIV'),
    ('users.status.deactivated', 'DEACTIVATED', 'DEAKTIVERET', 'GEDEACTIVEERD', 'DÉSACTIVÉ', 'DEAKTIVIERT'),
    ('users.teams_modal.title', 'Assign Teams', 'Tildel Teams', 'Teams toewijzen', 'Attribuer des équipes', 'Teams zuweisen'),
    ('users.teams_modal.subtitle', 'For {{username}}', 'For {{username}}', 'Voor {{username}}', 'Pour {{username}}', 'Für {{username}}'),
    ('users.teams_modal.search_placeholder', 'Search for team...', 'Søg efter team...', 'Zoek naar team...', 'Rechercher une équipe...', 'Nach Team suchen...'),
    ('users.teams_modal.no_teams_found', 'No teams found', 'Ingen teams fundet', 'Geen teams gevonden', 'Aucune équipe trouvée', 'Keine Teams gefunden'),
    ('users.teams_modal.done', 'Done', 'Færdig', 'Klaar', 'Terminé', 'Fertig'),
    ('users.role.member', 'Member', 'Medlem', 'Lid', 'Membre', 'Mitglied'),
    ('users.role.superuser', 'Superuser', 'Superbruger', 'Supergebruiker', 'Superutilisateur', 'Superuser'),
    ('users.role.admin', 'Administrator', 'Administrator', 'Beheerder', 'Administrateur', 'Administrator'),
    ('users.create_modal.title', 'Create New User', 'Opret Ny Bruger', 'Nieuwe gebruiker aanmaken', 'Créer un nouvel utilisateur', 'Neuen Benutzer erstellen'),
    ('users.create_modal.username_label', 'Username*', 'Brugernavn*', 'Gebruikersnaam*', 'Nom d\'utilisateur*', 'Benutzername*'),
    ('users.create_modal.username_placeholder', 'Username', 'Brugernavn', 'Gebruikersnaam', 'Nom d\'utilisateur', 'Benutzername'),
    ('users.create_modal.password_label', 'Password*', 'Password*', 'Wachtwoord*', 'Mot de passe*', 'Passwort*'),
    ('users.create_modal.email_label', 'Email', 'Email', 'E-mail', 'E-mail', 'E-Mail'),
    ('users.create_modal.first_name_label', 'First Name', 'Fornavn', 'Voornaam', 'Prénom', 'Vorname'),
    ('users.create_modal.last_name_label', 'Last Name', 'Efternavn', 'Achternaam', 'Nom de famille', 'Nachname'),
    ('users.create_modal.color_label', 'Color', 'Farve', 'Kleur', 'Couleur', 'Farbe'),
    ('users.create_modal.level_label', 'Level', 'Niveau', 'Niveau', 'Niveau', 'Ebene'),
    ('users.button.cancel', 'Cancel', 'Annuller', 'Annuleren', 'Annuler', 'Abbrechen'),
    ('users.create_modal.submit', 'Create User', 'Opret Bruger', 'Gebruiker aanmaken', 'Créer l\'utilisateur', 'Benutzer erstellen'),
    ('users.create_modal.username', 'Username', 'Brugernavn', 'Gebruikersnaam', 'Nom d\'utilisateur', 'Benutzername'),
    ('users.create_modal.password', 'New Password', 'Nyt Password', 'Nieuw wachtwoord', 'Nouveau mot de passe', 'Neues Passwort'),
    ('users.create_modal.first_name', 'First Name', 'Fornavn', 'Voornaam', 'Prénom', 'Vorname'),
    ('users.create_modal.last_name', 'Last Name', 'Efternavn', 'Achternaam', 'Nom', 'Nachname'),
    ('users.create_modal.email', 'Email', 'Email', 'E-mail', 'E-mail', 'E-Mail'),
    ('users.edit.change_password_placeholder', 'Change?', 'Skift?', 'Wijzigen?', 'Modifier ?', 'Ändern?'),
    ('users.table.no_email', 'No email', 'Ingen email', 'Geen e-mail', 'Pas d\'e-mail', 'Keine E-Mail'),
]

for key, en_text, da_text, nl_text, fr_text, de_text in translations:
    obj, created = UITranslation.objects.get_or_create(
        key=key,
        defaults={
            'en': en_text,
            'da': da_text,
            'nl': nl_text,
            'fr': fr_text,
            'de': de_text
        }
    )
    if not created:
        obj.en = en_text
        obj.da = da_text
        obj.nl = nl_text
        obj.fr = fr_text
        obj.de = de_text
        obj.save()

print(f"Successfully seeded {len(translations)} users and teams translations into the database.")
