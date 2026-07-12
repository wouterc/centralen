import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

translations = [
    ('register.title', 'Create Account', 'Opret Bruger', 'Account aanmaken', 'Créer un compte', 'Benutzerkonto erstellen'),
    ('register.subtitle', 'Create a profile on Centralen to get started', 'Opret en profil på Centralen for at komme i gang', 'Maak een profiel aan op Centralen om te beginnen', 'Créez un profil sur Centralen pour commencer', 'Erstellen Sie ein Profil auf Centralen, um loszulegen'),
    ('register.username_label', 'Username*', 'Brugernavn*', 'Gebruikersnaam*', "Nom d'utilisateur*", 'Benutzername*'),
    ('register.username_placeholder', 'Choose a username', 'Vælg et brugernavn', 'Kies een gebruikersnaam', "Choisissez un nom d'utilisateur", 'Wählen Sie einen Benutzernamen'),
    ('register.email_label', 'Your Email*', 'Din E-mail*', 'Uw e-mailadres*', 'Votre e-mail*', 'Ihre E-Mail*'),
    ('register.first_name_label', 'First Name', 'Fornavn', 'Voornaam', 'Prénom', 'Vorname'),
    ('register.first_name_placeholder', 'First Name', 'Fornavn', 'Voornaam', 'Prénom', 'Vorname'),
    ('register.last_name_label', 'Last Name', 'Efternavn', 'Achternaam', 'Nom de famille', 'Nachname'),
    ('register.last_name_placeholder', 'Last Name', 'Efternavn', 'Achternaam', 'Nom de famille', 'Nachname'),
    ('register.password_label', 'Choose a password*', 'Vælg en adgangskode*', 'Kies een wachtwoord*', 'Choisissez un mot de passe*', 'Wählen Sie ein Passwort*'),
    ('register.button.submit', 'Create my profile', 'Opret min profil', 'Maak mijn profiel aan', 'Créer mon profil', 'Mein Profil erstellen'),
    ('register.success_title', 'Check your email!', 'Tjek din e-mail!', 'Controleer uw e-mail!', 'Vérifiez vos e-mails !', 'Prüfen Sie Ihre E-Mails!'),
    ('register.success_message', 'We have sent an activation link to {{email}}. Click the link in the email to activate your profile.', 'Vi har sendt et aktiveringslink til {{email}}. Klik på linket i e-mailen for at aktivere din profil.', 'We hebben een activeringslink gestuurd naar {{email}}. Klik op de link in de e-mail om uw profiel te activeren.', "Nous avons envoyé un lien d'activation à {{email}}. Cliquez sur le lien dans l'e-mail pour activer votre profil.", 'Wir haben einen Aktivierungslink an {{email}} gesendet. Klicken Sie auf den Link in der E-Mail, um Ihr Profil zu aktivieren.'),
    ('register.back_to_login', 'Back to login', 'Tilbage til login', 'Terug naar inloggen', 'Retour à la connexion', 'Zurück zum Login'),
    ('login.footer.no_account', 'New to Centralen? ', 'Ny på Centralen? ', 'Nieuw op Centralen? ', 'Nouveau sur Centralen ? ', 'Neu bei Centralen? '),
    ('login.footer.register_here', 'Register your profile here', 'Opret din profil her', 'Registreer uw profiel hier', 'Enregistrez votre profil ici', 'Registrieren Sie Ihr Profil hier'),
    ('activate.loading', 'Activating your account...', 'Aktiverer din konto...', 'Uw account activeren...', 'Activation de votre compte...', 'Konto wird aktiviert...'),
    ('activate.error_title', 'Activation failed', 'Aktivering mislykkedes', 'Activering mislukt', "Échec de l'activation", 'Aktivierung fehlgeschlagen'),
    ('activate.back_to_login', 'Go to login', 'Gå til login', 'Ga naar inloggen', 'Aller à la connexion', 'Gehe zum Login'),
    ('navigation.workspace.create_new', 'Create new workspace', 'Opret nyt arbejdsrum', 'Nieuwe werkruimte aanmaken', 'Créer un nouvel espace de travail', 'Neuen Arbeitsbereich erstellen'),
    ('workspace.create.title', 'Create new workspace', 'Opret nyt arbejdsrum', 'Nieuwe werkruimte aanmaken', 'Créer un nouvel espace de travail', 'Neuen Arbeitsbereich erstellen'),
    ('workspace.create.subtitle', 'Enter the name of your new company or group.', 'Indtast navnet på din nye virksomhed eller gruppe.', 'Voer de naam in van uw nieuwe bedrijf of groep.', 'Entrez le nom de votre nouvelle entreprise ou groupe.', 'Geben Sie den Namen Ihres neuen Unternehmens oder Ihrer Gruppe ein.'),
    ('workspace.create.placeholder', 'e.g. My Company', 'F.eks. Min Virksomhed', 'bijv. Mijn Bedrijf', 'par ex. Mon Entreprise', 'z.B. Mein Unternehmen'),
    ('workspace.create.submit', 'Create workspace', 'Opret arbejdsrum', 'Werkruimte aanmaken', "Créer l'espace de travail", 'Arbeitsbereich erstellen'),
    ('workspace.create.error', 'Could not create the workspace. Please try again.', 'Kunne ikke oprette arbejdsrummet. Prøv igen.', 'Kon de werkruimte niet aanmaken. Probeer het opnieuw.', "Impossible de créer l'espace de travail. Veuillez réessayer.", 'Der Arbeitsbereich konnte nicht erstellt werden. Bitte versuchen Sie es erneut.'),
    ('login.error.default', 'Email or password is incorrect', 'Email eller adgangskode er forkert', 'E-mail of wachtwoord is onjuist', "L'e-mail ou le mot de passe est incorrect", 'E-Mail oder Passwort ist falsch'),
    ('login.error.select_workspace', 'Could not select workspace', 'Kunne ikke vælge arbejdsrum', 'Kon werkruimte niet selecteren', "Impossible de sélectionner l'espace de travail", 'Arbeitsbereich konnte nicht ausgewählt werden'),
    ('login.header.login', 'Log in to your personal control center', 'Log ind på dit personlige kontrolcenter', 'Log in op uw persoonlijke controlecentrum', 'Connectez-vous à votre centre de contrôle personnel', 'Melden Sie sich bei Ihrem persönlichen Kontrollzentrum an'),
    ('login.header.select_workspace', 'Select a workspace', 'Vælg et arbejdsrum', 'Selecteer een werkruimte', 'Sélectionnez un espace de travail', 'Wählen Sie einen Arbeitsbereich'),
    ('login.email_label', 'E-mail', 'E-mail', 'E-mail', 'E-mail', 'E-Mail'),
    ('login.email_placeholder', 'Enter your email', 'Indtast din email', 'Voer uw e-mail in', 'Entrez votre e-mail', 'Geben Sie Ihre E-Mail ein'),
    ('login.password_label', 'Password', 'Adgangskode', 'Wachtwoord', 'Mot de passe', 'Passwort'),
    ('login.password_placeholder', '••••••••', '••••••••', '••••••••', '••••••••', '••••••••'),
    ('login.button.login', 'Log in', 'Log ind', 'Inloggen', 'Se connecter', 'Anmelden'),
    ('login.footer.new_workspace', 'Need a new workspace? ', 'Skal du bruge et nyt arbejdsrum? ', 'Heeft u een nieuwe werkruimte nodig? ', "Besoin d'un nouvel espace de travail ? ", 'Benötigen Sie einen neuen Arbeitsbereich? '),
    ('login.footer.create_here', 'Create it here', 'Opret det her', 'Maak het hier aan', 'Créez-le ici', 'Hier erstellen'),
    ('login.workspace.none', 'You are not a member of any workspace yet.', 'Du er ikke medlem af nogen arbejdsrum endnu.', 'U bent nog geen lid van een werkruimte.', "Vous n'êtes membre d'aucun espace de travail pour le moment.", 'Sie sind noch kein Mitglied eines Arbeitsbereichs.'),
    ('login.workspace.create_new', 'Create new workspace', 'Opret nyt arbejdsrum', 'Nieuwe werkruimte aanmaken', 'Créer un nouvel espace de travail', 'Neuen Arbeitsbereich erstellen'),
    ('login.button.logout', 'Log out', 'Log ud', 'Uitloggen', 'Se déconnecter', 'Abmelden'),
    ('login.footer.problems', 'Having trouble logging in?', 'Har du problemer med at logge ind?', 'Heeft u problemen met inloggen?', 'Des problèmes pour vous connecter ?', 'Probleme beim Anmelden?'),
    ('login.footer.contact_admin', 'Contact your administrator', 'Kontakt din administrator', 'Neem contact op met uw beheerder', 'Contactez votre administrateur', 'Kontaktieren Sie Ihren Administrator'),
    ('register.error.missing_fields', 'Username, email and password are required.', 'Brugernavn, e-mail og adgangskode skal angives.', 'Gebruikersnaam, e-mail en wachtwoord zijn verplicht.', "Le nom d'utilisateur, l'e-mail et le mot de passe sont requis.", 'Benutzername, E-Mail und Passwort sind erforderlich.'),
    ('register.error.username_taken', 'This username is already taken. Please choose another.', 'Brugernavnet er allerede i brug. Vælg et andet.', 'Deze gebruikersnaam is al in gebruik. Kies een andere.', "Ce nom d'utilisateur est déjà pris. Veuillez en choisir un autre.", 'Dieser Benutzername ist bereits vergeben. Bitte wählen Sie einen anderen.'),
    ('register.error.email_taken', 'This email address already has an active account. Try logging in instead.', 'Denne e-mailadresse har allerede en aktiv konto. Prøv at logge ind i stedet.', 'Dit e-mailadres heeft al een actief account. Probeer in te loggen.', 'Cette adresse e-mail possède déjà un compte actif. Essayez de vous connecter.', 'Diese E-Mail-Adresse hat bereits ein aktives Konto. Versuchen Sie, sich anzumelden.'),
    ('register.error.email_pending_activation', "This email address is already registered, but the account hasn't been activated yet.", 'Denne e-mailadresse er allerede registreret, men kontoen er endnu ikke aktiveret.', 'Dit e-mailadres is al geregistreerd, maar het account is nog niet geactiveerd.', "Cette adresse e-mail est déjà enregistrée, mais le compte n'a pas encore été activé.", 'Diese E-Mail-Adresse ist bereits registriert, aber das Konto wurde noch nicht aktiviert.'),
    ('register.resend.sent', 'A new activation link has been sent to your email.', 'Der er sendt et nyt aktiveringslink til din e-mail.', 'Er is een nieuwe activeringslink naar uw e-mail gestuurd.', "Un nouveau lien d'activation a été envoyé à votre e-mail.", 'Ein neuer Aktivierungslink wurde an Ihre E-Mail gesendet.'),
    ('register.resend.sending', 'Sending...', 'Sender...', 'Verzenden...', 'Envoi...', 'Wird gesendet...'),
    ('register.resend.button', 'Resend activation link', 'Send aktiveringslink igen', 'Activeringslink opnieuw versturen', "Renvoyer le lien d'activation", 'Aktivierungslink erneut senden'),
    ("login.error.not_activated", "The account is not activated yet. Should we resend the email?", "Kontoen er ikke godkendt endnu. Skal mailen sendes igen?", "Het account is nog niet geactiveerd. Moet de e-mail opnieuw worden verzonden?", "Le compte n'est pas encore activé. Faut-il renvoyer l'e-mail ?", "Das Konto ist noch nicht aktiviert. Soll die E-Mail erneut gesendet werden?"),
    ("login.error.resend_success", "The activation link has been resent!", "Aktiveringslinket er sendt igen!", "De activeringslink is opnieuw verzonden!", "Le lien d'activation a été renvoyé !", "Der Aktivierungslink wurde erneut gesendet!"),
    ("login.error.resend_failed", "Could not resend the activation link. Please try again.", "Kunne ikke sende aktiveringslinket. Prøv igen.", "Kan activeringslink niet opnieuw verzenden. Probeer het opnieuw.", "Impossible de renvoyer le lien d'activation. Veuillez réessayer.", "Aktivierungslink konnte nicht erneut gesendet werden. Bitte versuchen Sie es erneut."),
    ("login.error.resending", "Sending...", "Sender...", "Verzenden...", "Envoi...", "Wird gesendet..."),
    ("activate.error.expired", "The activation link has expired (max 24 hours).", "Aktiveringslinket er udløbet (maks. 24 timer).", "De activeringslink is verlopen (max. 24 uur).", "Le lien d'activation a expiré (max. 24 heures).", "Der Aktivierungslink ist abgelaufen (max. 24 Stunden)."),
    ("activate.error.invalid", "Invalid activation link.", "Ugyldigt aktiveringslink.", "Ongeldige activeringslink.", "Lien d'activation invalide.", "Ungültiger Aktivierungslink."),
    ("activate.error.user_not_found", "User not found.", "Brugeren blev ikke fundet.", "Gebruiker niet gevonden.", "Utilisateur non trouvé.", "Benutzer nicht gefunden."),
    ("activate.error.failed", "Activation failed. The link may be invalid or expired.", "Aktiveringen fejlede. Linket kan være ugyldigt eller udløbet.", "Activering mislukt. De link is mogelijk ongeldig of verlopen.", "Échec de l'activation. Le lien est peut-être invalide ou expiré.", "Aktivierung fehlgeschlagen. Der Link ist möglicherweise ungültig oder abgelaufen."),
    ("workspace.help.title", "Understand the structure", "Forstå opbygningen", "Begrijp de structuur", "Comprendre la structure", "Struktur verstehen"),
    ("workspace.help.workspace_label", "Workspace:", "Arbejdsrum:", "Werkruimte:", "Espace de travail :", "Arbeitsbereich:"),
    ("workspace.help.workspace_desc", "The top-level for the organization. All data is isolated per workspace.", "Det overordnede niveau for virksomheden. Data er 100% adskilt mellem arbejdsrum.", "Het hoogste niveau voor de organisatie. Gegevens zijn per werkruimte geïsoleerd.", "Le niveau supérieur pour l'organisation. Les données sont isolées par espace.", "Die oberste Ebene für das Unternehmen. Daten sind pro Arbeitsbereich isoliert."),
    ("workspace.help.teams_label", "Teams:", "Teams:", "Teams:", "Équipes :", "Teams:"),
    ("workspace.help.teams_desc", "Internal departments or workgroups within the workspace (e.g., Sales, Dev).", "Interne afdelinger eller arbejdsgrupper i arbejdsrummet (f.eks. Udvikling, Salg).", "Interne afdelingen of werkgroepen binnen de werkruimte (bijv. Verkoop, Ontwikkeling).", "Départements ou groupes de travail internes à l'espace (ex. Ventes, Dév).", "Interne Abteilungen oder Arbeitsgruppen im Arbeitsbereich (z.B. Vertrieb, Entwicklung)."),
    ("workspace.help.members_label", "Members:", "Medlemmer:", "Leden:", "Membres :", "Mitglieder:"),
    ("workspace.help.members_desc", "Employees who have access to the workspace and can be assigned to roles/teams. A member can belong to different teams or organizations.", "Medarbejdere, som har adgang til arbejdsrummet og kan tildeles roller og teams. Et medlem kan høre til forskellige teams eller organisationer.", "Medewerkers die toegang hebben tot de werkruimte en aan rollen/teams kunnen worden toegewezen. Een lid kan bij verschillende teams of organisaties horen.", "Collaborateurs ayant accès à l'espace de travail et pouvant être affectés à des rôles/équipes. Un membre peut appartenir à plusieurs équipes ou organisations.", "Mitarbeiter, die Zugriff auf den Arbeitsbereich haben und Rollen/Teams zugewiesen werden können. Ein Mitglied kann verschiedenen Teams oder Organisationen angehören."),
    ("login.invitations.title", "You have pending invitations!", "Du har invitationer der venter!", "U heeft openstaande uitnodigingen!", "Vous avez des invitations en attente !", "Sie haben ausstehende Einladungen!"),
    ("login.invitations.desc", "You have been invited to join the following workspaces:", "Du er blevet inviteret til følgende arbejdsrum:", "U bent uitgenodigd voor de volgende werkruimtes:", "Vous avez été invité à rejoindre les espaces de travail suivants :", "Sie wurden in die folgenden Arbeitsbereiche eingeladen:"),
    ("login.invitations.accept", "Accept", "Accepter", "Accepteren", "Accepter", "Akzeptieren"),
    ("login.error.accept_invitation", "Could not accept invitation", "Kunne ikke acceptere invitation", "Kan uitnodiging niet accepteren", "Impossible d'accepter l'invitation", "Einladung konnte nicht akzeptiert werden"),
    ('request_workspace.title', 'New Workspace', 'Nyt Arbejdsrum', 'Nieuwe werkruimte', 'Nouvel espace de travail', 'Neuer Arbeitsbereich'),
    ('request_workspace.subtitle', 'Start your journey with Centralen today', 'Start din rejse med Centralen i dag', 'Begin vandaag uw reis met Centralen', 'Commencez votre voyage avec Centralen dès aujourd\'hui', 'Beginnen Sie Ihre Reise mit Centralen noch heute'),
    ('request_workspace.email_label', 'Your Email', 'Din E-mail', 'Uw e-mailadres', 'Votre e-mail', 'Ihre E-Mail'),
    ('request_workspace.company_name_label', 'Workspace Name', 'Arbejdsrummets Navn', 'Naam werkruimte', 'Nom de l\'espace de travail', 'Name des Arbeitsbereichs'),
    ('request_workspace.continue', 'Continue to verification', 'Fortsæt til bekræftelse', 'Doorgaan naar verificatie', 'Continuer vers la vérification', 'Weiter zur Verifizierung'),
    ('request_workspace.back_to_login', 'Back to login', 'Tilbage til login', 'Terug naar inloggen', 'Retour à la connexion', 'Zurück zum Login'),
    ('request_workspace.success_title', 'Request sent!', 'Forespørgsel sendt!', 'Aanvraag verzonden!', 'Demande envoyée !', 'Anfrage gesendet!'),
    ('request_workspace.success_message', 'We have sent a verification link to {{email}}. Click the link in the email to complete creating your workspace.', 'Vi har sendt et bekræftelseslink til {{email}}. Klik på linket i e-mailen for at færdiggøre oprettelsen af dit arbejdsrum.', 'We hebben een verificatielink gestuurd naar {{email}}. Klik op de link in de e-mail om het maken van uw werkruimte te voltooien.', 'Nous avons envoyé un lien de vérification à {{email}}. Cliquez sur le lien dans l\'e-mail pour terminer la création de votre espace de travail.', 'Wir haben einen Verifizierungslink an {{email}} gesendet. Klicken Sie auf den Link in der E-Mail, um die Erstellung Ihres Arbeitsbereichs abzuschließen.'),
    ('common.show', 'Show', 'Vis', 'Tonen', 'Afficher', 'Anzeigen'),
    ('common.hide', 'Hide', 'Skjul', 'Verbergen', 'Masquer', 'Ausblenden'),
    ('login.button.forgot_password', 'Forgot password?', 'Glemt adgangskode?', 'Wachtwoord vergeten?', 'Mot de passe oublié ?', 'Passwort vergessen?'),
    ('password_reset.request.title', 'Reset Password', 'Nulstil adgangskode', 'Wachtwoord herstellen', 'Réinitialiser le mot de passe', 'Passwort zurücksetzen'),
    ('password_reset.request.desc', 'Enter your email address and we will send you a link to reset your password.', 'Indtast din e-mailadresse, og vi vil sende dig et link til at nulstille din adgangskode.', 'Voer uw e-mailadres in en we sturen u een link om uw wachtwoord te herstellen.', 'Saisissez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.', 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.'),
    ('password_reset.request.button', 'Send Reset Link', 'Send nulstillingslink', 'Herstellink verzenden', 'Envoyer le lien de réinitialisation', 'Link zum Zurücksetzen senden'),
    ('password_reset.request.success_title', 'Email Sent!', 'E-mail sendt!', 'E-mail verzonden!', 'E-mail envoyé !', 'E-Mail gesendet!'),
    ('password_reset.request.success_desc', 'If this email is registered in our system, you will receive instructions shortly.', 'Hvis denne e-mail er registreret i vores system, vil du modtage instruktioner inden længe.', 'Als dit e-mailadres is geregistreerd in ons systeem, ontvangt u binnenkort instructies.', 'Si cet e-mail est enregistré dans notre système, vous recevrez bientôt des instructions.', 'Wenn diese E-Mail in unserem System registriert ist, erhalten Sie in Kürze Anweisungen.'),
    ('password_reset.reset.title', 'Choose New Password', 'Vælg ny adgangskode', 'Nieuw wachtwoord kiezen', 'Choisir un nouveau mot de passe', 'Neues Passwort wählen'),
    ('password_reset.reset.desc', 'Please enter and confirm your new password below.', 'Indtast og bekræft din nye adgangskode nedenfor.', 'Voer hieronder uw nieuwe wachtwoord in en bevestig dit.', 'Veuillez saisir et confirmer votre nouveau mot de passe ci-dessous.', 'Bitte geben Sie unten Ihr neues Passwort ein und bestätigen Sie es.'),
    ('password_reset.reset.password_label', 'New Password', 'Ny adgangskode', 'Nieuw wachtwoord', 'Nouveau mot de passe', 'Neues Passwort'),
    ('password_reset.reset.confirm_label', 'Confirm New Password', 'Bekræft ny adgangskode', 'Nieuw wachtwoord bevestigen', 'Confirmer le nouveau mot de passe', 'Neues Passwort bestätigen'),
    ('password_reset.reset.button', 'Update Password', 'Opdater adgangskode', 'Wachtwoord bijwerken', 'Mettre à jour le mot de passe', 'Passwort aktualisieren'),
    ('password_reset.reset.success_title', 'Password Updated!', 'Adgangskode opdateret!', 'Wachtwoord bijgewerkt!', 'Mot de passe mis à jour !', 'Passwort aktualisiert!'),
    ('password_reset.reset.success_desc', 'Your password has been successfully updated. You can now log in.', 'Din adgangskode er blevet opdateret. Du kan nu logge ind.', 'Uw wachtwoord is succesvol bijgewerkt. U kunt nu inloggen.', 'Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.', 'Ihr Passwort wurde erfolgreich aktualisiert. Sie können sich jetzt anmelden.'),
    ('password_reset.error.invalid_token', 'The password reset link is invalid or has expired.', 'Nulstillingslinket er ugyldigt eller udløbet.', 'De herstellink is ongeldig of verlopen.', 'Le lien de réinitialisation est invalide ou a expiré.', 'Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.'),
    ('email.activation.subject', 'Activate your account on Centralen', 'Aktiver din konto på Centralen', 'Activeer uw account op Centralen', 'Activez votre compte sur Centralen', 'Aktivieren Sie Ihr Konto auf Centralen'),
    ('email.activation.body', 'Hello {{name}},\n\nHere is your activation link for Centralen:\n{{link}}\n\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nCentralen', 'Hej {{name}},\n\nHer er dit aktiveringslink til Centralen:\n{{link}}\n\nHvis du ikke har oprettet denne konto, kan du roligt ignorere denne e-mail.\n\nMed venlig hilsen,\nCentralen', 'Hallo {{name}},\n\nHier is uw activeringslink voor Centralen:\n{{link}}\n\nAls u dit niet heeft aangevraagd, kunt u deze e-mail veilig negeren.\n\nMet vriendelijke groet,\nCentralen', 'Bonjour {{name}},\n\nVoici votre lien d\'activation pour Centralen :\n{{link}}\n\nSi vous n\'avez pas demandé cela, vous pouvez ignorer cet e-mail en toute sécurité.\n\nCordialement,\nCentralen', 'Hallo {{name}},\n\nhier ist Ihr Aktivierungslink für Centralen:\n{{link}}\n\nWenn Sie dies nicht angefordert haben, können Sie diese E-Mail einfach ignorieren.\n\nMit freundlichen Grüßen,\nCentralen'),
    ('email.password_reset.subject', 'Reset your password on Centralen', 'Nulstil din adgangskode på Centralen', 'Stel uw wachtwoord opnieuw in op Centralen', 'Réinitialisez votre mot de passe sur Centralen', 'Setzen Sie Ihr Passwort auf Centralen zurück'),
    ('email.password_reset.body', 'Hello {{name}},\n\nYou requested to reset your password on Centralen.\nYou can reset your password by clicking the following link:\n{{link}}\n\nThis link is active for 24 hours.\n\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nCentralen', 'Hej {{name}},\n\nDu har anmodet om at nulstille din adgangskode på Centralen.\nDu kan nulstille din adgangskode ved at klikke på følgende link:\n{{link}}\n\nDette link er aktivt i 24 timer.\n\nHvis du ikke har anmodet om at nulstille din adgangskode, kan du roligt ignorere denne e-mail.\n\nMed venlig hilsen,\nCentralen', 'Hallo {{name}},\n\nU heeft verzocht om uw wachtwoord opnieuw in te stellen op Centralen.\nU kunt uw wachtwoord opnieuw instellen door op de volgende link te klikken:\n{{link}}\n\nDeze link is 24 uur geldig.\n\nAls u dit niet heeft aangevraagd, kunt u deze e-mail veilig negeren.\n\nMet vriendelijke groet,\nCentralen', 'Bonjour {{name}},\n\nVous avez demandé à réinitialiser votre mot de passe sur Centralen.\nVous pouvez réinitialiser votre mot de passe en cliquant sur le lien suivant :\n{{link}}\n\nCe lien est actif pendant 24 heures.\n\nSi vous n\'avez pas demandé cela, vous pouvez ignorer cet e-mail en toute sécurité.\n\nCordialement,\nCentralen', 'Hallo {{name}},\n\nSie haben beantragt, Ihr Passwort auf Centralen zurückzusetzen.\nSie können Ihr Passwort zurücksetzen, indem Sie auf den folgenden Link klicken:\n{{link}}\n\nDieser Link ist 24 Stunden lang gültig.\n\nWenn Sie dies nicht angefordert haben, können Sie diese E-Mail einfach ignorieren.\n\nMit freundlichen Grüßen,\nCentralen'),
    ('email.invitation.subject', 'Invitation to join {{workspace}} on Centralen', 'Invitation til at deltage i {{workspace}} på Centralen', 'Uitnodiging om deel te nemen aan {{workspace}} op Centralen', 'Invitation à rejoindre {{workspace}} sur Centralen', 'Einladung, {{workspace}} auf Centralen beizutreten'),
    ('email.invitation.body', 'Hello,\n\nYou have been invited by {{sender}} to join the workspace "{{workspace}}" on Centralen.\n\nYou can accept the invitation by clicking the following link:\n{{link}}\n\nBest regards,\nCentralen', 'Hej,\n\nDu er blevet inviteret af {{sender}} til at deltage i arbejdsrummet "{{workspace}}" på Centralen.\n\nDu kan acceptere invitationen ved at klikke på følgende link:\n{{link}}\n\nMed venlig hilsen,\nCentralen', 'Hallo,\n\nU bent door {{sender}} uitgenodigd om deel te nemen aan de werkruimte "{{workspace}}" op Centralen.\n\nU kunt de uitnodiging accepteren door op de volgende link te klikken:\n{{link}}\n\nMet vriendelijke groet,\nCentralen', 'Bonjour,\n\nVous avez été invité par {{sender}} à rejoindre l\'espace de travail "{{workspace}}" sur Centralen.\n\nVous pouvez accepter l\'invitation en cliquant sur le lien suivant :\n{{link}}\n\nCordialement,\nCentralen', 'Hallo,\n\nSie wurden von {{sender}} eingeladen, dem Arbeitsbereich "{{workspace}}" auf Centralen beizutreten.\n\nSie können die Einladung annehmen, indem Sie auf den folgenden Link klicken:\n{{link}}\n\nMit freundlichen Grüßen,\nCentralen'),
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

print(f"Successfully seeded {len(translations)} signup and workspace creation translations into the database.")
