import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

translations = [
    # settings title & subtitle
    ('settings.title', 'Settings', 'Indstillinger', 'Instellingen', 'Paramètres', 'Einstellungen'),
    ('settings.subtitle', 'Manage your profile and workspace', 'Administrer din profil og dit arbejdsrum', 'Beheer uw profiel en werkruimte', 'Gérez votre profil et votre espace de travail', 'Verwalten Sie Ihr Profil und Ihren Arbeitsbereich'),
    
    # tabs
    ('settings.tab.profile', 'My Profile', 'Min Profil', 'Mijn profiel', 'Mon profil', 'Mein Profil'),
    ('settings.tab.workspace', 'Workspace', 'Arbejdsrum', 'Werkruimte', 'Espace de travail', 'Arbeitsbereich'),
    ('settings.tab.invitations', 'Invitations', 'Invitationer', 'Uitnodigingen', 'Invitations', 'Einladungen'),
    
    # buttons
    ('settings.leave.button', 'Leave Workspace', 'Forlad arbejdsrum', 'Werkruimte verlaten', 'Quitter l\'espace de travail', 'Arbeitsbereich verlassen'),
    
    # profile workspace section
    ('settings.profile.title', 'Personal Profile', 'Personlig Profil', 'Persoonlijk profiel', 'Profil personnel', 'Persönliches Profil'),
    ('settings.profile.workspace_section', 'Workspace Profile', 'Arbejdsrum Profil', 'Werkruimteprofiel', 'Profil de l\'espace', 'Arbeitsbereichs-Profil'),
    ('settings.profile.alias_label', 'Your Alias', 'Dit Alias', 'Uw alias', 'Votre alias', 'Ihr Alias'),
    ('settings.profile.alias_placeholder', 'Enter your preferred name', 'Indtast dit foretrukne navn', 'Voer uw voorkeursnaam in', 'Entrez votre nom préféré', 'Geben Sie Ihren bevorzugten Namen ein'),
    ('settings.profile.alias_help', 'This name is only visible in the current workspace.', 'Dette navn vises kun i det nuværende arbejdsrum.', 'Deze naam is alleen zichtbaar in de huidige werkruimte.', 'Ce nom est uniquement visible dans l\'espace de travail actuel.', 'Dieser Name ist nur im aktuellen Arbeitsbereich sichtbar.'),
    
    # color picker
    ('settings.profile.color_label', 'Your Color', 'Din Farve', 'Uw kleur', 'Votre couleur', 'Ihre Farbe'),
    ('settings.profile.custom_color', 'Choose custom color', 'Vælg egen farve', 'Kies een eigen kleur', 'Choisir sa propre couleur', 'Eigene Farbe wählen'),
    
    # global section & language
    ('settings.profile.global_section', 'Global Settings', 'Globale Indstillinger', 'Globale instellingen', 'Paramètres globaux', 'Globale Einstellungen'),
    ('settings.profile.language_label', 'Language', 'Sprog', 'Taal', 'Langue', 'Sprache'),
    ('settings.profile.change_language', 'Choose from list', 'Vælg fra liste', 'Kies uit lijst', 'Choisir dans la liste', 'Aus Liste wählen'),
    ('settings.profile.language_modal_title', 'Select Language', 'Vælg Sprog', 'Selecteer taal', 'Sélectionner la langue', 'Sprache auswählen'),
    ('settings.profile.search_languages', 'Search languages...', 'Søg efter sprog...', 'Talen zoeken...', 'Rechercher des langues...', 'Sprachen suchen...'),
    ('settings.profile.no_languages_found', 'No languages found', 'Ingen sprog fundet', 'Geen talen gevonden', 'Aucune langue trouvée', 'Keine Sprachen gevonden'),
    
    # save indicators
    ('settings.profile.saved', 'Saved!', 'Gemt!', 'Opgeslagen!', 'Enregistré !', 'Gespeichert!'),
    ('settings.profile.save', 'Save all changes', 'Gem alle ændringer', 'Sla alle wijzigingen op', 'Enregistrer toutes les modifications', 'Alle Änderungen speichern'),
    
    # workspace tab
    ('settings.workspace.updated', 'Updated!', 'Opdateret!', 'Bijgewerkt!', 'Mis à jour !', 'Aktualisiert!'),
    ('settings.workspace.update', 'Update workspace', 'Opdater arbejdsrum', 'Werkruimte bijwerken', 'Mettre à jour l\'espace', 'Arbeitsbereich aktualisieren'),
    
    # invitations tab
    ('settings.invitations.title', 'Invitations', 'Invitationer', 'Uitnodigingen', 'Invitations', 'Einladungen'),
    ('settings.invitations.invite_label', 'Invite new member', 'Inviter nyt medlem', 'Nieuw lid uitnodigen', 'Inviter un nouveau membre', 'Neues Mitglied einladen'),
    ('settings.invitations.role.member', 'Member', 'Medlem', 'Lid', 'Membre', 'Mitglied'),
    ('settings.invitations.role.admin', 'Administrator', 'Administrator', 'Beheerder', 'Administrateur', 'Administrator'),
    ('settings.invitations.send', 'Send', 'Send', 'Verzenden', 'Envoyer', 'Senden'),
    ('settings.invitations.pending_title', 'Pending invitations', 'Afventende invitationer', 'Lopende uitnodigingen', 'Invitations en attente', 'Ausstehende Einladungen'),
    ('settings.invitations.fetching', 'Fetching...', 'Henter...', 'Ophalen...', 'Chargement...', 'Laden...'),
    ('settings.invitations.none', 'No pending invitations', 'Ingen afventende invitationer', 'Geen lopende uitnodigingen', 'Aucune invitation en attente', 'Keine ausstehenden Einladungen'),
    ('settings.invitations.resend_tooltip', 'Send invitation again', 'Send invitation igen', 'Stuur uitnodiging opnieuw', 'Renvoyer l\'invitation', 'Einladung erneut senden'),
    ('settings.invitations.cancel_tooltip', 'Cancel invitation', 'Træk invitation tilbage', 'Uitnodiging intrekken', 'Annuler l\'invitation', 'Einladung stornieren'),
    
    # leave modal
    ('settings.leave.modal.forbidden_title', 'Whoops, wait!', 'Hov, vent!', 'Oeps, wacht!', 'Oups, attendez !', 'Hoppla, warten!'),
    ('settings.leave.modal.title', 'Leave workspace?', 'Forlad arbejdsrum?', 'Werkruimte verlaten?', 'Quitter l\'espace de travail ?', 'Arbeitsbereich verlassen?'),
    ('settings.leave.modal.forbidden_description', 'There is a small obstacle before you can leave this workspace.', 'Der er en lille forhindring, før du kan forlade dette arbejdsrum.', 'Er is een klein obstakel voordat u deze werkruimte kunt verlaten.', 'Il y a un petit obstacle avant de pouvoir quitter cet espace.', 'Es gibt ein kleines Hindernis, bevor Sie diesen Arbeitsbereich verlassen können.'),
    ('settings.leave.modal.description', 'Are you sure you want to leave {{name}}? You will need to be invited again to regain access.', 'Er du sikker på, at du vil forlade {{name}}? Du skal inviteres igen for at få adgang på ny.', 'Weet u zeker dat u {{name}} wilt verlaten? U moet opnieuw worden uitgenodigd.', 'Êtes-vous sûr de vouloir quitter {{name}} ? Vous devrez être invité à nouveau.', 'Sind Sie sicher, dass Sie {{name}} verlassen möchten? Sie müssen erneut eingeladen werden.'),
    ('settings.leave.modal.error_title', 'Important notice', 'Vigtig besked', 'Belangrijke mededeling', 'Avis important', 'Wichtiger Hinweis'),
    ('settings.leave.modal.understand', 'I understand', 'Jeg forstår', 'Ik begrijp het', 'Je comprends', 'Ich verstehe'),
    ('settings.leave.modal.cancel', 'Cancel', 'Annuller', 'Annuleren', 'Annuler', 'Abbrechen'),
    ('settings.leave.modal.confirm', 'Leave now', 'Forlad nu', 'Nu verlaten', 'Quitter maintenant', 'Jetzt verlassen'),
    
    # errors
    ('settings.invitations.error_fetching', 'Could not fetch invitations', 'Kunne ikke hente invitationer', 'Kan uitnodigingen niet ophalen', 'Impossible de récupérer les invitations', 'Einladungen konnten nicht geladen werden'),
    ('settings.invitations.error_sending', 'Could not send invitation.', 'Kunne ikke sende invitation.', 'Kan uitnodiging niet verzenden.', 'Impossible d\'envoyer l\'invitation.', 'Einladung konnte ikke gesendet werden.'),
    ('settings.leave.error_generic', 'Could not leave workspace.', 'Kunne ikke forlade arbejdsrum.', 'Kan werkruimte niet verlaten.', 'Impossible de quitter l\'espace.', 'Arbeitsbereich konnte nicht verlassen werden.'),
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

print(f"Successfully seeded {len(translations)} settings translations (EN, DA, NL, FR, DE) into the database.")
