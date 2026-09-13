const db = require('../db/connection');
const { getPool, isPostgresConfigured } = require('../db/postgres');

const TABLES = [
  'shops',
  'users',
  'products',
  'units',
  'categories',
  'suppliers',
  'imports',
  'import_items',
  'sales',
  'sale_items',
  'inventory_logs',
  'cash_flows',
  'invite_codes',
];

let syncInProgress = false;

function getTableColumns(tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map((c) => c.name);
}

async function ensurePostgresSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      bank_name TEXT,
      bank_account_name TEXT,
      bank_account_number TEXT,
      bank_qr_url TEXT,
      feature_flags TEXT DEFAULT '{}',
      imports_sheet_id TEXT,
      imports_sheet_url TEXT,
      updated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      shop_id TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      telegram_id TEXT UNIQUE,
      created_at TIMESTAMPTZ,
      reset_password_token TEXT,
      reset_password_expires TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      shop_id TEXT,
      barcode TEXT,
      name TEXT,
      unit TEXT,
      category TEXT,
      price DOUBLE PRECISION,
      cost_price DOUBLE PRECISION,
      stock_quantity DOUBLE PRECISION,
      image_url TEXT,
      is_active BOOLEAN,
      created_at TIMESTAMPTZ,
      parent_id TEXT,
      attributes TEXT
    );

    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      shop_id TEXT,
      name TEXT,
      is_active BOOLEAN,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      shop_id TEXT,
      name TEXT,
      is_active BOOLEAN,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      shop_id TEXT,
      name TEXT,
      phone TEXT,
      address TEXT,
      tax_code TEXT,
      bank_account TEXT,
      bank_name TEXT,
      note TEXT,
      opening_debt DOUBLE PRECISION,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS imports (
      id TEXT PRIMARY KEY,
      shop_id TEXT,
      import_date TEXT,
      supplier_id TEXT,
      supplier_name TEXT,
      supplier_tax_code TEXT,
      invoice_number TEXT,
      invoice_date TEXT,
      invoice_type TEXT,
      payment_method TEXT,
      payment_date TEXT,
      paid_amount DOUBLE PRECISION,
      total_goods_amount DOUBLE PRECISION,
      total_vat_amount DOUBLE PRECISION,
      attachment_files TEXT,
      status TEXT,
      total_cost DOUBLE PRECISION,
      note TEXT,
      created_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS import_items (
      id TEXT PRIMARY KEY,
      import_id TEXT,
      product_id TEXT,
      product_name TEXT,
      quantity DOUBLE PRECISION,
      unit_price DOUBLE PRECISION,
      vat_amount DOUBLE PRECISION,
      total_amount DOUBLE PRECISION,
      created_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      shop_id TEXT,
      code TEXT,
      total_amount DOUBLE PRECISION,
      payment_method TEXT,
      sale_date TIMESTAMPTZ,
      created_by TEXT,
      is_void BOOLEAN,
      void_reason TEXT,
      void_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT,
      product_id TEXT,
      quantity DOUBLE PRECISION,
      price DOUBLE PRECISION,
      product_name TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id TEXT PRIMARY KEY,
      shop_id TEXT,
      product_id TEXT,
      change_amount DOUBLE PRECISION,
      current_stock DOUBLE PRECISION,
      type TEXT,
      note TEXT,
      created_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS cash_flows (
      id TEXT PRIMARY KEY,
      shop_id TEXT,
      amount DOUBLE PRECISION,
      type TEXT,
      category TEXT,
      supplier_id TEXT,
      payment_method TEXT,
      description TEXT,
      ref_id TEXT,
      created_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS invite_codes (
      id TEXT PRIMARY KEY,
      shop_id TEXT,
      code TEXT UNIQUE,
      role TEXT,
      created_by TEXT,
      used_by TEXT,
      is_used BOOLEAN,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ
    );
  `);
}

function toPgBoolean(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1') return true;
  if (value === 0 || value === '0') return false;
  return Boolean(value);
}

function normalizeValue(column, value) {
  if (value === undefined) return null;
  if (column === 'is_active' || column === 'is_void' || column === 'is_used') {
    return toPgBoolean(value);
  }
  return value;
}

async function upsertTable(client, tableName) {
  const columns = getTableColumns(tableName);
  if (!columns.includes('id')) return { table: tableName, rows: 0 };

  const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
  if (!rows.length) return { table: tableName, rows: 0 };

  const colSql = columns.join(', ');
  const updates = columns
    .filter((c) => c !== 'id')
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(', ');

  for (const row of rows) {
    const values = columns.map((c) => normalizeValue(c, row[c]));
    const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
    await client.query(
      `INSERT INTO ${tableName} (${colSql}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updates}`,
      values
    );
  }

  return { table: tableName, rows: rows.length };
}

async function syncSqliteToPostgres() {
  if (!isPostgresConfigured()) {
    return { skipped: true, reason: 'POSTGRES_URL is not configured' };
  }
  if (syncInProgress) {
    return { skipped: true, reason: 'sync already running' };
  }

  syncInProgress = true;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensurePostgresSchema(client);
    const summary = [];
    for (const tableName of TABLES) {
      summary.push(await upsertTable(client, tableName));
    }
    await client.query('COMMIT');
    return { skipped: false, summary };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    syncInProgress = false;
  }
}

module.exports = {
  syncSqliteToPostgres,
};
