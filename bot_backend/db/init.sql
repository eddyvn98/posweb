CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  updated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (instead of profiles + auth.users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  shop_id TEXT REFERENCES shops(id),
  email TEXT UNIQUE,
  password TEXT,
  role TEXT CHECK (role IN ('owner', 'staff')) DEFAULT 'staff',
  telegram_id TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS & INVENTORY
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shop_id, barcode)
);

-- Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE, -- NULL for bulk imports
  change_amount INTEGER NOT NULL,
  current_stock INTEGER NOT NULL,
  type TEXT CHECK (type IN ('import', 'sale', 'adjustment', 'void')) NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- IMPORTS
CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  import_date TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  total_cost REAL NOT NULL DEFAULT 0,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- BACKUP LOGS
CREATE TABLE IF NOT EXISTS backup_logs (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('SUCCESS', 'FAILURE')) NOT NULL,
  file_name TEXT,
  file_size_bytes INTEGER,
  month TEXT,
  year INTEGER,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SALES
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES users(id),
  is_void BOOLEAN DEFAULT 0,
  void_reason TEXT,
  void_at DATETIME
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  product_name TEXT NOT NULL
);

-- CASHBOOK
CREATE TABLE IF NOT EXISTS cash_flows (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  type TEXT CHECK (type IN ('in', 'out')) NOT NULL,
  category TEXT DEFAULT 'sale',
  description TEXT,
  ref_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
