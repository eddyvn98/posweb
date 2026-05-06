const db = require('../../db/connection');
const { v4: uuidv4 } = require('uuid');
const { ensureShopInSqlite } = require('../../lib/sqliteSync');

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSupplier(raw = {}) {
  return {
    name: String(raw.name || '').trim(),
    phone: String(raw.phone || '').trim(),
    address: String(raw.address || '').trim(),
    tax_code: String(raw.tax_code || '').trim(),
    bank_account: String(raw.bank_account || '').trim(),
    bank_name: String(raw.bank_name || '').trim(),
    note: String(raw.note || '').trim(),
    opening_debt: toNumber(raw.opening_debt, 0),
  };
}

async function bulkUpsertSuppliers(req, res) {
  const { shop_id } = req.user;
  const rows = Array.isArray(req.body) ? req.body : [];

  if (rows.length === 0) {
    return res.status(400).json({ error: 'Payload must be a non-empty array' });
  }
  if (rows.length > 2000) {
    return res.status(400).json({ error: 'Too many rows. Max 2000 per request' });
  }

  try {
    await ensureShopInSqlite(shop_id);

    const selectByName = db.prepare(`
      SELECT id FROM suppliers
      WHERE shop_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?))
      LIMIT 1
    `);
    const insertStmt = db.prepare(`
      INSERT INTO suppliers (
        id, shop_id, name, phone, address, tax_code, bank_account, bank_name, note, opening_debt, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    const updateStmt = db.prepare(`
      UPDATE suppliers SET
        phone = ?,
        address = ?,
        tax_code = ?,
        bank_account = ?,
        bank_name = ?,
        note = ?,
        opening_debt = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND shop_id = ?
    `);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    const run = db.transaction(() => {
      rows.forEach((raw, index) => {
        const rowNo = index + 1;
        const item = normalizeSupplier(raw);
        if (!item.name) {
          skipped += 1;
          errors.push({ row: rowNo, reason: 'Missing supplier name' });
          return;
        }

        const existing = selectByName.get(shop_id, item.name);
        if (existing?.id) {
          updateStmt.run(
            item.phone || null,
            item.address || null,
            item.tax_code || null,
            item.bank_account || null,
            item.bank_name || null,
            item.note || null,
            item.opening_debt,
            existing.id,
            shop_id
          );
          updated += 1;
        } else {
          insertStmt.run(
            uuidv4(),
            shop_id,
            item.name,
            item.phone || null,
            item.address || null,
            item.tax_code || null,
            item.bank_account || null,
            item.bank_name || null,
            item.note || null,
            item.opening_debt
          );
          created += 1;
        }
      });
    });

    run();

    return res.json({
      success: true,
      total: rows.length,
      created,
      updated,
      skipped,
      errors: errors.slice(0, 100),
    });
  } catch (error) {
    console.error('Bulk Upsert Suppliers Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = bulkUpsertSuppliers;
