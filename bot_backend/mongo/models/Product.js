const { Schema, model } = require('mongoose');

const ProductSchema = new Schema({
  id: { type: String, required: true, index: true },
  shop_id: { type: String, required: true, index: true },
  barcode: { type: String, required: true },
  name: { type: String, required: true },
  unit: { type: String, default: 'Cái' },
  category: { type: String, default: '' },
  price: { type: Number, default: 0 },
  online_price: { type: Number, default: null },
  promo_price: { type: Number, default: null },
  cost_price: { type: Number, default: 0 },
  stock_quantity: { type: Number, default: 0 },
  image_url: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
}, {
  collection: 'products',
  versionKey: false,
});

ProductSchema.index({ shop_id: 1, barcode: 1 }, { unique: true });
ProductSchema.index({ shop_id: 1, is_active: 1 });
ProductSchema.index({ shop_id: 1, name: 1 });

module.exports = model('Product', ProductSchema);
