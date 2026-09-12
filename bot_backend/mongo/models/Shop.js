const { Schema, model } = require('mongoose');

const ShopSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  address: { type: String, default: null },
  phone: { type: String, default: null },
  zalo_url: { type: String, default: null },
  opening_hours: { type: String, default: null },
  pickup_available: { type: Boolean, default: true },
  delivery_note: { type: String, default: null },
  shipping_fee: { type: Number, default: null },
  free_shipping_threshold: { type: Number, default: null },
  bank_name: { type: String, default: null },
  bank_account: { type: String, default: null },
  bank_owner: { type: String, default: null },
  updated_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
}, {
  collection: 'shops',
  versionKey: false,
});

module.exports = model('Shop', ShopSchema);
