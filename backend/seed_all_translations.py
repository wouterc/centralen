import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

translations = [
    # Vidensbank (Knowledge Base)
    ('kb.title', 'Knowledge Base', 'Vidensbank', 'Kennisbank', 'Base de connaissances', 'Wissensdatenbank'),
    ('kb.subtitle', 'Collection of knowledge, templates, and guides for case processing.', 'Samling af viden, skabeloner og vejledninger til sagsbehandling.', 'Verzameling van kennis, sjablonen en handleidingen voor casebehandeling.', 'Collection de connaissances, de modèles et de guides pour le traitement des cas.', 'Sammlung von Wissen, Vorlagen und Leitfäden für die Fallbearbeitung.'),
    ('kb.add_new', 'Add new knowledge', 'Tilføj ny viden', 'Nieuwe kennis toevoegen', 'Ajouter de nouvelles connaissances', 'Neues Wissen hinzufügen'),
    ('kb.filters', 'Filters', 'Filtre', 'Filters', 'Filtres', 'Filter'),
    ('kb.clear_filters', 'Clear', 'Ryd', 'Wissen', 'Effacer', 'Löschen'),
    ('kb.show_archived', 'Show archived', 'Vis arkiverede', 'Toon gearchiveerd', 'Afficher les archives', 'Archivierte anzeigen'),
    ('kb.trash', 'Trash (Deleted)', 'Papirkurv (Slettede)', 'Prullenbak (Verwijderd)', 'Corbeille (Supprimé)', 'Papierkorb (Gelöscht)'),
    ('kb.categories', 'Categories', 'Kategorier', 'Categorieën', 'Catégories', 'Kategorien'),
    ('kb.all_categories', 'All categories', 'Alle kategorier', 'Alle categorieën', 'Toutes les catégories', 'Alle Kategorien'),
    ('kb.search_placeholder', 'Search title or text...', 'Søg i titel eller tekst...', 'Zoek titel of tekst...', 'Rechercher titre ou texte...', 'Titel oder Text suchen...'),
    ('kb.search_deleted_placeholder', 'Search in deleted articles...', 'Søg i slettede artikler...', 'Zoek in verwijderde artikelen...', 'Rechercher dans les articles supprimés...', 'In gelöschten Artikeln suchen...'),
    ('kb.trash_empty', 'The trash is empty.', 'Papirkurven er tom.', 'De prullenbak is leeg.', 'La corbeille est vide.', 'Der Papierkorb ist leer.'),
    ('kb.no_results', 'We found no results matching your search. Try different keywords.', 'Vi fandt ikke noget, der matchede din søgning. Prøv med andre søgeord.', 'Geen resultaten gevonden. Probeer andere trefwoorden.', "Aucun résultat trouvé. Essayez d'autres mots-clés.", 'Keine Ergebnisse gefunden. Versuchen Sie andere Schlüsselwörter.'),
    ('kb.clear_all_filters', 'Clear all filters', 'Ryd alle filtre', 'Wis alle filters', 'Effacer tous les filtres', 'Alle Filter löschen'),

    # Tidsregistrering (Time Tracking)
    ('time.title', 'Time Tracking', 'Tidsregistrering', 'Tijdregistratie', 'Suivi du temps', 'Zeiterfassung'),
    ('time.subtitle', 'Register your hours and track your time.', 'Registrer dine timer og hold styr på din tid.', 'Registreer uw uren en houd uw tijd bij.', 'Enregistrez vos heures et suivez votre temps.', 'Registrieren Sie Ihre Stunden und verfolgen Sie Ihre Zeit.'),
    ('time.add_entry', 'Add Entry', 'Tilføj registrering', 'Invoer toevoegen', 'Ajouter une entrée', 'Eintrag hinzufügen'),

    # Aarshjul (Annual Cycle)
    ('calendar.title', 'Annual Calendar', 'Årshjul', 'Jaarkalender', 'Calendrier annuel', 'Jahreskalender'),
    ('calendar.subtitle', 'Annual overview of activities and deadlines.', 'Årligt overblik over aktiviteter og deadlines.', 'Jaarlijks overzicht afspraken en deadlines.', 'Aperçu annuel des activités et des échéances.', 'Jahresübersicht über Aktivitäten und Termine.'),
    
    # Applinks (Apps)
    ('apps.title', 'Applications', 'Applikationer', 'Applicaties', 'Applications', 'Anwendungen'),
    ('apps.subtitle', 'Links to external systems and tools.', 'Links til eksterne systemer og værktøjer.', 'Links naar externe systemen en hulpmiddelen.', 'Liens vers des systèmes et outils externes.', 'Links zu externen Systemen und Tools.'),
    
    # Users & Teams 
    ('users.title', 'Users & Teams', 'Brugere & Teams', 'Gebruikers & Teams', 'Utilisateurs & Équipes', 'Benutzer & Teams'),
    ('users.subtitle', 'Manage users, roles, and teams.', 'Administrer brugere, roller og teams.', 'Beheer gebruikers, rollen en teams.', 'Gérer les utilisateurs, les rôles et les équipes.', 'Verwalten Sie Benutzer, Rollen und Teams.'),

    # Common buttons
    ('common.save', 'Save', 'Gem', 'Opslaan', 'Sauvegarder', 'Speichern'),
    ('common.cancel', 'Cancel', 'Annuller', 'Annuleren', 'Annuler', 'Abbrechen'),
    ('common.delete', 'Delete', 'Slet', 'Verwijderen', 'Supprimer', 'Löschen'),
    ('common.edit', 'Edit', 'Rediger', 'Bewerken', 'Modifier', 'Bearbeiten'),
    ('common.close', 'Close', 'Luk', 'Sluiten', 'Fermer', 'Schließen'),
    ('common.back', 'Back', 'Tilbage', 'Terug', 'Retour', 'Zurück'),
    ('common.copy_link', 'Copy Link', 'Kopiér link', 'Link kopiëren', 'Copier le lien', 'Link kopieren'),
    
    # Workspace
    ('workspace.title', 'Workspace', 'Arbejdsrum', 'Werkruimte', 'Espace de travail', 'Arbeitsbereich'),
    ('workspace.settings', 'Workspace Settings', 'Indstillinger', 'Werkruimte-instellingen', "Paramètres de l'espace", 'Arbeitsbereichs-Einstellungen'),
    ('workspace.leave', 'Leave Workspace', 'Forlad arbejdsrum', 'Werkruimte verlaten', "Quitter l'espace", 'Arbeitsbereich verlassen'),
    ('workspace.remove_member', 'Remove Member', 'Fjern Medlem', 'Lid verwijderen', 'Retirer le membre', 'Mitglied entfernen'),
    ('workspace.switch', 'Switch Workspace', 'Skift Arbejdsrum', 'Wisselen af werkruimte', "Changer d'espace", 'Arbeitsbereich wechseln'),
    ('workspace.create_new', 'Create New Workspace', 'Opret Nyt Arbejdsrum', 'Nieuwe werkruimte maken', 'Créer un espace', 'Neuen Arbeitsbereich erstellen'),
    ('workspace.admin', 'Admin Panel', 'Administrationspanel', 'Beheerpaneel', "Panneau d'administration", 'Admin-Panel'),

    # Navigation
    ('nav.board', 'Board', 'Tavlen', 'Bord', 'Tableau', 'Board'),
    ('nav.users', 'Users & Teams', 'Medlemmer', 'Gebruikers & Teams', 'Utilisateurs & Équipes', 'Benutzer & Teams'),
    ('nav.knowledge', 'Knowledge Base', 'Vidensbank', 'Kennisbank', 'Base de connaissances', 'Wissensdatenbank'),
    ('nav.time', 'Time Tracking', 'Tidsregistrering', 'Tijdregistratie', 'Suivi du temps', 'Zeiterfassung'),
    ('nav.calendar', 'Annual Calendar', 'Årshjul', 'Jaarkalender', 'Calendrier annuel', 'Jahreskalender'),
    ('nav.pinboard', 'Pinboard', 'Prikbord', 'Prikbord', "Tableau d'affichage", 'Pinnwand'),
    ('nav.apps', 'Apps', 'Værktøjer', 'Apps', 'Applications', 'Apps'),
    ('nav.flowchart', 'Flowchart', 'Flowchart', 'Stroomdiagram', 'Organigramme', 'Flussdiagramm'),
    ('nav.settings', 'Settings', 'Indstillinger', 'Instellingen', 'Paramètres', 'Einstellungen'),
    ('nav.logout', 'Log Out', 'Log ud', 'Uitloggen', 'Se déconnecter', 'Abmelden'),
    ('navigation.invitations.title', 'Pending approval', 'Mangler godkendelse', 'Wacht op goedkeuring', 'En attente de validation', 'Ausstehende Genehmigung'),
    ('flowchart.new', 'New Flowchart', 'Nyt flowchart', 'Nieuw stroomdiagram', 'Nouvel organigramme', 'Neues Flussdiagramm'),
    ('flowchart.edit_mode', 'Edit', 'Rediger', 'Bewerken', 'Modifier', 'Bearbeiten'),
    ('flowchart.view_mode', 'View', 'Vis', 'Weergave', 'Affichage', 'Ansehen'),
    ('flowchart.save', 'Save', 'Gem', 'Opslaan', 'Sauvegarder', 'Speichern'),
    ('flowchart.name', 'Name', 'Navn', 'Naam', 'Nom', 'Name'),
    ('flowchart.description', 'Description', 'Beskrivelse', 'Beschrijving', 'Description', 'Beschreibung'),
    ('flowchart.color', 'Color', 'Farve', 'Kleur', 'Couleur', 'Farbe'),
    ('flowchart.shape', 'Shape', 'Form', 'Vorm', 'Forme', 'Form'),
    ('flowchart.shape.rectangle', 'Rectangle', 'Rektangel', 'Rechthoek', 'Rectangle', 'Rechteck'),
    ('flowchart.shape.diamond', 'Diamond', 'Diamant', 'Ruit', 'Losange', 'Raute'),
    ('flowchart.shape.oval', 'Oval', 'Oval', 'Ovaal', 'Ovale', 'Oval'),
    ('flowchart.delete_node', 'Delete node', 'Slet node', 'Knooppunt verwijderen', 'Supprimer le nœud', 'Knoten löschen'),
    ('flowchart.delete_edge', 'Delete connection', 'Slet forbindelse', 'Verbinding verwijderen', 'Supprimer la connexion', 'Verbindung loechen'),
    ('flowchart.add_shape', 'Add shape', 'Tilføj form', 'Vorm toevoegen', 'Ajouter une forme', 'Form hinzufügen'),
    ('flowchart.properties', 'Properties', 'Egenskaber', 'Eigenschappen', 'Propriétés', 'Eigenschaften'),
    ('flowchart.no_flowcharts', 'No flowcharts yet', 'Ingen flowcharts endnu', 'Nog geen stroomdiagrammen', 'Aucun organigramme', 'Noch keine Flussdiagramme'),
    ('flowchart.select_hint', 'Select a flowchart to view', 'Vælg et flowchart for at se det', 'Selecteer een stroomdiagram', 'Sélectionnez un organigramme', 'Wählen Sie ein Flussdiagramm'),
    ('flowchart.team', 'Team', 'Team', 'Team', 'Équipe', 'Team'),
    ('flowchart.team_all', 'All (company-wide)', 'Alle (hele virksomheden)', 'Alle (bedrijf breed)', "Tous (toute l'entreprise)", 'Alle (unternehmensweit)'),
    
    # Category Management translations
    ('kb.category_search', 'Search category...', 'Søg kategori...', 'Zoek categorie...', 'Rechercher une catégorie...', 'Kategorie suchen...'),
    ('kb.manage_categories', 'Manage categories', 'Administrer kategorier', 'Categorieën beheren', 'Gérer les catégories', 'Kategorien verwalten'),
    ('kb.only_admins_categories', 'Only administrators can create, edit, or delete categories.', 'Kun administratorer har tilladelse til at oprette, redigere eller slette kategorier.', 'Alleen administrators kunnen categorieën maken, bewerken of verwijderen.', 'Seuls les administrateurs peuvent créer, modifier ou supprimer des catégories.', 'Nur Administratoren können Kategorien erstellen, bearbeiten oder löschen.'),
    ('kb.contact_admin', 'Contact an administrator', 'Kontakt en administrator', 'Neem contact op met een beheerder', 'Contacter un administrateur', 'Kontaktieren Sie einen Administrator'),
    ('kb.no_admins_found', 'No administrators found.', 'Ingen administratorer fundet.', 'Geen administrators gevonden.', 'Aucun administrateur trouvé.', 'Keine Administratoren gefunden.'),
    ('kb.fill_category_name', 'Please fill in the category name', 'Udfyld venligst kategoriens navn', 'Vul de categorienaam in', 'Veuillez saisir le nom de la catégorie', 'Bitte geben Sie den Kategorienamen ein'),
    ('kb.category_updated', 'Category updated successfully', 'Kategori opdateret succesfuldt', 'Categorie succesvol bijgewerkt', 'Catégorie mise à jour avec succès', 'Kategorie erfolgreich aktualisiert'),
    ('kb.category_created', 'Category created successfully', 'Kategori oprettet succesfuldt', 'Categorie succesvol aangemaakt', 'Catégorie créée avec succès', 'Kategorie erfolgreich erstellt'),
    ('kb.category_save_error', 'Error saving category', 'Fejl ved gemning af kategori', 'Fout bij opslaan categorie', 'Erreur lors de l\'enregistrement de la catégorie', 'Fehler beim Speichern der Kategorie'),
    ('kb.select_new_category_toast', 'Please select a new category for existing articles', 'Vælg venligst en ny kategori til de eksisterende artikler', 'Selecteer een nieuwe categorie voor bestaande artikelen', 'Veuillez sélectionner une nouvelle catégorie pour de articles existants', 'Bitte wählen Sie eine neue Kategorie für bestehende Artikel'),
    ('kb.category_delete_error', 'Error deleting category', 'Fejl ved sletning af kategori', 'Fout bij verwijderen categorie', 'Erreur lors de la suppression de la catégorie', 'Fehler beim Löschen der Kategorie'),
    ('kb.category_deleted', 'Category deleted successfully', 'Kategori slettet succesfuldt', 'Categorie succesvol verwijderd', 'Catégorie supprimée avec succès', 'Kategorie erfolgreich gelöscht'),
    ('kb.delete_category_title', 'Delete category: {{name}}', 'Slet kategori: {{name}}', 'Categorie verwijderen: {{name}}', 'Supprimer la catégorie: {{name}}', 'Kategorie löschen: {{name}}'),
    ('kb.delete_category_has_articles', 'This category contains {{count}} articles. To delete the category, you must select another category to move the articles to:', 'Denne kategori indeholder {{count}} artikler. For at slette kategorien skal du vælge en anden kategori at flytte artiklerne til:', 'Deze categorie bevat {{count}} artikelen. Om de categorie te verwijderen, moet u een andere categorie selecteren om de artikelen naar te verhuizen:', 'Cette catégorie contient {{count}} articles. Pour supprimer la catégorie, vous devez sélectionner une autre catégorie pour y déplacer les articles:', 'Diese Kategorie enthält {{count}} Artikel. Um die Kategorie zu löschen, müssen Sie eine andere Kategorie auswählen, in die die Artikel verschoben werden sollen:'),
    ('kb.delete_category_confirm', 'Are you sure you want to delete this category? This action cannot be undone.', 'Er du sikker på, at du vil slette denne kategori? Denne handling kan ikke fortrydes.', 'Weet u zeker dat u deze categorie wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.', 'Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.', 'Sind Sie sicher, dass Sie diese Kategorie löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.'),
    ('kb.select_category_placeholder', 'Select a category...', 'Vælg en kategori...', 'Selecteer een categorie...', 'Sélectionner une catégorie...', 'Kategorie auswählen...'),
    ('kb.create_new_category', 'Create new category', 'Opret ny kategori', 'Nieuwe categorie maken', 'Créer une nouvelle catégorie', 'Neue Kategorie erstellen'),
    ('kb.existing_categories', 'Existing categories', 'Eksisterende kategorier', 'Bestaande categorieën', 'Catégories existantes', 'Bestehende Kategorien'),
    ('kb.save_changes', 'Save changes', 'Gem ændringer', 'Wijzigingen opslaan', 'Enregistrer les modifications', 'Änderungen speichern'),
    ('kb.create_category', 'Create category', 'Opret kategori', 'Categorie aanmaken', 'Créer la catégorie', 'Kategorie erstellen'),
    ('kb.private_category', 'Private category', 'Privat kategori', 'Privé-categorie', 'Catégorie privée', 'Private Kategorie'),
    ('kb.private_category_desc', 'If checked, articles in this category can only be seen by the creator.', 'Hvis markeret, kan artikler i denne kategori kun ses af opretteren.', 'Indien aangevinkt, kunnen artikelen in deze categorie alleen door de maker worden gezien.', 'Si coché, les articles de cette catégorie ne peuvent être vus que par leur créateur.', 'Wenn diese Option aktiviert ist, kunnen Artikel in dieser Kategorie nur vom Ersteller gesehen werden.'),
    ('kb.category_name_label', 'Category name', 'Kategoriens navn', 'Categorienaam', 'Nom de la catégorie', 'Kategoriename'),
    ('kb.edit_category', 'Edit category', 'Rediger kategori', 'Categorie bewerken', 'Modifier la catégorie', 'Kategorie bearbeiten'),
    ('kb.delete_category', 'Delete category', 'Slet kategori', 'Categorie verwijderen', 'Supprimer la catégorie', 'Kategorie löschen'),

    # Tidsregistrering extra translations
    ('time.manage_task_codes', 'Manage task codes', 'Administrer taakkoder', 'Taakkodes beheren', 'Gérer les codes de tâche', 'Aufgabencodes verwalten'),
    ('time.only_admins_task_codes', 'Only administrators can create, edit, or delete task codes.', 'Kun administratorer har tilladelse til at oprette, redigere eller slette taakkoder.', 'Alleen administrators kunnen taakkodes maken, bewerken of verwijderen.', 'Seuls les administrateurs peuvent créer, modifier ou supprimer des codes de tâche.', 'Nur Administratoren können Aufgabencodes erstellen, bearbeiten oder löschen.'),
    ('time.contact_admin', 'Contact an administrator', 'Kontakt en administrator', 'Neem contact op met een beheerder', 'Contacter un administrateur', 'Kontaktieren Sie einen Administrator'),
    ('time.no_admins_found', 'No administrators found.', 'Ingen administratorer fundet.', 'Geen administrators gevonden.', 'Aucun administrateur trouvé.', 'Keine Administratoren gefunden.'),
    ('time.setup_all_codes', 'All Task Codes', 'Alle opgavekoder', 'Alle taakcodes', 'Tous les codes de tâche', 'Alle Aufgabencodes'),
    ('time.setup_search_placeholder', 'Search codes...', 'Søg koder...', 'Zoek codes...', 'Rechercher des codes...', 'Codes suchen...'),
    ('time.setup_my_favorites', 'My Favorites (Dashboard)', 'Mine favoritter (Dashboard)', 'Mijn favorieten (Dashboard)', 'Mes favoris (Tableau de bord)', 'Meine Favoriten (Dashboard)'),
    ('time.setup_drag_info', 'Drag codes to change the sorting order on your dashboard.', 'Træk koder for at ændre sorteringsrækkefølgen på dit dashboard.', 'Sleep codes om de volgorde op uw dashboard te wijzigen.', 'Faites glisser les codes pour modifier l\'ordre de tri sur votre tableau de bord.', 'Ziehen Sie Codes, um die Sortierreihenfolge auf Ihrem Dashboard zu ändern.'),
    ('time.setup_alias_placeholder', 'Give the task a name...', 'Giv opgaven et navn...', 'Geef de taak een naam...', 'Donner un nom à la tâche...', 'Geben Sie der Aufgabe einen Namen...'),
    ('time.setup_task_code_placeholder', 'E.g. 101, 9304...', 'F.eks. 101, 9304...', 'Bijv. 101, 9304...', 'Par ex. 101, 9304...', 'Z.B. 101, 9304...'),
    ('time.setup_task_desc_placeholder', 'E.g. Administration, Development...', 'F.eks. Administration, Udvikling...', 'Bijv. Administratie, Ontwikkeling...', 'Par ex. Administration, Développement...', 'Z.B. Verwaltung, Entwicklung...'),
    ('time.setup_task_group_label', 'Group (Optional)', 'Gruppe (Valgfri)', 'Groep (Optioneel)', 'Groupe (Optionnel)', 'Gruppe (Optional)'),
    ('time.setup_task_code_label', 'Task code number', 'Taakkodens nummer', 'Taakcodenummer', 'Numéro de code de tâche', 'Aufgabencodenummer'),
    ('time.setup_task_desc_label', 'Description', 'Beskrivelse', 'Beschrijving', 'Description', 'Beschreibung'),
    ('time.setup_import_csv', 'Import CSV', 'Importer CSV', 'CSV importeren', 'Importer un CSV', 'CSV importieren'),
    ('time.setup_export_csv', 'Eksporter CSV', 'Eksporter CSV', 'CSV exporteren', 'Exporter un CSV', 'CSV exportieren'),
    ('time.setup_importing', 'Importing...', 'Importerer...', 'Importeren...', 'Import en cours...', 'Importieren...'),
    ('time.setup_add_code', 'Create code', 'Opret kode', 'Code aanmaken', 'Créer le code', 'Code erstellen'),
    ('time.setup_edit_code', 'Save changes', 'Gem ændringer', 'Wijzigingen opslaan', 'Enregistrer les modifications', 'Änderungen speichern'),
    ('time.setup_new_code_title', 'Create new task code', 'Opret ny taakkode', 'Nieuwe taakcode maken', 'Créer un nouveau code de tâche', 'Neuen Aufgabencode erstellen'),
    ('time.setup_delete_confirm', 'Are you sure you want to delete this task code? This action cannot be undone.', 'Er du sikker på, at du vil slette denne taakkode? Denne handling kan ikke fortrydes.', 'Weet u zeker dat u deze taakcode wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.', 'Êtes-vous sûr de vouloir supprimer ce code de tâche ? Cette action est irréversible.', 'Sind Sie sicher, dass Sie diesen Aufgabencode löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.'),
    ('time.setup_delete_error', 'Could not delete task code', 'Kunne ikke slette taakkode', 'Kon taakcode niet verwijderen', 'Impossible de supprimer le code de tâche', 'Aufgabencode konnte nicht gelöscht werden'),
    ('time.setup_save_error', 'Could not save task code', 'Kunne ikke gemme taakkode', 'Kon taakcode niet opslaan', 'Impossible d\'enregistrer le code de tâche', 'Aufgabencode konnte nicht gespeichert werden'),
    ('time.setup_fill_code', 'Please fill in the code number', 'Udfyld venligst kodens nummer', 'Vul het codenummer in', 'Veuillez saisir le numéro de code', 'Bitte geben Sie de Codenummer ein'),
    ('time.setup_fill_desc', 'Please fill in the code description', 'Udfyld venligst kodens beskrivelse', 'Vul de codebeschrijving in', 'Veuillez saisir la description du code', 'Bitte geben Sie die Codebeschreibung ein'),
    ('time.setup_delete_title', 'Delete task code: {{code}}', 'Slet taakkode: {{code}}', 'Taakcode verwijderen: {{code}}', 'Supprimer le code de tâche: {{code}}', 'Aufgabencode löschen: {{code}}'),
    ('time.setup_delete', 'Delete', 'Slet', 'Verwijderen', 'Supprimer', 'Löschen'),
    ('time.setup_code_updated', 'Task code updated successfully', 'Taakkode opdateret succesfuldt', 'Taakcode succesvol bijgewerkt', 'Code de tâche mis à jour avec succès', 'Aufgabencode erfolgreich aktualisiert'),
    ('time.setup_code_created', 'Task code created successfully', 'Taakkode oprettet succesfuldt', 'Taakcode succesvol aangemaakt', 'Code de tâche créé avec succès', 'Aufgabencode erfolgreich erstellt'),
    ('time.setup_code_deleted', 'Task code deleted successfully', 'Taakkode slettet succesfuldt', 'Taakcode succesvol verwijderd', 'Code de tâche supprimé avec succès', 'Aufgabencode erfolgreich gelöscht'),
    ('time.setup_add_hint', 'Add codes from the left side', 'Tilføj koder fra venstre side', 'Voeg codes toe vanaf de linkerkant', 'Ajouter des codes depuis la gauche', 'Codes von der linken Seite hinzufügen'),
    ('time.existing_codes', 'Existing codes', 'Eksisterende koder', 'Bestaande koder', 'Codes existants', 'Bestehende Codes'),
    ('time.overview_weekly', 'WEEKLY OVERVIEW', 'UGENTLIGT OVERBLIK', 'WEKELIJKS OVERZICHT', 'APERÇU HEBDOMADAIRE', 'WÖCHENTLICHE ÜBERSICHT'),
    ('time.overview_period', 'PERIOD', 'PERIODE', 'PERIODE', 'PÉRIODE', 'ZEITRAUM'),
    ('time.overview_my_hours', 'MINE TIMER', 'MINE TIMER', 'MIJN TIMER', 'MES HEURES', 'MEINE STUNDEN'),
    ('time.overview_all_users', 'ALLE MEDARBEJDERE', 'ALLE MEDARBEJDERE', 'ALLE MEDEWERKERS', 'TOUS LES EMPLOYÉS', 'ALLE MITARBEITER'),
    ('time.overview_export_csv', 'EXPORT CSV', 'EKSPORTER CSV', 'CSV EXPORTEREN', 'EXPORTER CSV', 'CSV EXPORTIEREN'),
    ('time.overview_col_user', 'Employee', 'Medarbejder', 'Medewerker', 'Employé', 'Mitarbeiter'),
    ('time.overview_total_all_users', 'Total all employees:', 'Total alle medarbejdere:', 'Totaal alle medewerkers:', 'Total de tous les employés:', 'Gesamt alle Mitarbeiter:'),
    ('time.overview_hent', 'FETCH', 'Hent', 'Haal op', 'Charger', 'Laden'),
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

print(f"Seeded {len(translations)} translations (EN, DA, NL, FR, DE) into the database.")
