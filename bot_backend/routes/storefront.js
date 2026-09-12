const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');
const { getProductsRepo } = require('../repositories/products.repo');

const router = express.Router();
const MAX_ITEMS = 50;
const VOUCHERS = {
  SAVE20K: { type: 'fixed', value: 20000, minSubtotal: 149000 },
  SHOP10: { type: 'percent', value: 10, maxDiscount: 30000, minSubtotal: 99000 },
  SAVE50K: { type: 'fixed', value: 50000, minSubtotal: 349000 },
};

function getStorefrontPricing(product) {
  const onlinePrice = Number(product.online_price);
  const offlinePrice = Number(product.price || 0);
  const originalPrice = onlinePrice > 0 ? onlinePrice : offlinePrice;
  const promoPrice = Number(product.promo_price);
  const hasPromotion = promoPrice > 0 && promoPrice < originalPrice;
  return {
    price: hasPromotion ? promoPrice : originalPrice,
    original_price: hasPromotion ? originalPrice : null,
  };
}

function getStorefrontPrice(product) {
  return getStorefrontPricing(product).price;
}

function calculateVoucherDiscount(voucher, subtotal) {
  if (!voucher || subtotal < Number(voucher.minSubtotal || 0)) return 0;
  if (voucher.type === 'percent') {
    return Math.min(Math.round(subtotal * Number(voucher.value || 0) / 100), Number(voucher.maxDiscount || Infinity));
  }
  return Math.min(Number(voucher.value || 0), subtotal);
}

function calculateShippingFee(shop, subtotal) {
  const fee = Number(shop?.shipping_fee || 0);
  const threshold = Number(shop?.free_shipping_threshold || 0);
  if (!fee || (threshold > 0 && subtotal >= threshold)) return 0;
  return fee;
}

function requireShopId(req, res) {
  const shopId = String(req.query.shop_id || req.body?.shop_id || '').trim();
  if (!shopId) {
    res.status(400).json({ error: 'Missing shop_id' });
    return null;
  }
  return shopId;
}

function requireCustomerToken(req, res) {
  const token = String(req.get('X-Customer-Token') || '').trim();
  if (token.length < 16 || token.length > 200) {
    res.status(400).json({ error: 'Missing or invalid customer token' });
    return null;
  }
  return token;
}

function publicProduct(product) {
  return {
    id: product.id,
    barcode: product.barcode,
    name: product.name,
    description: product.description || '',
    unit: product.unit,
    category: product.category,
    // Never expose the offline price as a second public price. Storefront
    // consumers only receive the effective online selling price.
    price: getStorefrontPrice(product),
    original_price: getStorefrontPricing(product).original_price,
    stock_quantity: Number(product.stock_quantity || 0),
    image_url: product.image_url || null,
  };
}

function validateOrder(body, shopId, customerToken) {
  const customer = body.customer || {};
  const address = body.address || {};
  const paymentMethod = body.payment_method || body.paymentMethod;
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (!customerToken || !shopId) return 'Missing order scope';
  if (!String(customer.name || '').trim() || !String(customer.phone || '').trim()) return 'Missing recipient information';
  if (!String(address.address || '').trim() || !String(address.city || '').trim()) return 'Missing delivery address';
  if (!['cod', 'bank_transfer'].includes(paymentMethod)) return 'Invalid payment method';
  if (!rawItems.length || rawItems.length > MAX_ITEMS) return 'Invalid order items';

  const items = rawItems.map((item) => ({
    productId: String(item.product_id || item.productId || '').trim(),
    quantity: Number(item.quantity),
  }));
  if (items.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999)) {
    return 'Invalid order items';
  }

  const quantities = new Map();
  for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  return { customer, address, paymentMethod, quantities };
}

