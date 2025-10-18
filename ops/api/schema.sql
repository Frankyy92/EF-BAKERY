PRAGMA foreign_keys = ON;

-- Boutiques / Utilisateurs
CREATE TABLE IF NOT EXISTS shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT,
  address TEXT
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK(role IN ('admin','labo','boutique')) NOT NULL DEFAULT 'boutique',
  password_hash TEXT NOT NULL
);

-- Matières premières / Produits finis
CREATE TABLE IF NOT EXISTS raw_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  category TEXT
);

-- Mouvements de stock (entrées/sorties)
CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT CHECK(kind IN ('in','out')) NOT NULL,
  scope TEXT CHECK(scope IN ('raw','finished')) NOT NULL,
  item_id INTEGER NOT NULL,
  qty REAL NOT NULL,
  reason TEXT,
  ref_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Commandes boutiques -> labo
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER REFERENCES shops(id),
  date TEXT NOT NULL,
  status TEXT CHECK(status IN ('draft','submitted','validated','delivered')) NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity REAL NOT NULL
);

-- Pertes & retours
CREATE TABLE IF NOT EXISTS losses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER REFERENCES shops(id),
  product_id INTEGER REFERENCES products(id),
  qty REAL NOT NULL,
  reason TEXT,
  loss_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER REFERENCES shops(id),
  product_id INTEGER REFERENCES products(id),
  qty REAL NOT NULL,
  return_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
