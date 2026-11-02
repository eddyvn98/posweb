// Shared invariant for SQLite, Mongo, Dual, and HTTP requests.
// This prevents negative stock movements and bookkeeping totals that differ from lines.
function invalid(message, status = 400) {
  return Object.assign(new Error(message), { status, code: 'INVALID_SALE' });
}
function validateSale(sale, authenticatedShopId) {
  if (!sale || typeof sale !== 'object' || Array.isArray(sale)) throw invalid('Invalid sale payload');
  if (sale.shop_id != null && sale.shop_id !== authenticatedShopId) {
    throw invalid('Sale does not belong to this shop', 403);
  }
  if (sale.id != null && (typeof sale.id !== 'string' || !sale.id.trim() || sale.id.length > 128)) {
    throw invalid('Invalid sale id');
  }
  if (typeof sale.code !== 'string' || !sale.code.trim() || sale.code.length > 128) {
    throw invalid('Invalid sale code');
  }
  if (!['cash', 'transfer', 'mixed'].includes(sale.payment_method)) {
    throw invalid('Invalid payment method');
  }
  if (!Array.isArray(sale.items) || sale.items.length === 0 || sale.items.length > 200) {
    throw invalid('Sale items must contain 1-200 entries');
  }
  let sum = 0;
  for (const item of sale.items) {
    if (!item || !Number.isSafeInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100000) {
      throw invalid('Invalid sale quantity');
    }
    if (!Number.isSafeInteger(item.price) || item.price < 0) throw invalid('Invalid sale item price');
    if (typeof item.product_name !== 'string' || !item.product_name.trim() || item.product_name.length > 255) {
      throw invalid('Invalid sale product name');
    }
    if (item.product_id != null && (typeof item.product_id !== 'string' || item.product_id.length > 128)) {
      throw invalid('Invalid product id');
    }
    const lineTotal = item.price * item.quantity;
    if (!Number.isSafeInteger(lineTotal)) throw invalid('Invalid line total');
    sum += lineTotal;
    if (!Number.isSafeInteger(sum)) throw invalid('Invalid sale total');
  }
  if (!Number.isSafeInteger(sale.total_amount) || sale.total_amount <= 0 || sum !== sale.total_amount) {
    throw invalid('Sale total does not match line items');
  }
  if (sale.sale_date != null && !Number.isFinite(Date.parse(sale.sale_date))) {
    throw invalid('Invalid sale date');
  }
  return sale;
}
function assertReplayCompatible(existing, incoming, existingItems = null) {
  if (Number(existing.total_amount) !== Number(incoming.total_amount)
    || existing.code !== incoming.code || existing.payment_method !== incoming.payment_method) {
    throw invalid('Sale id reused with different details', 409);
  }
  if (existingItems) {
    const signature = lines => lines.map(i => JSON.stringify([
      String(i.product_name), Number(i.price), Number(i.quantity), i.is_quick_sale ? null : (i.product_id || null)
    ])).sort();
    if (JSON.stringify(signature(existingItems)) !== JSON.stringify(signature(incoming.items || []))) {
      throw invalid('Sale id reused with different line items', 409);
    }
  }
}
module.exports = { validateSale, assertReplayCompatible };
