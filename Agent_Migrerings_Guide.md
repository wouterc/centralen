# 🤖 Agent Instruks: MS SQL til PostgreSQL Migrering

Kære Agent i det nye workspace. Din opgave er at migrere backenden fra en **MS SQL-database** over til en ny **PostgreSQL-database**. Tidligere (i MGLP projektet) stødte vi på nogle markante udfordringer, som du forventes at undgå ved at følge denne strømlinede rækkefølge.

Følg disse trin slavisk *inden* du forsøger at loade noget data:

## 1. Undgå CharMap / Encoding fejl under data-udtræk
Når du kører Djangos `dumpdata` fra MS SQL, må du **IKKE** benytte fil-piping (`> datadump.json`). Dette crasher på Windows grundet specialtegn og emojis.
* **Brug i stedet:** `-o datadump.json`
* **Kommando:** `python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 4 -o datadump.json`

## 2. Løs T-SQL syntax fejl i gamle migrationsfiler 
PostgreSQL forstår ikke T-SQL (f.eks. `IF COL_LENGTH(...)`).
* **Handling:** Søg i backend-kodens `migrations`-mapper efter `RunSQL` funktioner som indeholder MS SQL-specifik opsætning (søg efter `IF ` eller lignende). 
* Hvis de eksisterer, skal de kommenteres ud eller tømmes (sæt `operations = []` for den migration), da Djangos almindelige migrations genererer skemaet korrekt i Postgres uanset hvad.

## 3. Løs "Duplicate Key" / IntegrityErrors før loaddata
Hvis applikationen har `post_save` signals (f.eks. på `User` for at oprette `UserProfile`), vil Djangos `loaddata` fejle, fordi den signal-automatisk opretter en profil, som `loaddata` derefter forsøger at overskrive.
* **Handling:** Find alle relevante `post_save` receivers og tilføj et raw-tjek helt i toppen af funktionen:
```python
def dit_signal_navn(sender, instance, **kwargs):
    if kwargs.get('raw', False):
        return  # Ignorer under loaddata
    # ... resten af logikken
```

## 4. Undgå "permission denied for schema public" i PostgreSQL
PostgreSQL (ved v15+) tillader ikke længere at almindelige brugere opretter tabeller i standard `public`-schemaet.
* Konfiguration: Sørg for at den nye PostgreSQL database er oprettet med databasens ejer sat direkte som den bruger systemet connecter med (f.eks. via SQL-kommandoen: `CREATE DATABASE <databasenavn> OWNER <database_bruger>;`).
* Så længe brugeren er owner af selve databasen, gennemtvinges tilladelserne korrekt, og `python manage.py migrate` vil virke.

## 5. Klargøring i .env og opsætning
* Sørg for at `DATABASE_ENGINE` (eller hvad projektet bruger som styrevariabel) er sat i filen `.env`. 
* Tjek at settings-filen forstår at læse de korrekte variabelnavne (f.eks. `PG_DATABASE_HOST`) når den skifter spor til `postgresql`.
* Glem ikke at linjerne også skal oprettes/overføres korrekt til produktions-/staging serverens `.env` fil. 

## 6. Den sikreste rækkefølge i terminalen
Når konfigurationen (kodeændringerne og .env) er gjort klar, så kør i denne specifikke rækkefølge:
1. Udtræk: `python manage.py dumpdata ... -o datadump.json` (mens env peger på MS SQL)
2. Skift spor: Peg .env over på den nye PostgreSQL db.
3. Apply: `python manage.py migrate`
4. Sikkerhedstøm: `python manage.py flush --no-input` (for at undgå dobbelt id-konflikter, hvis migrate har sneget defaults ind)
5. Genopbygning: `python manage.py loaddata datadump.json` (kan tage 15+ minutter hvis databasen er fjerntliggende)
6. Synk: Husk at køre din sync/deploy proces, så produktionesserveren får den **nye python kode**, der håndterer postgresql switchet!

Ved at følge denne instruks fra start til slut, sparer vi adskillige timers debugging. Succes!
