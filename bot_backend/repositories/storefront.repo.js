const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');
const { getProductsRepo } = require('./products.repo');
const { getShopsRepo } = require('./shops.repo');
const { getSalesRepo } = require('./sales.repo');
const WebsiteTemplate = require('../mongo/models/WebsiteTemplate');
const StorefrontSettings = require('../mongo/models/StorefrontSettings');
const WebOrder = require('../mongo/models/WebOrder');

const DEFAULT_TEMPLATE = {
  id: 'styla-fashion',
  name: 'STYLA Fashion',
  industry: 'Thời trang',
  preview_image: '/previews/pro.png',
  config_json: JSON.stringify({
    layout: 'styla',
    sections: ['hero', 'collections', 'featuredProducts', 'benefits', 'newsletter'],
  }),
  is_active: true,
};

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseProductAttributes(product) {
  return parseJson(product.attributes, product.attributes || {});
}

function normalizeOnlineCatalog(product) {
  const attributes = parseProductAttributes(product);
  const source = attributes.online_catalog && typeof attributes.online_catalog === 'object'
    ? attributes.online_catalog
    : {};

  const channelVisibility = {
    web: true,
    shopee: false,
    tiktok: false,
    ...(source.channel_visibility || {}),
  };

  return {
    title: String(source.title || product.name || '').trim(),
    subtitle: String(source.subtitle || '').trim(),
    description: String(source.description || '').trim(),
    gallery_images: Array.isArray(source.gallery_images) ? source.gallery_images.filter(Boolean) : [],
    specifications: Array.isArray(source.specifications) ? source.specifications : [],
    detail_sections: Array.isArray(source.detail_sections) ? source.detail_sections : [],
    guides: Array.isArray(source.guides) ? source.guides : [],
    policies: {
      shipping: String(source.policies?.shipping || '').trim(),
      returns: String(source.policies?.returns || '').trim(),
      warranty: String(source.policies?.warranty || '').trim(),
    },
    seo: {
      title: String(source.seo?.title || source.title || product.name || '').trim(),
      description: String(source.seo?.description || source.subtitle || '').trim(),
    },
    channel_visibility: channelVisibility,
  };
}

function serializeSettings(row) {
  if (!row) return null;
  return {
    ...row,
    featured_category_names: parseJson(row.featured_category_names_json, []),
    config: parseJson(row.config_json, {}),
  };
}

function publicProduct(product) {
  const attributes = parseProductAttributes(product);
  const online_catalog = normalizeOnlineCatalog(product);
  return {
    id: product.id,
    name: product.name,
    display_name: online_catalog.title || product.name,
    barcode: product.barcode,
    unit: product.unit,
    category: product.category || '',
    price: Number(product.price || 0),
    stock_quantity: Number(product.stock_quantity || 0),
    image_url: product.image_url || null,
    parent_id: product.parent_id || null,
    attributes,
    online_catalog,
    is_sold_out: Number(product.stock_quantity || 0) <= 0,
  };
}

function buildStorefrontPayload(settings, shop, products, template) {
  const publicProducts = products
    .filter((p) => !p.parent_id)
    .map(publicProduct)
    .filter((p) => p.online_catalog.channel_visibility.web !== false);
  const categories = Array.from(new Set(publicProducts.map((p) => p.category).filter(Boolean))).slice(0, 12);
  const selectedCategories = settings.featured_category_names?.length
    ? settings.featured_category_names
    : categories.slice(0, 3);

  return {
    shop: {
      id: shop.id,
      name: shop.name,
      address: shop.address || '',
    },
    settings,
    template,
    categories,
    collections: selectedCategories.map((name) => ({
      name,
      products: publicProducts.filter((p) => p.category === name).slice(0, 8),
    })),
    products: {
      latest: publicProducts.slice(0, 60),
      featured: publicProducts
        .filter((p) => selectedCategories.includes(p.category))
        .slice(0, 24),
    },
  };
}

