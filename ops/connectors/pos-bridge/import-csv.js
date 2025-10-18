// Usage: node connectors/pos-bridge/import-csv.js ventes.csv
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../../api/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node connectors/pos-bridge/import-csv.js ventes.csv');
  process.exit(1);
}

const content = fs.readFileSync(csvPath, 'utf-8').trim().split(/\r?\n/);
// attendu: product_sku,qty,date(YYYY-MM-DD)
const header = content.shift();
const idx = header.split(',').map(h=>h.trim());
const SKU = idx.indexOf('product_sku');
const QTY = idx.indexOf('qty');
const DATE = idx.indexOf('date');

const getProductId = db.prepare('SELECT id FROM products WHERE sku=?');
const insertMove = db.prepare(`INSERT INTO stock_movements (kind, scope, item_id, qty, reason, ref_date) VALUES ('out','finished',?,?,?,?,?)`);

let count = 0;
for (const line of content) {
  const cols = line.split(',').map(x=>x.trim());
  const sku = cols[SKU], qty = Number(cols[QTY]), date = cols[DATE];
  const row = getProductId.get(sku);
  if (!row) { console.warn('SKU inconnu, ignore:', sku); continue; }
  insertMove.run(row.id, qty, 'vente (POS)', date);
  count++;
}
console.log('Import ventes => mouvements sortants OK:', count);
