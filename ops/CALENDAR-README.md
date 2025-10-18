# Calendrier Elio & Franck — Add-on

## Installation
1) Copiez **ops/api/routes.calendar.js** et **ops/web/views/calendar.html** dans votre repo (même dossier `ops/` que l'API).
2) Remplacez **ops/api/server.js** par celui fourni (il inclut les routes calendrier sans toucher aux autres endpoints).
3) Ajoutez le bloc CALENDAR à la fin de votre **ops/api/schema.sql** (ou relancez `npm run migrate` avec le fichier fourni).

## Démarrage
```bash
cd ops/api
npm run migrate
npm run dev
```

Ouvrez `ops/web/views/calendar.html` dans le navigateur (FullCalendar via CDN).

## API principales
- `GET /api/calendar/events?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `POST /api/calendar/events` { title, start_date, end_date?, category_code?, all_day?, meta? }
- `POST /api/calendar/events/:id/auto-checklist` → crée les tâches (idées, tests, shooting, com', déco, brief, J-2, J)
- `GET /api/calendar/events/:id/tasks`
- `POST /api/calendar/tasks/:task_id` { status?, owner? }
- `POST /api/calendar/seed` { year } → préremplit Jours fériés FR + Thématiques (Noël, Pâques, Chandeleur, Octobre Rose, Halloween, Fête des Mères/Pères, etc.)

## Catégories par défaut
- `ferie` (rouge), `thematique` (orange). Vous pouvez ajouter `marketing`, `production` à la volée.