function buildProductDetailPayload(storefront, products, productId) {
  const product = products.find((p) => String(p.id) === String(productId));
  if (!product || product.parent_id) return null;

  const detail = publicProduct(product);
  if (detail.online_catalog.channel_visibility.web === false) return null;

  const variants = products
    .filter((p) => String(p.parent_id || '') === String(product.id))
    .map(publicProduct)
    .filter((p) => p.online_catalog.channel_visibility.web !== false);

  return {
    shop: storefront.shop,
    settings: storefront.settings,
    product: detail,
    variants,
  };
}

function orderCode() {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `WEB${stamp}${Math.floor(1000 + Math.random() * 9000)}`;
}

async function buildSaleFromOrder(order) {
  const items = parseJson(order.items_json, []);
  return {
    code: order.code,
    total_amount: Number(order.total_amount || 0),
    payment_method: 'web_pending',
    sale_date: new Date().toISOString(),
    items: items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
    })),
  };
}

async function assertOrderStockAvailable(shop_id, order) {
  const items = parseJson(order.items_json, []);
  const products = await getProductsRepo().getProducts(shop_id);
  const productsById = new Map(products.map((product) => [String(product.id), product]));
  for (const item of items) {
    const product = productsById.get(String(item.product_id));
    if (!product) throw new Error(`Product no longer exists: ${item.product_name}`);
    if (Number(product.stock_quantity || 0) < Number(item.quantity || 0)) {
      throw new Error(`Not enough stock for ${item.product_name}`);
    }
  }
}

