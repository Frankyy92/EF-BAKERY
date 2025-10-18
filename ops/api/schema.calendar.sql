-- CALENDAR (événements & catégories)
CREATE TABLE IF NOT EXISTS calendar_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,             -- ex: 'marketing', 'production', 'ferie', 'thematique'
  label TEXT NOT NULL,
  color TEXT DEFAULT '#377dff'
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,              -- ISO YYYY-MM-DD
  end_date TEXT,                         -- optionnel (jour exclusif si utilisé en mode plage)
  all_day INTEGER NOT NULL DEFAULT 1,    -- 1 = true
  category_id INTEGER REFERENCES calendar_categories(id),
  meta JSON                               -- JSON libre (lieu, notes, tags)
);

-- Tâches/milestones liées à un événement (ex: idées, tests, shootings, com', déco)
CREATE TABLE IF NOT EXISTS calendar_event_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER REFERENCES calendar_events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,                -- ISO YYYY-MM-DD
  status TEXT CHECK(status IN ('todo','doing','done')) NOT NULL DEFAULT 'todo',
  owner TEXT                             -- email/nom de la personne
);
