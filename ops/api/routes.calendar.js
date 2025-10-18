import dayjs from 'dayjs';

export default function installCalendarRoutes(app, db){
  // --- List events (range optional)
  app.get('/api/calendar/events', (req, res) => {
    const { start, end } = req.query; // YYYY-MM-DD
    let q = `SELECT ce.*, cc.label as category_label, cc.color as category_color
             FROM calendar_events ce
             LEFT JOIN calendar_categories cc ON cc.id = ce.category_id`;
    const args = [];
    if (start && end){
      q += ` WHERE date(ce.start_date) <= date(?) AND (ce.end_date IS NULL OR date(ce.end_date) >= date(?))`;
      args.push(end, start);
    }
    q += ` ORDER BY ce.start_date ASC`;
    res.json(db.prepare(q).all(...args));
  });

  // --- Create event
  app.post('/api/calendar/events', (req, res) => {
    const { title, start_date, end_date, all_day = 1, category_code, meta } = req.body;
    let category_id = null;
    if (category_code){
      const row = db.prepare('SELECT id FROM calendar_categories WHERE code=?').get(category_code);
      if (row) category_id = row.id;
    }
    const info = db.prepare(`
      INSERT INTO calendar_events (title, start_date, end_date, all_day, category_id, meta)
      VALUES (?,?,?,?,?,json(?))
    `).run(title, start_date, end_date || null, all_day ? 1 : 0, category_id, meta ? JSON.stringify(meta) : null);
    res.status(201).json({ id: info.lastInsertRowid });
  });

  // --- Add checklist/tasks for event (auto-template)
  app.post('/api/calendar/events/:id/auto-checklist', (req,res) => {
    const id = +req.params.id;
    const ev = db.prepare('SELECT * FROM calendar_events WHERE id=?').get(id);
    if (!ev) return res.status(404).json({error:'event not found'});

    const anchor = dayjs(ev.start_date);
    const plan = [
      { title: "Idées & thèmes", offset: -30 },
      { title: "Tests produits & recette", offset: -21 },
      { title: "Shooting photo / visuels", offset: -14 },
      { title: "Plan com' & réseaux sociaux", offset: -10 },
      { title: "Décos boutique prêtes", offset: -7 },
      { title: "Brief équipes vente", offset: -5 },
      { title: "Prépa J-2 (quantités définitives)", offset: -2 },
      { title: "Jour J – Lancement", offset: 0 }
    ];

    const stmt = db.prepare(`
      INSERT INTO calendar_event_tasks (event_id, title, due_date, status, owner)
      VALUES (?,?,?,?,NULL)
    `);
    let count = 0;
    for (const t of plan){
      const due = anchor.add(t.offset, 'day').format('YYYY-MM-DD');
      stmt.run(id, t.title, due, 'todo');
      count++;
    }
    res.json({ ok: true, created: count });
  });

  // --- List tasks for an event
  app.get('/api/calendar/events/:id/tasks', (req,res) => {
    const rows = db.prepare(`
      SELECT id, title, due_date, status, owner FROM calendar_event_tasks
      WHERE event_id=? ORDER BY due_date ASC
    `).all(+req.params.id);
    res.json(rows);
  });

  // --- Update task status/owner
  app.post('/api/calendar/tasks/:task_id', (req,res) => {
    const { status, owner } = req.body;
    const id = +req.params.task_id;
    const row = db.prepare('SELECT * FROM calendar_event_tasks WHERE id=?').get(id);
    if (!row) return res.status(404).json({error:'task not found'});
    db.prepare('UPDATE calendar_event_tasks SET status=COALESCE(?, status), owner=COALESCE(?, owner) WHERE id=?')
      .run(status || null, owner || null, id);
    res.json({ ok: true });
  });

  // --- Seed French holidays + thematics (Noël, Halloween, etc.) for a year
  app.post('/api/calendar/seed', (req,res) => {
    const { year } = req.body;
    const y = Number(year) || (new Date()).getFullYear();
    const easter = computeEaster(y); // returns JS Date
    // FR holidays
    const holidays = [
      { title: "Jour de l'An", date: `${y}-01-01` },
      { title: "Lundi de Pâques", date: addDays(easter, 1) },
      { title: "Fête du Travail", date: `${y}-05-01` },
      { title: "Victoire 1945", date: `${y}-05-08` },
      { title: "Jeudi de l'Ascension", date: addDays(easter, 39) },
      { title: "Lundi de Pentecôte", date: addDays(easter, 50) },
      { title: "Fête Nationale", date: `${y}-07-14` },
      { title: "Assomption", date: `${y}-08-15` },
      { title: "Toussaint", date: `${y}-11-01` },
      { title: "Armistice 1918", date: `${y}-11-11` },
      { title: "Noël", date: `${y}-12-25` }
    ];

    const themes = [
      { title: "Chandeleur", date: `${y}-02-02` },
      { title: "Saint-Valentin", date: `${y}-02-14` },
      { title: "Pâques", date: toISO(easter) },
      { title: "Fête des Mères (FR)", date: lastSundayOfMayOrFirstJune(y) },
      { title: "Fête des Pères (FR)", date: thirdSundayOfJune(y) },
      { title: "Rentrée Scolaire", date: `${y}-09-02` },
      { title: "Octobre Rose", date: `${y}-10-01`, end: `${y}-10-31` },
      { title: "Halloween", date: `${y}-10-31` },
      { title: "Black Friday", date: blackFriday(y) },
      { title: "Épiphanie", date: `${y}-01-06` },
    ];

    const ensureCat = app.locals.ensureCategory;
    const ferieId = ensureCat('ferie', 'Jours fériés', '#F44336');
    const themId  = ensureCat('thematique', 'Événements thématiques', '#FF9800');

    const insertEv = db.prepare(`
      INSERT INTO calendar_events (title, start_date, end_date, all_day, category_id, meta)
      VALUES (?,?,?,?,?,json(?))
    `);
    let created = 0;
    for (const h of holidays){
      insertEv.run(h.title, h.date, null, 1, ferieId, JSON.stringify({ tag: 'ferie' }));
      created++;
    }
    for (const t of themes){
      insertEv.run(t.title, t.date, t.end || null, 1, themId, JSON.stringify({ tag: 'theme' }));
      created++;
    }
    res.json({ ok:true, created, year: y });
  });

  // Helpers
  app.locals.ensureCategory = (code, label, color) => {
    const r = db.prepare('SELECT id FROM calendar_categories WHERE code=?').get(code);
    if (r) return r.id;
    const info = db.prepare('INSERT INTO calendar_categories (code, label, color) VALUES (?,?,?)').run(code, label, color);
    return info.lastInsertRowid;
  };

  function toISO(d){
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function addDays(dateObj, n){
    const d = new Date(dateObj.getTime());
    d.setDate(d.getDate()+n);
    return toISO(d);
  }
  function computeEaster(y){ // Meeus/Jones/Butcher
    const a = y % 19;
    const b = Math.floor(y/100); const c = y % 100;
    const d = Math.floor(b/4); const e = b % 4;
    const f = Math.floor((b+8)/25);
    const g = Math.floor((b - f + 1)/3);
    const h = (19*a + b - d - g + 15) % 30;
    const i = Math.floor(c/4); const k = c % 4;
    const l = (32 + 2*e + 2*i - h - k) % 7;
    const m = Math.floor((a + 11*h + 22*l) / 451);
    const month = Math.floor((h + l - 7*m + 114) / 31);
    const day = ((h + l - 7*m + 114) % 31) + 1;
    return new Date(Date.UTC(y, month-1, day));
  }
  function lastSundayOfMayOrFirstJune(y){
    // Fête des mères en France : dernier dimanche de mai, sauf si c'est la Pentecôte -> premier dimanche de juin
    const pentecost = computeEaster(y); pentecost.setUTCDate(pentecost.getUTCDate()+49);
    const isPentecostSunday = (d)=> d.toISOString().slice(0,10) == pentecost.toISOString().slice(0,10);
    // Last Sunday of May
    const d = new Date(Date.UTC(y, 4+1, 0)); // last day of May
    while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate()-1);
    if (isPentecostSunday(d)){
      const j = new Date(Date.UTC(y,5,1));
      while (j.getUTCDay() !== 0) j.setUTCDate(j.getUTCDate()+1);
      return j.toISOString().slice(0,10);
    }
    return d.toISOString().slice(0,10);
  }
  function thirdSundayOfJune(y){
    const d = new Date(Date.UTC(y,5,1));
    let cnt = 0;
    while (true){
      if (d.getUTCDay()===0) cnt++;
      if (cnt===3) return d.toISOString().slice(0,10);
      d.setUTCDate(d.getUTCDate()+1);
    }
  }
  function blackFriday(y){
    // 4th Friday of November (commercial, utile pour com')
    const d = new Date(Date.UTC(y,10,1));
    let fridayCount=0;
    while (true){
      if (d.getUTCDay()===5) fridayCount++;
      if (fridayCount===4) return d.toISOString().slice(0,10);
      d.setUTCDate(d.getUTCDate()+1);
    }
  }
}