const sqliteRepo = {
  async ensureTemplateSeed() {
    db.prepare(`
      INSERT OR IGNORE INTO website_templates (id, name, industry, preview_image, config_json, is_active)
      VALUES (@id, @name, @industry, @preview_image, @config_json, @is_active)
    `).run({ ...DEFAULT_TEMPLATE, is_active: 1 });
  },
  async listTemplates() {
    await this.ensureTemplateSeed();
    return db.prepare('SELECT * FROM website_templates WHERE is_active = 1 ORDER BY created_at ASC').all();
  },
  async getSettings(shop_id) {
    await this.ensureTemplateSeed();
    const existing = db.prepare('SELECT * FROM storefront_settings WHERE shop_id = ?').get(shop_id);
    if (existing) return serializeSettings(existing);

    const shop = await getShopsRepo().getById(shop_id);
    const slug = await this.reserveSlug(shop?.name || 'shop', shop_id);
    const settings = {
      id: uuidv4(),
      shop_id,
      slug,
      template_id: DEFAULT_TEMPLATE.id,
      status: 'draft',
      brand_name: shop?.name || 'Cửa hàng',
      logo_url: null,
      primary_color: '#111111',
      hero_title: 'Sống chất mặc đẹp',
      hero_subtitle: 'Khám phá sản phẩm mới nhất từ cửa hàng của bạn.',
      hero_image_url: '',
      featured_category_names_json: '[]',
      config_json: '{}',
    };
    db.prepare(`
      INSERT INTO storefront_settings (
        id, shop_id, slug, template_id, status, brand_name, logo_url, primary_color,
        hero_title, hero_subtitle, hero_image_url, featured_category_names_json, config_json
      ) VALUES (
        @id, @shop_id, @slug, @template_id, @status, @brand_name, @logo_url, @primary_color,
        @hero_title, @hero_subtitle, @hero_image_url, @featured_category_names_json, @config_json
      )
    `).run(settings);
    return serializeSettings(settings);
  },
  async reserveSlug(rawSlug, shop_id) {
    const base = normalizeSlug(rawSlug) || `shop-${shop_id.slice(0, 8)}`;
    let candidate = base;
    let suffix = 2;
    while (true) {
      const row = db.prepare('SELECT shop_id FROM storefront_settings WHERE slug = ?').get(candidate);
      if (!row || row.shop_id === shop_id) return candidate;
      candidate = `${base}-${suffix++}`;
    }
  },
  async updateSettings(shop_id, input) {
    const current = await this.getSettings(shop_id);
    const nextSlug = input.slug ? await this.reserveSlug(input.slug, shop_id) : current.slug;
    const payload = {
      ...current,
      slug: nextSlug,
      template_id: input.template_id || current.template_id,
      brand_name: input.brand_name || current.brand_name,
      logo_url: input.logo_url ?? current.logo_url,
      primary_color: input.primary_color || current.primary_color,
      hero_title: input.hero_title || current.hero_title,
      hero_subtitle: input.hero_subtitle || current.hero_subtitle,
      hero_image_url: input.hero_image_url ?? current.hero_image_url,
      featured_category_names_json: JSON.stringify(input.featured_category_names || current.featured_category_names || []),
      config_json: JSON.stringify(input.config || current.config || {}),
    };
    db.prepare(`
      UPDATE storefront_settings SET
        slug = @slug,
        template_id = @template_id,
        brand_name = @brand_name,
        logo_url = @logo_url,
        primary_color = @primary_color,
        hero_title = @hero_title,
        hero_subtitle = @hero_subtitle,
        hero_image_url = @hero_image_url,
        featured_category_names_json = @featured_category_names_json,
        config_json = @config_json,
        updated_at = CURRENT_TIMESTAMP
      WHERE shop_id = @shop_id
    `).run({ ...payload, shop_id });
    return this.getSettings(shop_id);
  },
  async publish(shop_id) {
    await this.getSettings(shop_id);
    db.prepare("UPDATE storefront_settings SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE shop_id = ?").run(shop_id);
    return this.getSettings(shop_id);
  },
  async getPublicBySlug(slug) {
    const settingsRow = db.prepare("SELECT * FROM storefront_settings WHERE slug = ? AND status = 'published'").get(normalizeSlug(slug));
    if (!settingsRow) return null;
    const settings = serializeSettings(settingsRow);
    const shop = await getShopsRepo().getById(settings.shop_id);
    const products = await getProductsRepo().getProducts(settings.shop_id);
    const template = db.prepare('SELECT * FROM website_templates WHERE id = ?').get(settings.template_id) || DEFAULT_TEMPLATE;
    return buildStorefrontPayload(settings, shop, products, template);
  },
  async getPublicProductDetail(slug, productId) {
    const storefront = await this.getPublicBySlug(slug);
    if (!storefront) return null;
    const products = await getProductsRepo().getProducts(storefront.shop.id);
    return buildProductDetailPayload(storefront, products, productId);
  },
  async createOrder(slug, input) {
    const storefront = await this.getPublicBySlug(slug);
    if (!storefront) return null;
    const allProducts = await getProductsRepo().getProducts(storefront.shop.id);
    const productsById = new Map(allProducts.map((p) => [String(p.id), p]));
    const requestedItems = Array.isArray(input.items) ? input.items : [];
    const items = [];
    for (const raw of requestedItems) {
      const product = productsById.get(String(raw.product_id));
      const quantity = Math.max(1, Number(raw.quantity || 1));
      if (!product || Number(product.is_active) === 0) continue;
      items.push({
        product_id: product.id,
        product_name: product.name,
        quantity,
        price: Number(product.price || 0),
        subtotal: Number(product.price || 0) * quantity,
      });
    }
    if (!items.length) throw new Error('No valid order items');
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const order = {
      id: uuidv4(),
      shop_id: storefront.shop.id,
      code: orderCode(),
      customer_name: String(input.customer_name || '').trim(),
      customer_phone: String(input.customer_phone || '').trim(),
      customer_address: String(input.customer_address || '').trim(),
      note: String(input.note || '').trim(),
      total_amount: total,
      status: 'pending',
      items_json: JSON.stringify(items),
    };
    if (!order.customer_name || !order.customer_phone) {
      throw new Error('Missing customer name or phone');
    }
    db.prepare(`
      INSERT INTO web_orders (
        id, shop_id, code, customer_name, customer_phone, customer_address, note,
        total_amount, status, items_json
      ) VALUES (
        @id, @shop_id, @code, @customer_name, @customer_phone, @customer_address, @note,
        @total_amount, @status, @items_json
      )
    `).run(order);
    return { ...order, items };
  },
  async listOrders(shop_id) {
    return db.prepare('SELECT * FROM web_orders WHERE shop_id = ? ORDER BY created_at DESC').all(shop_id).map((order) => ({
      ...order,
      items: parseJson(order.items_json, []),
    }));
  },
  async updateOrderStatus(shop_id, id, status, user_id) {
    const order = db.prepare('SELECT * FROM web_orders WHERE id = ? AND shop_id = ?').get(id, shop_id);
    if (!order) return null;
    if (order.status !== 'pending') return { ...order, items: parseJson(order.items_json, []) };
    if (status === 'confirmed') {
      await assertOrderStockAvailable(shop_id, order);
      await getSalesRepo().createSale(shop_id, user_id, await buildSaleFromOrder(order));
      db.prepare("UPDATE web_orders SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP WHERE id = ? AND shop_id = ?").run(id, shop_id);
    } else if (status === 'cancelled') {
      db.prepare("UPDATE web_orders SET status = 'cancelled' WHERE id = ? AND shop_id = ?").run(id, shop_id);
    }
    const updated = db.prepare('SELECT * FROM web_orders WHERE id = ? AND shop_id = ?').get(id, shop_id);
    return { ...updated, items: parseJson(updated.items_json, []) };
  },
};

