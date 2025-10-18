import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const DB_PATH = process.env.DB_PATH || './ef_ops.sqlite';
export const db = new Database(DB_PATH);

// Optional helper to execute an .sql file (used by scripts if needed)
export function execSQL(filePath) {
  const abs = path.resolve(filePath);
  const sql = fs.readFileSync(abs, 'utf-8');
  db.exec(sql);
}
