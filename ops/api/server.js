import express from 'express';
import cors from 'cors';
import dayjs from 'dayjs';
import 'dotenv/config';
import { db } from './db.js';
import installCalendarRoutes from './routes.calendar.js';

const app = express();
app.use(cors());
app.use(express.json());

// ---- Utils
function iso(d) { return dayjs(d || new Date()).format('YYYY-MM-DD'); }

// ---- Orders
app.get('/api/orders', (req, res) => {
  const { date, shop_id } = req.query;
  let q = `SELECT * FROM orders WHERE 1=1`;
  const args = [];
  if (date)    { q += ` AND date=?`; args.push(date); }
  if (shop_id) { q += ` AND shop_id=?`; args.push(+shop_id); }
  q += ` ORDER BY id DESC`;
  res.json(db.prepare(q).all(...args));
});

app.post('/api/orders', (req, res) => {
  const { shop_id, date, items=[] } = req.body;
  const info = db.prepare(`INSERT INTO orders (shop_id, date, status) VALUES (?, ?, 'submitted')`).run(shop_id, date);
  const stmt = db.prepare(`INSERT INTO order_items (order_id, product_id, quantity) VALUES (?,?,?)`);
  for (const it of items) stmt.run(info.lastInsertRowid, it.product_id, it.quantity);
  res.status(201).json({ id: info.lastInsertRowid });
});

app.post('/api/orders/:id/validate', (req,res) => {
  const id = +req.params.id;
  db.prepare(`UPDATE orders SET status='validated', updated_at=datetime('now') WHERE id=?`).run(id);
  res.json({ ok:true, id });
});

// ---- Production aggregate
app.get('/api/production/aggregate', (req,res) => {
  const { date, shop_id } = req.query;
  const args = [date];
  let q = `
    SELECT p.id as product_id, p.name, SUM(oi.quantity) as qty
    FROM orders o
    JOIN order_items oi ON oi.order_id=o.id
    JOIN products p ON p.id=oi.product_id
    WHERE o.date=?`;
  if (shop_id) { q += ` AND o.shop_id=?`; args.push(+shop_id); }
  q += ` GROUP BY p.id, p.name ORDER BY p.name`;
  res.json(db.prepare(q).all(...args));
});

// ---- Stocks
app.post('/api/stocks/move', (req,res) => {
  const { kind, scope, item_id, qty, reason, ref_date } = req.body;
  const info = db.prepare(`
    INSERT INTO stock_movements (kind, scope, item_id, qty, reason, ref_date)
    VALUES (?,?,?,?,?,?)
  `).run(kind, scope, item_id, qty, reason || null, ref_date || iso());
  res.status(201).json({ id: info.lastInsertRowid });
});

app.get('/api/stocks/level', (req,res) => {
  const { scope='finished', item_id } = req.query;
  let q = `SELECT
      SUM(CASE WHEN kind='in'  THEN qty ELSE 0 END) -
      SUM(CASE WHEN kind='out' THEN qty ELSE 0 END) AS level
    FROM stock_movements WHERE scope=?`;
  const args = [scope];
  if (item_id) { q += ` AND item_id=?`; args.push(+item_id); }
  const row = db.prepare(q).get(...args) || { level: 0 };
  res.json({ level: Number(row.level || 0) });
});

// ---- Losses & returns
app.post('/api/losses', (req,res) => {
  const { shop_id, product_id, qty, reason, loss_date } = req.body;
  const info = db.prepare(`INSERT INTO losses (shop_id, product_id, qty, reason, loss_date) VALUES (?,?,?,?,?)`)
    .run(shop_id, product_id, qty, reason||null, loss_date || iso());
  // stock out
  db.prepare(`INSERT INTO stock_movements (kind, scope, item_id, qty, reason, ref_date) VALUES ('out','finished',?,?,?,?)`)
    .run(product_id, qty, 'perte', loss_date || iso());
  res.status(201).json({ id: info.lastInsertRowid });
});

app.post('/api/returns', (req,res) => {
  const { shop_id, product_id, qty, return_date } = req.body;
  const info = db.prepare(`INSERT INTO returns (shop_id, product_id, qty, return_date) VALUES (?,?,?,?)`)
    .run(shop_id, product_id, qty, return_date || iso());
  // stock in
  db.prepare(`INSERT INTO stock_movements (kind, scope, item_id, qty, reason, ref_date) VALUES ('in','finished',?,?,?,?)`)
    .run(product_id, qty, 'retour', return_date || iso());
  res.status(201).json({ id: info.lastInsertRowid });
});

// ---- Metrics
app.get('/api/metrics', (req,res) => {
  const { start, end } = req.query;
  const produced = db.prepare(`
    SELECT IFNULL(SUM(oi.quantity),0) AS qty
    FROM orders o JOIN order_items oi ON oi.order_id=o.id
    WHERE o.date BETWEEN ? AND ?
  `).get(start, end).qty || 0;

  const losses = db.prepare(`
    SELECT IFNULL(SUM(qty),0) AS qty FROM losses
    WHERE loss_date BETWEEN ? AND ?
  `).get(start, end).qty || 0;

  const loss_rate = produced ? Number((losses/produced)*100).toFixed(1) : 0;
  res.json({ produced_qty: Number(produced), loss_qty: Number(losses), loss_rate });
});

// ---- Calendar routes
installCalendarRoutes(app, db);

// ---- Static
app.use('/', express.static('../web/public'));

const port = process.env.PORT || 5050;
app.listen(port, () => console.log('EF OPS API ready on :' + port));
