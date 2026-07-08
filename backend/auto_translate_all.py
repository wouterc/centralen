import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import UITranslation

translation_map = {
    "knowledge base": {
        "nl": "Kennisbank",
        "fr": "Base de connaissances",
        "de": "Wissensdatenbank"
    },
    "collection of knowledge, templates, and guides for case processing.": {
        "nl": "Verzameling van kennis, sjablonen en handleidingen voor casebehandeling.",
        "fr": "Collection de connaissances, de modèles et de guides pour le traitement des cas.",
        "de": "Sammlung von Wissen, Vorlagen und Leitfäden für die Fallbearbeitung."
    },
    "add new knowledge": {
        "nl": "Nieuwe kennis toevoegen",
        "fr": "Ajouter des connaissances",
        "de": "Neues Wissen hinzufügen"
    },
    "filters": {
        "nl": "Filters",
        "fr": "Filtres",
        "de": "Filter"
    },
    "clear": {
        "nl": "Wissen",
        "fr": "Effacer",
        "de": "Löschen"
    },
    "show archived": {
        "nl": "Toon gearchiveerd",
        "fr": "Afficher les archives",
        "de": "Archivierte anzeigen"
    },
    "trash (deleted)": {
        "nl": "Prullenbak (Verwijderd)",
        "fr": "Corbeille (Supprimé)",
        "de": "Papierkorb (Gelöscht)"
    },
    "categories": {
        "nl": "Categorieën",
        "fr": "Catégories",
        "de": "Kategorien"
    },
    "all categories": {
        "nl": "Alle categorieën",
        "fr": "Toutes les catégories",
        "de": "Alle Kategorien"
    },
    "search title or text...": {
        "nl": "Zoek titel of tekst...",
        "fr": "Rechercher titre ou texte...",
        "de": "Titel oder Text suchen..."
    },
    "search in deleted articles...": {
        "nl": "Zoek in verwijderde artikelen...",
        "fr": "Rechercher dans les articles supprimés...",
        "de": "In gelöschten Artikeln suchen..."
    },
    "the trash is empty.": {
        "nl": "De prullenbak is leeg.",
        "fr": "La corbeille est vide.",
        "de": "Der Papierkorb ist leer."
    },
    "we found no results matching your search. try different keywords.": {
        "nl": "Geen resultaten gevonden. Probeer andere trefwoorden.",
        "fr": "Aucun résultat trouvé. Essayez d'autres mots-clés.",
        "de": "Keine Ergebnisse gefunden. Versuchen Sie andere Schlüsselwörter."
    },
    "clear all filters": {
        "nl": "Wis alle filters",
        "fr": "Effacer tous les filtres",
        "de": "Alle Filter löschen"
    },
    "time tracking": {
        "nl": "Tijdregistratie",
        "fr": "Suivi du temps",
        "de": "Zeiterfassung"
    },
    "register your hours and track your time.": {
        "nl": "Registreer uw uren en houd uw tijd bij.",
        "fr": "Enregistrez vos heures et suivez votre temps.",
        "de": "Registrieren Sie Ihre Stunden und verfolgen Sie Ihre Zeit."
    },
    "add entry": {
        "nl": "Invoer toevoegen",
        "fr": "Ajouter une entrée",
        "de": "Eintrag hinzufügen"
    },
    "annual calendar": {
        "nl": "Jaarkalender",
        "fr": "Calendrier annuel",
        "de": "Jahreskalender"
    },
    "annual overview of activities and deadlines.": {
        "nl": "Jaarlijks overzicht afspraken en deadlines.",
        "fr": "Aperçu annuel des activités et des échéances.",
        "de": "Jahresübersicht über Aktivitäten und Termine."
    },
    "applications": {
        "nl": "Applicaties",
        "fr": "Applications",
        "de": "Anwendungen"
    },
    "links to external systems and tools.": {
        "nl": "Links naar externe systemen en hulpmiddelen.",
        "fr": "Liens vers des systèmes et outils externes.",
        "de": "Links zu externen Systemen und Tools."
    },
    "users & teams": {
        "nl": "Gebruikers & Teams",
        "fr": "Utilisateurs & Équipes",
        "de": "Benutzer & Teams"
    },
    "manage users, roles, and teams.": {
        "nl": "Beheer gebruikers, rollen en teams.",
        "fr": "Gérer les utilisateurs, les rôles et les équipes.",
        "de": "Verwalten Sie Benutzer, Rollen und Teams."
    },
    "save": {
        "nl": "Opslaan",
        "fr": "Sauvegarder",
        "de": "Speichern"
    },
    "cancel": {
        "nl": "Annuleren",
        "fr": "Annuler",
        "de": "Abbrechen"
    },
    "delete": {
        "nl": "Verwijderen",
        "fr": "Supprimer",
        "de": "Löschen"
    },
    "edit": {
        "nl": "Bewerken",
        "fr": "Modifier",
        "de": "Bearbeiten"
    },
    "close": {
        "nl": "Sluiten",
        "fr": "Fermer",
        "de": "Schließen"
    },
    "back": {
        "nl": "Terug",
        "fr": "Retour",
        "de": "Zurück"
    },
    "copy link": {
        "nl": "Link kopiëren",
        "fr": "Copier le lien",
        "de": "Link kopieren"
    },
    "workspace": {
        "nl": "Werkruimte",
        "fr": "Espace de travail",
        "de": "Arbeitsbereich"
    },
    "workspace settings": {
        "nl": "Werkruimte-instellingen",
        "fr": "Paramètres de l'espace",
        "de": "Arbeitsbereichs-Einstellungen"
    },
    "leave workspace": {
        "nl": "Werkruimte verlaten",
        "fr": "Quitter l'espace",
        "de": "Arbeitsbereich verlassen"
    },
    "remove member": {
        "nl": "Lid verwijderen",
        "fr": "Retirer le membre",
        "de": "Mitglied entfernen"
    },
    "switch workspace": {
        "nl": "Wisselen af werkruimte",
        "fr": "Changer d'espace",
        "de": "Arbeitsbereich wechseln"
    },
    "create new workspace": {
        "nl": "Nieuwe werkruimte maken",
        "fr": "Créer un espace",
        "de": "Neuen Arbeitsbereich erstellen"
    },
    "admin panel": {
        "nl": "Beheerpaneel",
        "fr": "Panneau d'administration",
        "de": "Admin-Panel"
    },
    "flowchart": {
        "nl": "Stroomdiagram",
        "fr": "Organigramme",
        "de": "Flussdiagramm"
    },
    "new flowchart": {
        "nl": "Nieuw stroomdiagram",
        "fr": "Nouvel organigramme",
        "de": "Neues Flussdiagramm"
    },
    "view": {
        "nl": "Weergave",
        "fr": "Affichage",
        "de": "Ansehen"
    },
    "name": {
        "nl": "Naam",
        "fr": "Nom",
        "de": "Name"
    },
    "description": {
        "nl": "Beschrijving",
        "fr": "Description",
        "de": "Beschreibung"
    },
    "color": {
        "nl": "Kleur",
        "fr": "Couleur",
        "de": "Farbe"
    },
    "shape": {
        "nl": "Vorm",
        "fr": "Forme",
        "de": "Form"
    },
    "rectangle": {
        "nl": "Rechthoek",
        "fr": "Rectangle",
        "de": "Rechteck"
    },
    "diamond": {
        "nl": "Ruit",
        "fr": "Losange",
        "de": "Raute"
    },
    "oval": {
        "nl": "Ovaal",
        "fr": "Ovale",
        "de": "Oval"
    },
    "delete node": {
        "nl": "Knooppunt verwijderen",
        "fr": "Supprimer le nœud",
        "de": "Knoten löschen"
    },
    "delete connection": {
        "nl": "Verbinding verwijderen",
        "fr": "Supprimer la connexion",
        "de": "Verbindung löschen"
    },
    "add shape": {
        "nl": "Vorm toevoegen",
        "fr": "Ajouter une forme",
        "de": "Form hinzufügen"
    },
    "properties": {
        "nl": "Eigenschappen",
        "fr": "Propriétés",
        "de": "Eigenschaften"
    },
    "no flowcharts yet": {
        "nl": "Nog geen stroomdiagrammen",
        "fr": "Aucun organigramme",
        "de": "Noch keine Flussdiagramme"
    },
    "select a flowchart to view": {
        "nl": "Selecteer een stroomdiagram",
        "fr": "Sélectionnez un organigramme",
        "de": "Wählen Sie ein Flussdiagramm"
    },
    "team": {
        "nl": "Team",
        "fr": "Équipe",
        "de": "Team"
    },
    "all (company-wide)": {
        "nl": "Alle (bedrijf breed)",
        "fr": "Tous (toute l'entreprise)",
        "de": "Alle (unternehmensweit)"
    },
    "pinboard": {
        "nl": "Prikbord",
        "fr": "Panneau d'affichage",
        "de": "Pinnwand"
    },
    "ideas & dialogue": {
        "nl": "Ideeën & dialoog",
        "fr": "Idées & dialogue",
        "de": "Ideen & Dialog"
    },
    "all teams": {
        "nl": "Alle teams",
        "fr": "Toutes les équipes",
        "de": "Alle Teams"
    },
    "only mine": {
        "nl": "Alleen de mijne",
        "fr": "Uniquement les miens",
        "de": "Nur meine"
    },
    "search...": {
        "nl": "Zoeken...",
        "fr": "Recherche...",
        "de": "Suche..."
    },
    "search for users or teams...": {
        "nl": "Zoek naar gebruikers of teams...",
        "fr": "Rechercher des utilisateurs ou équipes...",
        "de": "Nach Benutzern oder Teams suchen..."
    },
    "search for team...": {
        "nl": "Zoek naar team...",
        "fr": "Rechercher une équipe...",
        "de": "Nach Team suchen..."
    },
    "search for group...": {
        "nl": "Zoek naar groep...",
        "fr": "Rechercher un groupe...",
        "de": "Nach Gruppe suchen..."
    },
    "search apps, teams, or purposes...": {
        "nl": "Zoek apps, teams of doelen...",
        "fr": "Rechercher des apps, équipes ou objectifs...",
        "de": "Nach Apps, Teams oder Zwecken suchen..."
    },
    "all teams selected": {
        "nl": "Alle teams geselecteerd",
        "fr": "Toutes les équipes sélectionnées",
        "de": "Alle Teams ausgewählt"
    },
    "annual cycle groups": {
        "nl": "Jaarkalendergroepen",
        "fr": "Groupes de calendrier annuel",
        "de": "Jahreskalender-Gruppen"
    },
    "back to board": {
        "nl": "Terug naar bord",
        "fr": "Retour au tableau",
        "de": "Zurück zum Board"
    },
    "trash": {
        "nl": "Prullenbak",
        "fr": "Corbeille",
        "de": "Papierkorb"
    },
    "unknown category": {
        "nl": "Onbekende categorie",
        "fr": "Catégorie inconnue",
        "de": "Unbekannte Kategorie"
    },
    "article is now moved to trash": {
        "nl": "Artikel is verplaatst naar prullenbak",
        "fr": "L'article est déplacé dans la corbeille",
        "de": "Artikel wurde in den Papierkorb verschoben"
    },
    "article restored from trash": {
        "nl": "Artikel hersteld uit prullenbak",
        "fr": "L'article est restauré de la corbeille",
        "de": "Artikel aus dem Papierkorb wiederhergestellt"
    },
    "move to trash": {
        "nl": "Verplaats naar prullenbak",
        "fr": "Déplacer dans la corbeille",
        "de": "In den Papierkorb verschieben"
    },
    'are you sure you want to delete "{{title}}"? it will be moved to the trash and can be restored by an administrator.': {
        "nl": 'Weet u zeker dat u "{{title}}" wilt verwijderen? Het wordt naar de prullenbak verplaatst.',
        "fr": 'Êtes-vous sûr de vouloir supprimer "{{title}}" ?',
        "de": 'Sind Sie sicher, dass Sie "{{title}}" löschen möchten?'
    },
    "delete (move to trash)": {
        "nl": "Verwijderen (prullenbak)",
        "fr": "Supprimer (corbeille)",
        "de": "Löschen (Papierkorb)"
    },
    "setup": {
        "nl": "Installatie",
        "fr": "Configuration",
        "de": "Einrichtung"
    },
    "overview": {
        "nl": "Overzicht",
        "fr": "Aperçu",
        "de": "Übersicht"
    },
    "fetching your tasks...": {
        "nl": "Taken ophalen...",
        "fr": "Récupération de vos tâches...",
        "de": "Aufgaben werden geladen..."
    },
    "edit time": {
        "nl": "Tijd bewerken",
        "fr": "Modifier le temps",
        "de": "Zeit bearbeiten"
    },
    "active": {
        "nl": "Actief",
        "fr": "Actif",
        "de": "Aktiv"
    },
    "last registered": {
        "nl": "Laatst geregistreerd",
        "fr": "Dernièrement enregistré",
        "de": "Zuletzt registriert"
    },
    "ready": {
        "nl": "Gereed",
        "fr": "Prêt",
        "de": "Bereit"
    },
    "no favorites yet": {
        "nl": "Nog geen favorieten",
        "fr": "Aucun favori pour l'instant",
        "de": "Noch keine Favoriten"
    },
    "go to \"setup\" to add your most used task codes to your dashboard.": {
        "nl": "Ga naar \"Installatie\" om favorieten toe te voegen.",
        "fr": "Allez dans \"Configuration\" pour ajouter des favoris.",
        "de": "Gehen Sie zu \"Einrichtung\", um Favoriten hinzuzufügen."
    },
    "setup now": {
        "nl": "NU INSTALLEREN",
        "fr": "CONFIGURER MAINTENANT",
        "de": "JETZT EINRICHTEN"
    },
    "all task codes": {
        "nl": "Alle taakcodes",
        "fr": "Tous les codes de tâche",
        "de": "Alle Aufgabencodes"
    },
    "search codes...": {
        "nl": "Zoek codes...",
        "fr": "Rechercher des codes...",
        "de": "Codes suchen..."
    },
    "my favorites (dashboard)": {
        "nl": "Mijn favorieten",
        "fr": "Mes favoris",
        "de": "Meine Favoriten"
    },
    "drag codes to change the sorting order on your dashboard.": {
        "nl": "Sleep codes om de volgorde te wijzigen.",
        "fr": "Faites glisser les codes pour modifier l'ordre.",
        "de": "Verschieben Sie Codes, um die Sortierung zu ändern."
    },
    "give the task a name...": {
        "nl": "Geef de taak een naam...",
        "fr": "Donnez un nom à la tâche...",
        "de": "Geben Sie der Aufgabe einen Namen..."
    },
    "add codes from the left side": {
        "nl": "Voeg codes toe vanaf de linkerkant",
        "fr": "Ajoutez des codes à partir de la gauche",
        "de": "Fügen Sie Codes von der linken Seite hinzu"
    },
    "weekly overview": {
        "nl": "WEKELIJKS OVERZICHT",
        "fr": "APERÇU HEBDOMADAIRE",
        "de": "WÖCHENTLICHE ÜBERSICHT"
    },
    "period": {
        "nl": "PERIODE",
        "fr": "PÉRIODE",
        "de": "ZEITRAUM"
    },
    "export csv": {
        "nl": "CSV EXPORTEREN",
        "fr": "EXPORTER CSV",
        "de": "CSV EXPORTIEREN"
    },
    "date": {
        "nl": "Datum",
        "fr": "Date",
        "de": "Datum"
    },
    "time": {
        "nl": "Tijd",
        "fr": "Temps",
        "de": "Zeit"
    },
    "code": {
        "nl": "Code",
        "fr": "Code",
        "de": "Code"
    },
    "action": {
        "nl": "Actie",
        "fr": "Action",
        "de": "Aktion"
    },
    "group": {
        "nl": "Groep",
        "fr": "Groupe",
        "de": "Gruppe"
    },
    "mon": {
        "nl": "Ma",
        "fr": "Lun",
        "de": "Mo"
    },
    "tue": {
        "nl": "Di",
        "fr": "Mar",
        "de": "Di"
    },
    "wed": {
        "nl": "Wo",
        "fr": "Mer",
        "de": "Mi"
    },
    "thu": {
        "nl": "Do",
        "fr": "Jeu",
        "de": "Do"
    },
    "fri": {
        "nl": "Vr",
        "fr": "Ven",
        "de": "Fr"
    },
    "sat": {
        "nl": "Za",
        "fr": "Sam",
        "de": "Sa"
    },
    "sun": {
        "nl": "Zo",
        "fr": "Dim",
        "de": "So"
    },
    "total": {
        "nl": "Totaal",
        "fr": "Total",
        "de": "Gesamt"
    },
    "no registrations found for this period": {
        "nl": "Geen registraties gevonden voor deze periode",
        "fr": "Aucune inscription trouvée pour cette période",
        "de": "Keine Registrierungen für diesen Zeitraum gefunden"
    },
    "no data for this week": {
        "nl": "Geen gegevens voor deze week",
        "fr": "Aucune donnée pour cette semaine",
        "de": "Keine Daten für diese Woche"
    },
    "weekly total:": {
        "nl": "Wekelijks Totaal:",
        "fr": "Total hebdomadaire :",
        "de": "Wöchentliche Summe:"
    },
    "board": {
        "nl": "Bord",
        "fr": "Tableau",
        "de": "Board"
    },
    "development and bug fixes": {
        "nl": "Ontwikkeling en bugfixes",
        "fr": "Développement et corrections de bugs",
        "de": "Entwicklung und Bugfixes"
    },
    "all assignees": {
        "nl": "Alle toegewiesenen",
        "fr": "Tous les responsables",
        "de": "Alle Zuständigen"
    },
    "new task": {
        "nl": "Nieuwe taak",
        "fr": "Nouvelle tâche",
        "de": "Neue Aufgabe"
    },
    "backlog": {
        "nl": "Backlog",
        "fr": "Backlog",
        "de": "Backlog"
    },
    "ready to start": {
        "nl": "Klaar om te starten",
        "fr": "Prêt à démarrer",
        "de": "Bereit zum Starten"
    },
    "in progress": {
        "nl": "In uitvoering",
        "fr": "En cours",
        "de": "In Bearbeitung"
    },
    "testing": {
        "nl": "Testen",
        "fr": "En test",
        "de": "Testen"
    },
    "done": {
        "nl": "Klaar",
        "fr": "Terminé",
        "de": "Erledigt"
    },
    "on hold": {
        "nl": "On Hold",
        "fr": "En attente",
        "de": "Ausgesetzt"
    },
    "hide on hold": {
        "nl": "On Hold verbergen",
        "fr": "Masquer en attente",
        "de": "Ausgesetzt ausblenden"
    },
    "show on hold": {
        "nl": "On Hold tonen",
        "fr": "Afficher en attente",
        "de": "Ausgesetzt anzeigen"
    },
    "users": {
        "nl": "Gebruikers",
        "fr": "Utilisateurs",
        "de": "Benutzer"
    },
    "teams": {
        "nl": "Teams",
        "fr": "Équipes",
        "de": "Teams"
    },
    "log out": {
        "nl": "Uitloggen",
        "fr": "Se déconnecter",
        "de": "Abmelden"
    },
    "administrator": {
        "nl": "Beheerder",
        "fr": "Administrateur",
        "de": "Administrator"
    },
    "superuser": {
        "nl": "Supergebruiker",
        "fr": "Superutilisateur",
        "de": "Superuser"
    },
    "member": {
        "nl": "Lid",
        "fr": "Membre",
        "de": "Mitglied"
    },
    "loading...": {
        "nl": "Laden...",
        "fr": "Chargement...",
        "de": "Laden..."
    },
    "an error occurred": {
        "nl": "Er is een fout opgetreden",
        "fr": "Une erreur est survenue",
        "de": "Ein Fehler ist aufgetreten"
    }
}

count = 0
for obj in UITranslation.objects.all():
    en_val = obj.en.strip().lower()
    
    # Try direct match
    match = translation_map.get(en_val)
    
    # Try exact string match if not lowercased
    if not match:
        for k, v in translation_map.items():
            if k == en_val:
                match = v
                break
                
    if match:
        obj.nl = match["nl"]
        obj.fr = match["fr"]
        obj.de = match["de"]
        obj.save()
        count += 1

print(f"Automatically translated {count} database records into Nederlands, Français, and Deutsch.")