function orderFromRow(row, items) {
  return {
    id: row.id,
    code: row.code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    paymentMethod: row.payment_method,
    note: row.note || '',
    customer: { name: row.customer_name, phone: row.customer_phone, email: row.customer_email || '' },
    address: { address: row.address, ward: row.ward || '', city: row.city },
    subtotal: Number(row.subtotal_amount || row.total_amount || 0),
    voucher: row.voucher_code ? { code: row.voucher_code, discount: Number(row.voucher_discount || 0) } : null,
    voucherDiscount: Number(row.voucher_discount || 0),
    shippingFee: Number(row.shipping_amount || 0),
    total: Number(row.total_amount || 0),
    synced: true,
    items: items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price: Number(item.price || 0),
      image_url: item.image_url || null,
    })),
  };
}

function publicShop(shop) {
  if (!shop) return null;
  return {
    name: shop.name,
    address: shop.address || '302 Vườn Lài, An Phú Đông, Quận 12, TP.HCM',
    phone: shop.phone || '',
    zalo_url: shop.zalo_url || '',
    opening_hours: shop.opening_hours || '',
    pickup_available: shop.pickup_available !== false && shop.pickup_available !== 0,
    delivery_note: shop.delivery_note || 'Giao quanh Quận 12 · Shop xác nhận phí theo khu vực',
    shipping_fee: Number(shop.shipping_fee || 0) || null,
    free_shipping_threshold: Number(shop.free_shipping_threshold || 0) || null,
    bank_name: shop.bank_name || '',
    bank_account: shop.bank_account || '',
    bank_owner: shop.bank_owner || '',
  };
}

function getOrder(shopId, customerToken, id) {
  const row = db.prepare('SELECT * FROM online_orders WHERE id = ? AND shop_id = ? AND customer_token = ?').get(id, shopId, customerToken);
  if (!row) return null;
  const items = db.prepare('SELECT product_id, product_name, quantity, price, image_url FROM online_order_items WHERE order_id = ? ORDER BY rowid ASC').all(id);
  return orderFromRow(row, items);
}

router.get('/products', async (req, res) => {
  const shopId = requireShopId(req, res);
  if (!shopId) return;
  try {
    const products = await getProductsRepo().getProducts(shopId);
    res.json(products.map(publicProduct));
  } catch (error) {
    console.error('Storefront catalog error:', error);
    res.status(500).json({ error: 'Unable to load catalog' });
  }
});

router.get('/shop', (req, res) => {
  const shopId = requireShopId(req, res);
  if (!shopId) return;
  const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId);
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  res.json(publicShop(shop));
});

router.get('/orders', async (req, res) => {
  if (getDbProvider() !== 'sqlite') return res.status(501).json({ error: 'Storefront orders require SQLite provider' });
  const shopId = requireShopId(req, res);
  const customerToken = requireCustomerToken(req, res);
  if (!shopId || !customerToken) return;
  try {
    const rows = db.prepare('SELECT * FROM online_orders WHERE shop_id = ? AND customer_token = ? ORDER BY created_at DESC').all(shopId, customerToken);
    const itemsByOrder = db.prepare('SELECT order_id, product_id, product_name, quantity, price, image_url FROM online_order_items WHERE order_id IN (SELECT id FROM online_orders WHERE shop_id = ? AND customer_token = ?) ORDER BY rowid ASC').all(shopId, customerToken);
    const grouped = new Map();
    itemsByOrder.forEach((item) => {
      if (!grouped.has(item.order_id)) grouped.set(item.order_id, []);
      grouped.get(item.order_id).push(item);
    });
    res.json(rows.map((row) => orderFromRow(row, grouped.get(row.id) || [])));
  } catch (error) {
    console.error('Storefront order list error:', error);
    res.status(500).json({ error: 'Unable to load orders' });
  }
});

