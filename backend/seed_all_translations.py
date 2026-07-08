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

    # Flowchart
    ('nav.flowchart', 'Flowchart', 'Flowchart', 'Stroomdiagram', 'Organigramme', 'Flussdiagramm'),
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