const mongoRepo = {
  async ensureTemplateSeed() {
    await WebsiteTemplate.updateOne(
      { id: DEFAULT_TEMPLATE.id },
      { $setOnInsert: DEFAULT_TEMPLATE },
      { upsert: true }
    );
  },
  async listTemplates() {
    await this.ensureTemplateSeed();
    return WebsiteTemplate.find({ is_active: true }).sort({ created_at: 1 }).lean();
  },
  async getSettings(shop_id) {
    await this.ensureTemplateSeed();
    let settings = await StorefrontSettings.findOne({ shop_id }).lean();
    if (settings) return serializeSettings(settings);
    const shop = await getShopsRepo().getById(shop_id);
    const slug = await this.reserveSlug(shop?.name || 'shop', shop_id);
    settings = {
      id: uuidv4(),
      shop_id,
      slug,
      template_id: DEFAULT_TEMPLATE.id,
      status: 'draft',
      brand_name: shop?.name || 'Cửa hàng',
      logo_url: null,
      primary_color: '#111111',
      hero_title: 'Sống chất mặc đẹp',
      hero_subtitle: 'Khám phá sản phẩm mới nhất từ cửa hàng của bạn.',
      hero_image_url: '',
      featured_category_names_json: '[]',
      config_json: '{}',
    };
    await StorefrontSettings.create(settings);
    return serializeSettings(settings);
  },
  async reserveSlug(rawSlug, shop_id) {
    const base = normalizeSlug(rawSlug) || `shop-${shop_id.slice(0, 8)}`;
    let candidate = base;
    let suffix = 2;
    while (true) {
      const row = await StorefrontSettings.findOne({ slug: candidate }, { shop_id: 1 }).lean();
      if (!row || row.shop_id === shop_id) return candidate;
      candidate = `${base}-${suffix++}`;
    }
  },
  async updateSettings(shop_id, input) {
    const current = await this.getSettings(shop_id);
    const nextSlug = input.slug ? await this.reserveSlug(input.slug, shop_id) : current.slug;
    const payload = {
      slug: nextSlug,
      template_id: input.template_id || current.template_id,
      brand_name: input.brand_name || current.brand_name,
      logo_url: input.logo_url ?? current.logo_url,
      primary_color: input.primary_color || current.primary_color,
      hero_title: input.hero_title || current.hero_title,
      hero_subtitle: input.hero_subtitle || current.hero_subtitle,
      hero_image_url: input.hero_image_url ?? current.hero_image_url,
      featured_category_names_json: JSON.stringify(input.featured_category_names || current.featured_category_names || []),
      config_json: JSON.stringify(input.config || current.config || {}),
      updated_at: new Date(),
    };
    await StorefrontSettings.updateOne({ shop_id }, { $set: payload });
    return this.getSettings(shop_id);
  },
  async publish(shop_id) {
    await this.getSettings(shop_id);
    await StorefrontSettings.updateOne(
      { shop_id },
      { $set: { status: 'published', published_at: new Date(), updated_at: new Date() } }
    );
    return this.getSettings(shop_id);
  },
  async getPublicBySlug(slug) {
    const settings = serializeSettings(await StorefrontSettings.findOne({ slug: normalizeSlug(slug), status: 'published' }).lean());
    if (!settings) return null;
    const shop = await getShopsRepo().getById(settings.shop_id);
    const products = await getProductsRepo().getProducts(settings.shop_id);
    const template = await WebsiteTemplate.findOne({ id: settings.template_id }).lean() || DEFAULT_TEMPLATE;
    return buildStorefrontPayload(settings, shop, products, template);
  },
  async getPublicProductDetail(slug, productId) {
    const storefront = await this.getPublicBySlug(slug);
    if (!storefront) return null;
    const products = await getProductsRepo().getProducts(storefront.shop.id);
    return buildProductDetailPayload(storefront, products, productId);
  },
  async createOrder(slug, input) {
    const storefront = await this.getPublicBySlug(slug);
    if (!storefront) return null;
    const allProducts = await getProductsRepo().getProducts(storefront.shop.id);
    const productsById = new Map(allProducts.map((p) => [String(p.id), p]));
    const requestedItems = Array.isArray(input.items) ? input.items : [];
    const items = requestedItems.map((raw) => {
      const product = productsById.get(String(raw.product_id));
      const quantity = Math.max(1, Number(raw.quantity || 1));
      if (!product || product.is_active === false) return null;
      return {
        product_id: product.id,
        product_name: product.name,
        quantity,
        price: Number(product.price || 0),
        subtotal: Number(product.price || 0) * quantity,
      };
    }).filter(Boolean);
    if (!items.length) throw new Error('No valid order items');
    const order = {
      id: uuidv4(),
      shop_id: storefront.shop.id,
      code: orderCode(),
      customer_name: String(input.customer_name || '').trim(),
      customer_phone: String(input.customer_phone || '').trim(),
      customer_address: String(input.customer_address || '').trim(),
      note: String(input.note || '').trim(),
      total_amount: items.reduce((sum, item) => sum + item.subtotal, 0),
      status: 'pending',
      items_json: JSON.stringify(items),
    };
    if (!order.customer_name || !order.customer_phone) {
      throw new Error('Missing customer name or phone');
    }
    await WebOrder.create(order);
    return { ...order, items };
  },
  async listOrders(shop_id) {
    const orders = await WebOrder.find({ shop_id }).sort({ created_at: -1 }).lean();
    return orders.map((order) => ({ ...order, items: parseJson(order.items_json, []) }));
  },
  async updateOrderStatus(shop_id, id, status, user_id) {
    const order = await WebOrder.findOne({ id, shop_id }).lean();
    if (!order) return null;
    if (order.status !== 'pending') return { ...order, items: parseJson(order.items_json, []) };
    if (status === 'confirmed') {
      await assertOrderStockAvailable(shop_id, order);
      await getSalesRepo().createSale(shop_id, user_id, await buildSaleFromOrder(order));
      await WebOrder.updateOne({ id, shop_id }, { $set: { status: 'confirmed', confirmed_at: new Date() } });
    } else if (status === 'cancelled') {
      await WebOrder.updateOne({ id, shop_id }, { $set: { status: 'cancelled' } });
    }
    const updated = await WebOrder.findOne({ id, shop_id }).lean();
    return { ...updated, items: parseJson(updated.items_json, []) };
  },
};

const dualRepo = {
  ...mongoRepo,
  async updateSettings(shop_id, input) {
    const result = await mongoRepo.updateSettings(shop_id, input);
    try { await sqliteRepo.updateSettings(shop_id, input); } catch (e) {
      console.error('[dual][storefront] sqlite settings write failed:', e.message);
    }
    return result;
  },
  async publish(shop_id) {
    const result = await mongoRepo.publish(shop_id);
    try { await sqliteRepo.publish(shop_id); } catch (e) {
      console.error('[dual][storefront] sqlite publish failed:', e.message);
    }
    return result;
  },
  async createOrder(slug, input) {
    return mongoRepo.createOrder(slug, input);
  },
  async updateOrderStatus(shop_id, id, status, user_id) {
    return mongoRepo.updateOrderStatus(shop_id, id, status, user_id);
  },
};

function getStorefrontRepo() {
  const provider = getDbProvider();
  if (provider === 'mongo') return mongoRepo;
  if (provider === 'dual') return dualRepo;
  return sqliteRepo;
}

module.exports = { getStorefrontRepo, normalizeSlug };
