import fs from 'fs';
import 'dotenv/config';
import { db } from './db.js';

const cmd = process.argv[2];

if (cmd === 'migrate') {
  const schema = fs.readFileSync('./schema.sql', 'utf-8');
  db.exec(schema);
  console.log('Migration OK');
} else if (cmd === 'seed') {
  const seed = fs.readFileSync('./seed.sql', 'utf-8');
  db.exec(seed);
  console.log('Seed OK');
} else {
  console.log('Usage: node db.js [migrate|seed]');
}
