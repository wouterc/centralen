# Plan: Email-Base Login, Invitations, & Workspaces

## 1. Navngivning
- Overalt i koden ændrer vi gradvist `Company` til **Arbejdsrum** (i UI'en i det mindste). Backend-modellen kan sagtens hedde `Company` for ikke at skabe for meget database-kaos lige nu, men brugeren ser "Arbejdsrum".

## 2. Model B: E-mail Login & Flere Arbejdsrum
Du spørger helt præcist ind til, hvordan Model B foregår i praksis med sikkerhed og valg.

### Arkitektonisk Ændring
1. **Unikhed:** Lige nu er `username` i Django unikt. Vi skal opsætte Django til at bruge **E-mail** som det primære, unikke login. Hver bruger har dermed kun **én adgangskode** på tværs af hele platformen.
2. **Flere Arbejdsrum med Lokale Profiler:** I stedet for en 1:1 relation mellem UserProfile og Company, skaber vi en ny "Membership" model `(User, Workspace, Rolle, Navn, Farve, etc.)`.
   - En bruger logger ind *én gang* med sin email.
   - I hvert af sine Arbejdsrum har de en "Lokal Profil". De kan f.eks. hedde "Wouter" i ét rum og "[Konsulent] Wouter" i et andet, og have forskellige avatarfarver.
3. **Login-Flowet i UI:**
   - Bruger logger ind med Email & Password.
   - Hvis brugeren KUN har ét arbejdsrum -> Videre direkte til dasboardet (indlæser den lokale profil).
   - Hvis brugeren har FLERE arbejdsrum -> Vis en flot "Vælg Arbejdsrum" skærm med kasser.
   - Efter valg sættes et "Aktivt Arbejdsrum" i deres token/session, og deres *lokale profildata* for det rum hentes ned. Alt de ser derefter (opgaver, årshjul) filtreres efter dette ID.
   
### Er der sikkerhedsrisici?
Ikke hvis vi koder det rigtigt. Den eneste risiko ved e-mail login er, hvis man tillader folk at *tilslutte* sig andres lukkede arbejdsrum automatisk. Løsningen er: Man "slår sig ikke bare til". Man *skal* inviteres med en krypteret token/nøgle. Før man har accepteret invitationen, indgår arbejdsrummet slet ikke på ens profil. Autentificeringen er derfor lige så sikker som klassisk brugernavn+workspace id login, men enormt meget mere moderne.

## 3. Velkomst E-mails (Email Services)
For at sende invitationer og "Glemt Password"-mails, behøver du at integrere med en email udbyder (SMTP). 
- **SendGrid**, **Resend**, og **Mailgun** har alle fantastiske, gratis "Free Tiers" til dette formål (oftest omkring 100 gratis emails om dagen eller 3000 om måneden, hvilket er rigeligt for de fleste mindre SaaS).
- Under *lokal udvikling* sender vi bare emails ud i selve terminalen (skærmen du kigger på). Så slipper vi for at bruge penge eller koble en udbyder på, indtil du rent faktisk lægger det live!

---

### Opgaver for at bygge dette
* [ ] **Fase 1: Auth & E-mail**
  * Opdater Django til at tillade Login på E-mail i stedet for udelukkende username.
  * Lav den nødvendige UI til Email + Password login.
* [ ] **Fase 2: Multi-Workspace Model**
  * Skift `UserProfile.company` (ForeignKey) ud med et `WorkspaceMembership` system.
  * En bruger kan nu have forskellige roller (fx Admin i A, Use i B) i forskellige arbejdsrum.
* [ ] **Fase 3: UX - Valg af Arbejdsrum**
  * Byg "Vælg Arbejdsrum"-skærmen efter succesfuldt login (hvis count > 1).
  * Tilføj en "Skift Arbejdsrum" knap i navigationsbaren, hvor brugeren undervejs i arbejdet lynhurtigt kan skifte kontekst.
* [ ] **Fase 4: Invitations Flow**
  * En Admin klikker "Inviter Medlem" -> Indtaster email -> Vælger rolle.
  * Backend genererer et sikkert (signed) token-link.
  * Systemet sender mail (i terminalen, midlertidigt) eller kopierer linket opsætteren direkte kan sende.
  * Modtager trykker på linket -> Vælger Adgangskode -> Er inde.
