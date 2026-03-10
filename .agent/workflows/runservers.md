---
description: Start backend and frontend servers for Centralen
---

# Start Servers Workflow

Dette projekt bruger specifikke porte for at undgå konflikter med andre projekter.

1. **Backend (Django)**:
   - Folder: `c:/DEV/Centralen/backend`
   - Command: `python manage.py runserver 8030`
   - URL: `http://localhost:8030`

2. **Frontend (React/Vite)**:
   - Folder: `c:/DEV/Centralen/frontend`
   - Command: `npm run dev` (kører på port 5180 via vite.config.ts)
   - URL: `http://localhost:5180`

// turbo
3. **Verify running status**:
   - Check if backend is alive: `curl.exe -I http://localhost:8030/api/users/`