router.get('/orders/:id', async (req, res) => {
  if (getDbProvider() !== 'sqlite') return res.status(501).json({ error: 'Storefront orders require SQLite provider' });
  const shopId = requireShopId(req, res);
  const customerToken = requireCustomerToken(req, res);
  if (!shopId || !customerToken) return;
  const order = getOrder(shopId, customerToken, req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

router.post('/orders', async (req, res) => {
  if (getDbProvider() !== 'sqlite') return res.status(501).json({ error: 'Storefront orders require SQLite provider' });
  const shopId = requireShopId(req, res);
  const customerToken = requireCustomerToken(req, res);
  if (!shopId || !customerToken) return;
  const validated = validateOrder(req.body, shopId, customerToken);
  if (typeof validated === 'string') return res.status(400).json({ error: validated });

  const { customer, address, paymentMethod, quantities } = validated;
  const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId);
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  const orderId = uuidv4();
  const saleId = uuidv4();
  const code = `ON${String(Date.now()).slice(-8)}`;
  const createdAt = new Date().toISOString();

  try {
    const order = db.transaction(() => {
      const products = [];
      for (const [productId, quantity] of quantities) {
        const product = db.prepare('SELECT id, name, price, online_price, promo_price, stock_quantity, image_url FROM products WHERE id = ? AND shop_id = ? AND is_active = 1').get(productId, shopId);
        if (!product) throw new Error('Product not found');
        if (Number(product.stock_quantity) < quantity) throw new Error(`Insufficient stock for ${product.name}`);
        products.push({ ...product, ...getStorefrontPricing(product), quantity });
      }

      const subtotal = products.reduce((sum, product) => sum + Number(product.price || 0) * product.quantity, 0);
      const voucherCode = String(req.body.voucher_code || '').trim().toUpperCase();
      const voucher = voucherCode ? VOUCHERS[voucherCode] : null;
      if (voucherCode && !voucher) throw new Error('Invalid voucher');
      const voucherDiscount = calculateVoucherDiscount(voucher, subtotal);
      if (voucherCode && !voucherDiscount) throw new Error('Voucher is not eligible for this order');
      const shippingAmount = calculateShippingFee(shop, subtotal);
      const total = Math.max(0, subtotal - voucherDiscount + shippingAmount);
      db.prepare('INSERT INTO sales (id, shop_id, code, total_amount, payment_method, sale_date, created_by) VALUES (?, ?, ?, ?, ?, ?, NULL)')
        .run(saleId, shopId, code, total, paymentMethod === 'bank_transfer' ? 'transfer' : 'cash', createdAt);
      db.prepare(`INSERT INTO online_orders
        (id, shop_id, sale_id, customer_token, code, customer_name, customer_phone, customer_email, address, ward, city, payment_method, status, note, subtotal_amount, voucher_code, voucher_discount, shipping_amount, total_amount, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_shipment', ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(orderId, shopId, saleId, customerToken, code, String(customer.name).trim(), String(customer.phone).trim(), String(customer.email || '').trim() || null, String(address.address).trim(), String(address.ward || '').trim() || null, String(address.city).trim(), paymentMethod, String(req.body.note || '').trim() || null, subtotal, voucherCode || null, voucherDiscount, shippingAmount, total, createdAt, createdAt);

      const insertItem = db.prepare('INSERT INTO online_order_items (id, order_id, product_id, product_name, quantity, price, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const insertSaleItem = db.prepare('INSERT INTO sale_items (id, sale_id, product_id, quantity, price, product_name) VALUES (?, ?, ?, ?, ?, ?)');
      const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND shop_id = ? AND stock_quantity >= ?');
      const insertLog = db.prepare('INSERT INTO inventory_logs (id, shop_id, product_id, change_amount, current_stock, type, note) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const product of products) {
        const result = updateStock.run(product.quantity, product.id, shopId, product.quantity);
        if (result.changes !== 1) throw new Error(`Insufficient stock for ${product.name}`);
        const currentStock = db.prepare('SELECT stock_quantity FROM products WHERE id = ? AND shop_id = ?').get(product.id, shopId).stock_quantity;
        insertItem.run(uuidv4(), orderId, product.id, product.name, product.quantity, product.price, product.image_url || null);
        insertSaleItem.run(uuidv4(), saleId, product.id, product.quantity, product.price, product.name);
        insertLog.run(uuidv4(), shopId, product.id, -product.quantity, currentStock, 'sale', `Online order ${code}`);
      }
      db.prepare('INSERT INTO cash_flows (id, shop_id, amount, type, category, description, ref_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), shopId, total, 'in', 'sale', `Online order ${code}`, saleId, createdAt);
      return getOrder(shopId, customerToken, orderId);
    })();
    res.status(201).json(order);
  } catch (error) {
    console.error('Storefront order create error:', error);
    if (/not found/i.test(error.message)) return res.status(404).json({ error: error.message });
    if (/voucher/i.test(error.message)) return res.status(400).json({ error: error.message });
    if (/stock/i.test(error.message)) return res.status(409).json({ error: error.message });
    res.status(500).json({ error: 'Unable to create order' });
  }
});

async function changeOrderStatus(req, res, status) {
  if (getDbProvider() !== 'sqlite') return res.status(501).json({ error: 'Storefront orders require SQLite provider' });
  const shopId = requireShopId(req, res);
  const customerToken = requireCustomerToken(req, res);
  if (!shopId || !customerToken) return;
  try {
    const updated = db.transaction(() => {
      const order = db.prepare('SELECT * FROM online_orders WHERE id = ? AND shop_id = ? AND customer_token = ?').get(req.params.id, shopId, customerToken);
      if (!order) throw new Error('Order not found');
      if (order.status !== 'awaiting_shipment') throw new Error('Order cannot be changed');
      const now = new Date().toISOString();

      if (status === 'cancelled') {
        const items = db.prepare('SELECT product_id, quantity FROM online_order_items WHERE order_id = ?').all(order.id);
        const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND shop_id = ?');
        const insertLog = db.prepare('INSERT INTO inventory_logs (id, shop_id, product_id, change_amount, current_stock, type, note) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const item of items) {
          updateStock.run(item.quantity, item.product_id, shopId);
          const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ? AND shop_id = ?').get(item.product_id, shopId);
          if (product) insertLog.run(uuidv4(), shopId, item.product_id, item.quantity, product.stock_quantity, 'void', `Cancelled online order ${order.code}`);
        }
        db.prepare("UPDATE sales SET is_void = 1, void_reason = ?, void_at = ? WHERE id = ? AND shop_id = ?")
          .run(String(req.body.reason || 'Khách hủy đơn').trim(), now, order.sale_id, shopId);
        db.prepare("UPDATE cash_flows SET description = '[VOIDED] ' || description WHERE ref_id = ? AND shop_id = ?")
          .run(order.sale_id, shopId);
      }
      db.prepare('UPDATE online_orders SET status = ?, updated_at = ? WHERE id = ? AND shop_id = ?').run(status, now, order.id, shopId);
      const row = db.prepare('SELECT * FROM online_orders WHERE id = ?').get(order.id);
      const items = db.prepare('SELECT product_id, product_name, quantity, price, image_url FROM online_order_items WHERE order_id = ? ORDER BY rowid ASC').all(order.id);
      return orderFromRow(row, items);
    })();
    res.json(updated);
  } catch (error) {
    if (/not found/i.test(error.message)) return res.status(404).json({ error: error.message });
    if (/cannot be changed/i.test(error.message)) return res.status(409).json({ error: error.message });
    console.error(`Storefront order ${status} error:`, error);
    res.status(500).json({ error: 'Unable to update order' });
  }
}

router.post('/orders/:id/cancel', (req, res) => changeOrderStatus(req, res, 'cancelled'));
router.post('/orders/:id/complete', (req, res) => changeOrderStatus(req, res, 'completed'));

module.exports = router;
