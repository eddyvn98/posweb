const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');
const { getTenantModel } = require('../db/tenantManager');
const ProductSchema = require('../mongo/models/Product');

const sqliteRepo = {
  async getProducts(shop_id) {
    return db.prepare('SELECT * FROM products WHERE shop_id = ? AND is_active = 1 ORDER BY name ASC').all(shop_id);
  },
  async upsertProduct(shop_id, product) {
    const normalizedBarcode = String(product.barcode || '').trim();
    let stableId = product.id;

    if (normalizedBarcode) {
      const existingByBarcode = db
        .prepare('SELECT id FROM products WHERE shop_id = ? AND barcode = ? LIMIT 1')
        .get(shop_id, normalizedBarcode);
      if (existingByBarcode?.id) {
        stableId = existingByBarcode.id;
      }
    }

    const stmt = db.prepare(`
      INSERT INTO products (id, shop_id, barcode, name, unit, category, price, cost_price, stock_quantity, image_url, is_active, parent_id, attributes)
      VALUES (@id, @shop_id, @barcode, @name, @unit, @category, @price, @cost_price, @stock_quantity, @image_url, @is_active, @parent_id, @attributes)
      ON CONFLICT(id) DO UPDATE SET
        barcode = excluded.barcode,
        name = excluded.name,
        unit = excluded.unit,
        category = excluded.category,
        price = excluded.price,
        cost_price = excluded.cost_price,
        stock_quantity = excluded.stock_quantity,
        image_url = excluded.image_url,
        is_active = excluded.is_active,
        parent_id = excluded.parent_id,
        attributes = excluded.attributes
    `);

    stmt.run({
      ...product,
      id: stableId,
      barcode: normalizedBarcode,
      unit: product.unit || 'Cai',
      category: product.category || null,
      shop_id,
      price: Number(product.price || 0),
      cost_price: Number(product.cost_price || 0),
      stock_quantity: Number(product.stock_quantity || 0),
      image_url: product.image_url || null,
      is_active: product.is_active ? 1 : 0,
      parent_id: product.parent_id || null,
      attributes: typeof product.attributes === 'object' ? JSON.stringify(product.attributes) : (product.attributes || '{}'),
    });

    return { success: true };
  },
  async softDeleteProduct(shop_id, id) {
    const result = db.prepare('UPDATE products SET is_active = 0 WHERE id = ? AND shop_id = ?').run(id, shop_id);
    return result.changes > 0;
  },
  async getProductById(id) {
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id) || null;
  },
  async bulkUpsert(shop_id, products) {
    const stmt = db.prepare(`
      INSERT INTO products (id, shop_id, barcode, name, unit, category, price, cost_price, stock_quantity, image_url, is_active, parent_id, attributes)
      VALUES (@id, @shop_id, @barcode, @name, @unit, @category, @price, @cost_price, @stock_quantity, @image_url, @is_active, @parent_id, @attributes)
      ON CONFLICT(id) DO UPDATE SET
        barcode = excluded.barcode,
        name = excluded.name,
        unit = excluded.unit,
        category = excluded.category,
        price = excluded.price,
        cost_price = excluded.cost_price,
        stock_quantity = excluded.stock_quantity,
        image_url = excluded.image_url,
        is_active = excluded.is_active,
        parent_id = excluded.parent_id,
        attributes = excluded.attributes
    `);

    const transaction = db.transaction((items) => {
      for (const product of items) {
        stmt.run({
          ...product,
          unit: product.unit || 'Cai',
          category: product.category || null,
          shop_id,
          price: Number(product.price || 0),
          cost_price: Number(product.cost_price || 0),
          stock_quantity: Number(product.stock_quantity || 0),
          image_url: product.image_url || null,
          is_active: product.is_active !== false ? 1 : 0,
          parent_id: product.parent_id || null,
          attributes: typeof product.attributes === 'object' ? JSON.stringify(product.attributes) : (product.attributes || '{}'),
        });
      }
    });

    transaction(products);
    return { success: true, count: products.length };
  },
};

