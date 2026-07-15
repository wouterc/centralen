import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import UITranslation

# Format: (key, en, da, nl, fr, de)
translations = [
        # Missing translations from comprehensive audit
        ('invitation.button.goto_login', 'Go to Login', 'Gå til Login', 'Ga naar Inloggen', 'Aller à la page de connexion', 'Gehe zum Login'),
        ('invitation.form.already_logged_in_hint', 'Click the button below to be added to {{name}} with your current account.', 'Klik på knappen herunder for at blive tilføjet til {{name}} med din nuværende konto.', 'Klik op de onderstaande knop om met uw huidige account aan {{name}} te worden toegevoegd.', 'Cliquez sur le bouton ci-dessous pour être ajouté à {{name}} avec votre compte actuel.', 'Klicken Sie auf die Schaltfläche unten, um mit Ihrem aktuellen Konto zu {{name}} hinzugefügt zu werden.'),
        ('invitation.form.confirm_password', 'Confirm Password', 'Bekræft Adgangskode', 'Wachtwoord bevestigen', 'Confirmer le mot de passe', 'Passwort bestätigen'),
        ('invitation.form.password', 'Choose Password', 'Vælg Adgangskode', 'Wachtwoord kiezen', 'Choisir le mot de passe', 'Passwort wählen'),
        ('invitation.info.email_hint', 'Log in with your email:', 'Log ind med din email:', 'Log in met uw e-mail:', 'Connectez-vous avec votre e-mail :', 'Mit Ihrer E-Mail anmelden:'),
        ('confirm.button.confirm_exists', 'Confirm & Create Workspace', 'Bekræft & Opret Arbejdsrum', 'Bevestigen & Werkruimte Aanmaken', 'Confirmer et créer l\'espace de travail', 'Bestätigen & Arbeitsbereich erstellen'),
        ('confirm.button.finish', 'Finish Creation', 'Færdiggør Oprettelse', 'Oprichting Voltooien', 'Finaliser la création', 'Erstellung abschließen'),
        ('confirm.error.create_failed', 'Could not create workspace. Try again.', 'Kunne ikke oprette arbejdsrum. Prøv igen.', 'Kon werkruimte niet aanmaken. Probeer het opnieuw.', 'Impossible de créer l\'espace de travail. Réessayez.', 'Arbeitsbereich konnte nicht erstellt werden. Erneut versuchen.'),
        ('confirm.error.invalid', 'Invalid or expired link.', 'Ugyldigt eller udløbet link.', 'Ongeldige of verlopen link.', 'Lien invalide ou expiré.', 'Ungültiger oder abgelaufener Link.'),
        ('confirm.form.password', 'Choose a password', 'Vælg en adgangskode', 'Kies een wachtwoord', 'Choisissez un mot de passe', 'Passwort wählen'),
        ('confirm.header.subtitle', 'We are almost ready to create {{name}}', 'Vi er næsten klar til at oprette {{name}}', 'We zijn bijna klaar om {{name}} aan te maken', 'Nous sommes presque prêts à créer {{name}}', 'Wir sind fast bereit, {{name}} zu erstellen'),
        ('confirm.user_exists.subtitle', 'Click the button below to add this new workspace to your existing profile.', 'Klik på knappen nedenfor for at tilføje dette nye arbejdsrum til din eksisterende profil.', 'Klik op de onderstaande knop om deze nieuwe werkruimte aan uw bestaande profiel toe te voegen.', 'Cliquez sur le bouton ci-dessous pour ajouter ce nouvel espace de travail à votre profil existant.', 'Klicken Sie auf die Schaltfläche unten, um diesen neuen Arbeitsbereich zu Ihrem bestehenden Profil hinzuzufügen.'),
        ('register.error.failed', 'An error occurred during creation. Try again.', 'Der skete en fejl under oprettelsen. Prøv igen.', 'Er is een fout opgetreden tijdens het aanmaken. Probeer het opnieuw.', 'Une erreur est survenue lors de la création. Réessayez.', 'Bei der Erstellung ist ein Fehler aufgetreten. Erneut versuchen.'),
        ('common.error_generic', 'An error occurred. Try again later.', 'Der skete en fejl. Prøv igen senere.', 'Er is een fout opgetreden. Probeer het later opnieuw.', 'Une erreur est survenue. Réessayez plus tard.', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später noch einmal.'),
        ('common.whoops', 'Whoops!', 'Hovsa!', 'Oeps!', 'Oups !', 'Hoppla!'),
        ('common.back_to_login', 'Back to login', 'Tilbage til login', 'Terug naar inloggen', 'Retour à la page de connexion', 'Zurück zum Login'),
        ('confirm.header.title', 'Welcome!', 'Velkommen!', 'Welkom!', 'Bienvenue !', 'Willkommen!'),
        ('confirm.info.workspace', 'Workspace', 'Arbejdsrum', 'Werkruimte', 'Espace de travail', 'Arbeitsbereich'),
        ('confirm.user_exists.title', 'We can see that you already have an account with us.', 'Vi kan se, at du allerede har en konto hos os.', 'We kunnen zien dat u al een account bij ons heeft.', 'Nous constatons que vous possédez déjà un compte chez nous.', 'Wir können sehen, dass Sie bereits ein Konto bei uns haben.'),
        ('confirm.form.first_name', 'First Name', 'Fornavn', 'Voornaam', 'Prénom', 'Vorname'),
        ('confirm.form.last_name', 'Last Name', 'Efternavn', 'Achternaam', 'Nom de famille', 'Nachname'),
        ('confirm.form.password_placeholder', 'At least 6 characters', 'Mindst 6 tegn', 'Minimaal 6 tekens', 'Au moins 6 caractères', 'Mindestens 6 Zeichen'),

        # Vidensbank
        ('kb.add_new', 'Add new knowledge', 'Opret ny vidensbank', 'Nieuwe kennisbank aanmaken', 'Créer une nouvelle base de connaissances', 'Neue Wissensdatenbank erstellen'),
        ('kb.create_new_category', 'Create new category', 'Opret ny kategori', 'Nieuwe categorie aanmaken', 'Créer une nouvelle catégorie', 'Neue Kategorie erstellen'),
        ('vidensbank.modal.save', 'Save article', 'Gem artikel', 'Artikel opslaan', 'Enregistrer l\'article', 'Artikel speichern'),
        ('vidensbank.modal.edit_title', 'Edit knowledge', 'Rediger viden', 'Kennis bewerken', 'Modifier les connaissances', 'Wissen bearbeiten'),
        ('vidensbank.modal.add_title', 'Add new knowledge', 'Tilføj ny viden', 'Nieuwe kennis toevoegen', 'Ajouter de nouvelles connaissances', 'Neues Wissen hinzufügen'),
        ('vidensbank.modal.title_label', 'Title', 'Titel', 'Titel', 'Titre', 'Titel'),
        ('vidensbank.modal.title_placeholder', 'Enter a descriptive title...', 'Indtast en sigende titel...', 'Voer een beschrijvende titel in...', 'Entrez un titre descriptif...', 'Geben Sie einen aussagekräftigen Titel ein...'),
        ('vidensbank.modal.category_label', 'Category', 'Kategori', 'Categorie', 'Catégorie', 'Kategorie'),
        ('vidensbank.modal.select_category', 'Select category...', 'Vælg kategori...', 'Selecteer categorie...', 'Sélectionner la catégorie...', 'Kategorie auswählen...'),
        ('vidensbank.modal.favorite', 'Important / Favorite', 'Vigtig / Favorit', 'Belangrijk / Favoriet', 'Important / Favori', 'Wichtig / Favorit'),
        ('vidensbank.modal.archived', 'Archived', 'Arkiveret', 'Gearchiveerd', 'Archivé', 'Archiviert'),
        ('vidensbank.modal.content_label', 'Content', 'Indhold', 'Inhoud', 'Contenu', 'Inhalt'),
        ('vidensbank.modal.table_tools', 'Table tools:', 'Tabel værktøj:', 'Tabel hulpmiddelen:', 'Outils de tableau :', 'Tabellenwerkzeuge:'),
        ('vidensbank.modal.table.insert_row_below', 'Insert row below', 'Indsæt række under', 'Rij hieronder invoegen', 'Insérer une ligne en dessous', 'Zeile unten einfügen'),
        ('vidensbank.modal.table.add_row', '+ Row', '+ Række', '+ Rij', '+ Ligne', '+ Zeile'),
        ('vidensbank.modal.table.insert_col_right', 'Insert column right', 'Indsæt kolonne til højre', 'Kolom rechts invoegen', 'Insérer une colonne à droite', 'Spalte rechts einfügen'),
        ('vidensbank.modal.table.add_col', '+ Column', '+ Kolonne', '+ Kolom', '+ Colonne', '+ Spalte'),
        ('vidensbank.modal.table.delete_row', 'Delete row', 'Slet række', 'Rij verwijderen', 'Supprimer la ligne', 'Zeile löschen'),
        ('vidensbank.modal.table.remove_row', '- Row', '- Række', '- Rij', '- Ligne', '- Zeile'),
        ('vidensbank.modal.table.delete_col', 'Delete column', 'Slet kolonne', 'Kolom verwijderen', 'Supprimer la colonne', 'Spalte löschen'),
        ('vidensbank.modal.table.remove_col', '- Column', '- Kolonne', '- Kolom', '- Colonne', '- Spalte'),
        ('vidensbank.modal.table.delete_table_title', 'DELETE ENTIRE TABLE', 'SLET HELE TABELLEN', 'VERWIJDER HELE TABEL', 'SUPPRIMER TOUT LE TABLEAU', 'GANZE TABELLE LÖSCHEN'),
        ('vidensbank.modal.table.delete_table', 'Delete table', 'Slet tabel', 'Tabel verwijderen', 'Supprimer le tableau', 'Tabelle löschen'),
        
        # Årshjul
        ('aarshjul.new_activity', 'New Activity', 'Ny Aktivitet', 'Nieuwe activiteit', 'Nouvelle activité', 'Neue Aktivität'),
        
        # Pinboard
        ('pinboard.create_new', 'Create new post', 'Opret nyt opslag', 'Nieuw bericht maken', 'Créer un nouveau message', 'Neuen Beitrag erstellen'),
        ('pinboard.empty_state', 'The board is empty... Pin something up!', 'Tavlen er tom... Hæng noget op!', 'Het bord is leeg... Pin iets op!', 'Le tableau est vide... Épinglez quelque chose !', 'Die Tafel ist leer... Pinnen Sie etwas an!'),
        ('pinboard.modal.new_postit', 'NEW POST-IT', 'NY POST-IT', 'NIEUWE POST-IT', 'NOUVEAU POST-IT', 'NEUER POST-IT'),
        ('pinboard.modal.sub_text', 'Pin your idea on the board', 'Hæng din idé op på tavlen', 'Pin je idee op het bord', 'Épinglez votre idée sur le tableau', 'Pinnen Sie Ihre Idee an die Tafel'),
        ('pinboard.modal.title_label', 'Title', 'Titel', 'Titel', 'Titre', 'Titel'),
        ('pinboard.modal.title_placeholder', 'A quick headline...', 'En hurtig overskrift...', 'Een snelle kop...', 'Un titre rapide...', 'Eine kurze Überschrift...'),
        ('pinboard.modal.desc_label', 'Description', 'Beskrivelse', 'Beschrijving', 'Description', 'Beschreibung'),
        ('pinboard.modal.desc_placeholder', 'Tell us a bit more...', 'Fortæl lidt mere...', 'Vertel ons wat meer...', 'Dites-nous en un peu plus...', 'Erzählen Sie uns etwas mehr...'),
        ('pinboard.modal.select_team_label', 'Select Team', 'Vælg Team', 'Selecteer Team', 'Sélectionner l\'équipe', 'Team auswählen'),
        ('pinboard.modal.select_team_placeholder', 'Select team...', 'Vælg team...', 'Selecteer team...', 'Sélectionner l\'équipe...', 'Team auswählen...'),
        ('pinboard.modal.pinning', 'Pinning...', 'Hænger op...', 'Pinnen...', 'Épinglage...', 'Pinnen...'),
        ('pinboard.modal.pin', 'PIN IT! 📌', 'HÆNG OP! 📌', 'PIN HET! 📌', 'ÉPINGLEZ ! 📌', 'PINNEN! 📌'),
        ('pinboard.detail.post_label', 'Pinboard Post', 'Prikbord Opslag', 'Prikbord Bericht', 'Message du tableau d\'affichage', 'Pinnwandeintrag'),
        ('pinboard.detail.archive_tooltip', 'Archive post', 'Arkivér opslag', 'Bericht archiveren', 'Archiver le message', 'Eintrag archivieren'),
        ('pinboard.detail.archive_btn', 'Archive', 'Arkivér', 'Archiveren', 'Archiver', 'Archivieren'),
        ('pinboard.detail.fetching_desc', 'Fetching description...', 'Henter beskrivelse...', 'Beschrijving ophalen...', 'Récupération de la description...', 'Beschreibung abrufen...'),
        ('pinboard.detail.status_and_stats', 'Status & Statistics', 'Status & Statistik', 'Status & Statistieken', 'Statut & Statistiques', 'Status & Statistiken'),
        ('pinboard.detail.good_idea', 'Good idea', 'God idé', 'Goed idee', 'Bonne idée', 'Gute Idee'),
        ('pinboard.detail.read', 'Read', 'Læst', 'Gelezen', 'Lu', 'Gelesen'),
        ('pinboard.detail.pending', 'Pending', 'Venter', 'In afwachting', 'En attente', 'Ausstehend'),
        ('pinboard.detail.fetching_names', 'Fetching names...', 'Henter navne...', 'Namen ophalen...', 'Récupération des noms...', 'Namen abrufen...'),
        ('pinboard.detail.your_evaluation', 'Your Evaluation', 'Din Vurdering', 'Jouw Beoordeling', 'Votre Évaluation', 'Ihre Bewertung'),
        ('pinboard.detail.eval.good_idea', 'GOOD IDEA', 'GOD IDÉ', 'GOED IDEE', 'BONNE IDÉE', 'GUTE IDEE'),
        ('pinboard.detail.eval.dont_know', "DON'T KNOW", 'VED IKKE', 'WEET IK NIET', 'JE NE SAIS PAS', 'WEISS NICHT'),
        ('pinboard.detail.eval.read', 'READ', 'LÆST', 'GELEZEN', 'LU', 'GELESEN'),
        
        # Users
        ('common.cancel', 'Cancel', 'Annuller', 'Annuleren', 'Annuler', 'Abbrechen'),
        ('common.confirm', 'Confirm', 'Bekræft', 'Bevestigen', 'Confirmer', 'Bestätigen'),
        ('users.invite_modal.send', 'Send Invitation', 'Send Invitation', 'Uitnodiging sturen', 'Envoyer l\'invitation', 'Einladung senden'),
        ('users.role.member', 'Member', 'Medlem', 'Lid', 'Membre', 'Mitglied'),
        ('users.role.superuser', 'Superuser', 'Superbruger', 'Supergebruiker', 'Superutilisateur', 'Superuser'),
        ('users.role.admin', 'Administrator', 'Administrator', 'Beheerder', 'Administrateur', 'Administrator')
]

# def seed():
#     for key, en_text, da_text, nl_text, fr_text, de_text in translations:
#         obj, created = UITranslation.objects.get_or_create(key=key, defaults={
#             'en': en_text,
#             'da': da_text,
#             'nl': nl_text,
#             'fr': fr_text,
#             'de': de_text
#         })
#         if not created:
#             obj.en = en_text
#             obj.da = da_text
#             obj.nl = nl_text
#             obj.fr = fr_text
#             obj.de = de_text
#             obj.save()
            
#     print("Manglende oversættelser (inkl. FR og DE) er indsat i databasen!")

# if __name__ == '__main__':
#     seed()
