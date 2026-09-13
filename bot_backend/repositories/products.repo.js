const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');
const Product = require('../mongo/models/Product');

const sqliteRepo = {
  async getProducts(shop_id) {
    return db.prepare('SELECT * FROM products WHERE shop_id = ? AND is_active = 1 ORDER BY name ASC').all(shop_id);
  },
  async upsertProduct(shop_id, product) {
    const existingById = product.id
      ? db.prepare('SELECT id, barcode FROM products WHERE id = ? AND shop_id = ?').get(product.id, shop_id)
      : null;

    if (existingById) {
      if (product.barcode && product.barcode !== existingById.barcode) {
        db.prepare('DELETE FROM products WHERE shop_id = ? AND barcode = ? AND id != ?')
          .run(shop_id, String(product.barcode).trim(), product.id);
      }
      db.prepare(`
        UPDATE products SET
          barcode = @barcode,
          name = @name,
          unit = @unit,
          category = @category,
          price = @price,
          online_price = @online_price,
          promo_price = @promo_price,
          cost_price = @cost_price,
          stock_quantity = @stock_quantity,
          image_url = @image_url,
          is_active = @is_active
        WHERE id = @id AND shop_id = @shop_id
      `).run({
        ...product,
        barcode: String(product.barcode || '').trim(),
        unit: product.unit || 'Cai',
        category: product.category || null,
        shop_id,
        price: Number(product.price || 0),
        online_price: product.online_price === null || product.online_price === '' || product.online_price === undefined
          ? null
          : Number(product.online_price || 0),
        promo_price: product.promo_price === null || product.promo_price === '' || product.promo_price === undefined
          ? null
          : Number(product.promo_price || 0),
        cost_price: Number(product.cost_price || 0),
        stock_quantity: Number(product.stock_quantity || 0),
        image_url: product.image_url || null,
        is_active: product.is_active ? 1 : 0,
      });
      return { success: true };
    }

    const stmt = db.prepare(`
      INSERT INTO products (id, shop_id, barcode, name, unit, category, price, online_price, promo_price, cost_price, stock_quantity, image_url, is_active)
      VALUES (@id, @shop_id, @barcode, @name, @unit, @category, @price, @online_price, @promo_price, @cost_price, @stock_quantity, @image_url, @is_active)
      ON CONFLICT(shop_id, barcode) DO UPDATE SET
        name = excluded.name,
        unit = excluded.unit,
        category = excluded.category,
        price = excluded.price,
        online_price = excluded.online_price,
        promo_price = excluded.promo_price,
        cost_price = excluded.cost_price,
        stock_quantity = excluded.stock_quantity,
        image_url = excluded.image_url,
        is_active = excluded.is_active
    `);

    stmt.run({
      ...product,
      unit: product.unit || 'Cai',
      category: product.category || null,
      shop_id,
      price: Number(product.price || 0),
      online_price: product.online_price === null || product.online_price === '' || product.online_price === undefined
        ? null
        : Number(product.online_price || 0),
      promo_price: product.promo_price === null || product.promo_price === '' || product.promo_price === undefined
        ? null
        : Number(product.promo_price || 0),
      cost_price: Number(product.cost_price || 0),
      stock_quantity: Number(product.stock_quantity || 0),
      image_url: product.image_url || null,
      is_active: product.is_active ? 1 : 0,
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
};

const mongoRepo = {
  async getProducts(shop_id) {
    return Product.find({ shop_id, is_active: true }).sort({ name: 1 }).lean();
  },
  async upsertProduct(shop_id, product) {
    const payload = {
      id: product.id,
      shop_id,
      barcode: product.barcode,
      name: product.name,
      unit: product.unit || 'Cai',
      category: product.category || '',
      price: Number(product.price || 0),
      online_price: product.online_price === null || product.online_price === '' || product.online_price === undefined
        ? null
        : Number(product.online_price || 0),
      promo_price: product.promo_price === null || product.promo_price === '' || product.promo_price === undefined
        ? null
        : Number(product.promo_price || 0),
      cost_price: Number(product.cost_price || 0),
      stock_quantity: Number(product.stock_quantity || 0),
      image_url: product.image_url || null,
      is_active: !!product.is_active,
    };

    await Product.updateOne(
      { shop_id, barcode: payload.barcode },
      { $set: payload, $setOnInsert: { created_at: new Date() } },
      { upsert: true }
    );

    return { success: true };
  },
  async softDeleteProduct(shop_id, id) {
    const result = await Product.updateOne({ id, shop_id }, { $set: { is_active: false } });
    return result.modifiedCount > 0;
  },
  async getProductById(id) {
    return Product.findOne({ id }).lean();
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
};

function getProductsRepo() {
  const provider = getDbProvider();
  if (provider === 'mongo') return mongoRepo;
  if (provider === 'dual') return dualRepo;
  return sqliteRepo;
}

module.exports = { getProductsRepo };