const mongoRepo = {
  async getProducts(shop_id) {
    const Product = getTenantModel(shop_id, 'Product', ProductSchema);
    return Product.find({ shop_id, is_active: true }).sort({ name: 1 }).lean();
  },
  async upsertProduct(shop_id, product) {
    const Product = getTenantModel(shop_id, 'Product', ProductSchema);
    const normalizedBarcode = String(product.barcode || '').trim();
    let stableId = product.id;

    if (normalizedBarcode) {
      const existingByBarcode = await Product.findOne(
        { shop_id, barcode: normalizedBarcode },
        { id: 1, _id: 0 }
      ).lean();
      if (existingByBarcode?.id) {
        stableId = existingByBarcode.id;
      }
    }

    const payload = {
      id: stableId,
      shop_id,
      barcode: normalizedBarcode,
      name: product.name,
      unit: product.unit || 'Cai',
      category: product.category || '',
      price: Number(product.price || 0),
      cost_price: Number(product.cost_price || 0),
      stock_quantity: Number(product.stock_quantity || 0),
      image_url: product.image_url || null,
      is_active: !!product.is_active,
      parent_id: product.parent_id || null,
      attributes: product.attributes || {},
    };

    const orFilters = [];
    if (payload.id) orFilters.push({ id: payload.id });
    if (normalizedBarcode) orFilters.push({ shop_id, barcode: normalizedBarcode });
    const upsertFilter = orFilters.length > 0 ? { $or: orFilters } : { id: payload.id };

    await Product.updateOne(
      upsertFilter,
      { $set: payload, $setOnInsert: { created_at: new Date() } },
      { upsert: true }
    );

    return { success: true };
  },
  async softDeleteProduct(shop_id, id) {
    const Product = getTenantModel(shop_id, 'Product', ProductSchema);
    const result = await Product.updateOne({ id, shop_id }, { $set: { is_active: false } });
    return result.modifiedCount > 0;
  },
  async getProductById(id) {
    const Product = getTenantModel('main', 'Product', ProductSchema); // Fallback
    return Product.findOne({ id }).lean();
  },
  async bulkUpsert(shop_id, products) {
    const Product = getTenantModel(shop_id, 'Product', ProductSchema);
    const operations = products.map(product => {
      const payload = {
        id: product.id,
        shop_id,
        barcode: product.barcode,
        name: product.name,
        unit: product.unit || 'Cai',
        category: product.category || '',
        price: Number(product.price || 0),
        cost_price: Number(product.cost_price || 0),
        stock_quantity: Number(product.stock_quantity || 0),
        image_url: product.image_url || null,
        is_active: product.is_active !== false,
        parent_id: product.parent_id || null,
        attributes: product.attributes || {},
      };

      return {
        updateOne: {
          filter: { id: payload.id },
          update: { $set: payload, $setOnInsert: { created_at: new Date() } },
          upsert: true
        }
      };
    });

    await Product.bulkWrite(operations);
    return { success: true, count: products.length };
  },
};

const dualRepo = {
  ...mongoRepo,
  async upsertProduct(shop_id, product) {
    const result = await mongoRepo.upsertProduct(shop_id, product);
    try {
      await sqliteRepo.upsertProduct(shop_id, product);
    } catch (e) {
      console.error('[dual][products] sqlite write failed:', e.message);
    }
    return result;
  },
  async softDeleteProduct(shop_id, id) {
    const ok = await mongoRepo.softDeleteProduct(shop_id, id);
    try {
      await sqliteRepo.softDeleteProduct(shop_id, id);
    } catch (e) {
      console.error('[dual][products] sqlite write failed:', e.message);
    }
    return ok;
  },
  async bulkUpsert(shop_id, products) {
    const result = await mongoRepo.bulkUpsert(shop_id, products);
    try {
      await sqliteRepo.bulkUpsert(shop_id, products);
    } catch (e) {
      console.error('[dual][products] sqlite bulk write failed:', e.message);
    }
    return result;
  },
};

function getProductsRepo() {
  const provider = getDbProvider();
  if (provider === 'mongo') return mongoRepo;
  if (provider === 'dual') return dualRepo;
  return sqliteRepo;
}

module.exports = { getProductsRepo };
