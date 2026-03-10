---
description: Start development environment for Centralen Project
---

# Start Dev Workflow

For at starte projektet korrekt skal følgende porte altid benyttes:

1. **Backend (Django)**:
   - Folder: `c:/DEV/Centralen/backend`
   - Command: `python manage.py runserver 8030`
   - URL: `http://localhost:8030`

2. **Frontend (React/Vite)**:
   - Folder: `c:/DEV/Centralen/frontend`
   - Command: `npm run dev`
   - URL: `http://localhost:5180`

// turbo
3. **Verify running status**:
   - Check if backend is alive: `curl.exe -I http://localhost:8030/api/users/`