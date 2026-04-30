require('dotenv').config();

const db = require('../db/connection');
const { connectMongo } = require('../db/mongo');

const Shop = require('../mongo/models/Shop');
const User = require('../mongo/models/User');
const Unit = require('../mongo/models/Unit');
const Category = require('../mongo/models/Category');
const Product = require('../mongo/models/Product');
const Sale = require('../mongo/models/Sale');
const SaleItem = require('../mongo/models/SaleItem');
const InventoryLog = require('../mongo/models/InventoryLog');
const CashFlow = require('../mongo/models/CashFlow');

function rows(query, params = []) {
  return db.prepare(query).all(...params);
}

async function upsertMany(model, docs) {
  if (!docs.length) return { upsertedCount: 0 };
  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { id: doc.id },
      update: { $set: doc },
      upsert: true,
    },
  }));
  return model.bulkWrite(ops, { ordered: false });
}

async function migrateCollection(name, model, query, mapFn) {
  const sourceRows = rows(query);
  const docs = sourceRows.map(mapFn);
  const result = await upsertMany(model, docs);
  const mongoCount = await model.countDocuments();
  console.log(`[migrate] ${name}: sqlite=${sourceRows.length}, mongo_total=${mongoCount}, upserted=${result.upsertedCount || 0}`);
}

async function migrateImportsRaw() {
  const sourceRows = rows('SELECT * FROM imports');
  const col = require('mongoose').connection.db.collection('imports');

  if (!sourceRows.length) {
    console.log(`[migrate] imports: sqlite=0, mongo_total=${await col.countDocuments()}, upserted=0`);
    return;
  }

  const ops = sourceRows.map((r) => ({
    updateOne: {
      filter: { id: r.id },
      update: {
        $set: {
          id: r.id,
          shop_id: r.shop_id,
          import_date: r.import_date,
          supplier_name: r.supplier_name,
          total_cost: Number(r.total_cost || 0),
          note: r.note || null,
          created_at: r.created_at ? new Date(r.created_at) : new Date(),
        },
      },
      upsert: true,
    },
  }));

  const result = await col.bulkWrite(ops, { ordered: false });
  const mongoCount = await col.countDocuments();
  console.log(`[migrate] imports: sqlite=${sourceRows.length}, mongo_total=${mongoCount}, upserted=${result.upsertedCount || 0}`);
}

(async () => {
  try {
    await connectMongo();

    await migrateCollection('shops', Shop, 'SELECT * FROM shops', (r) => ({
      id: r.id,
      name: r.name,
      address: r.address || null,
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      updated_at: r.updated_at ? new Date(r.updated_at) : null,
    }));

    await migrateCollection('users', User, 'SELECT * FROM users', (r) => ({
      id: r.id,
      shop_id: r.shop_id,
      email: r.email,
      password: r.password || null,
      role: r.role,
      telegram_id: r.telegram_id || null,
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      updated_at: null,
    }));

    await migrateCollection('units', Unit, 'SELECT * FROM units', (r) => ({
      id: r.id,
      shop_id: r.shop_id,
      name: r.name,
      is_active: !!r.is_active,
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      updated_at: r.updated_at ? new Date(r.updated_at) : null,
    }));

    await migrateCollection('categories', Category, 'SELECT * FROM categories', (r) => ({
      id: r.id,
      shop_id: r.shop_id,
      name: r.name,
      is_active: !!r.is_active,
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      updated_at: r.updated_at ? new Date(r.updated_at) : null,
    }));

    await migrateCollection('products', Product, 'SELECT * FROM products', (r) => ({
      id: r.id,
      shop_id: r.shop_id,
      barcode: r.barcode,
      name: r.name,
      unit: r.unit || 'Cai',
      category: r.category || '',
      price: Number(r.price || 0),
      cost_price: Number(r.cost_price || 0),
      stock_quantity: Number(r.stock_quantity || 0),
      image_url: r.image_url || null,
      is_active: !!r.is_active,
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      updated_at: null,
    }));

    await migrateCollection('sales', Sale, 'SELECT * FROM sales', (r) => ({
      id: r.id,
      shop_id: r.shop_id,
      code: r.code,
      total_amount: Number(r.total_amount || 0),
      payment_method: r.payment_method || 'cash',
      sale_date: r.sale_date ? new Date(r.sale_date) : new Date(),
      created_by: r.created_by || null,
      is_void: !!r.is_void,
      void_reason: r.void_reason || null,
      void_at: r.void_at ? new Date(r.void_at) : null,
      created_at: r.sale_date ? new Date(r.sale_date) : new Date(),
      updated_at: null,
    }));

    await migrateCollection('sale_items', SaleItem, 'SELECT * FROM sale_items', (r) => ({
      id: r.id,
      sale_id: r.sale_id,
      product_id: r.product_id || null,
      quantity: Number(r.quantity || 0),
      price: Number(r.price || 0),
      product_name: r.product_name || '',
      created_at: new Date(),
      updated_at: null,
    }));

    await migrateCollection('inventory_logs', InventoryLog, 'SELECT * FROM inventory_logs', (r) => ({
      id: r.id,
      shop_id: r.shop_id,
      product_id: r.product_id || null,
      change_amount: Number(r.change_amount || 0),
      current_stock: Number(r.current_stock || 0),
      type: r.type,
      note: r.note || null,
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      updated_at: null,
    }));

    await migrateCollection('cash_flows', CashFlow, 'SELECT * FROM cash_flows', (r) => ({
      id: r.id,
      shop_id: r.shop_id,
      amount: Number(r.amount || 0),
      type: r.type,
      category: r.category || 'sale',
      description: r.description || '',
      ref_id: r.ref_id || null,
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      updated_at: null,
    }));

    await migrateImportsRaw();

    console.log('[migrate] done');
    process.exit(0);
  } catch (error) {
    console.error('[migrate] failed:', error);
    process.exit(1);
  }
})();
