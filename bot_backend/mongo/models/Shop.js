const { Schema, model } = require('mongoose');

const ShopSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  address: { type: String, default: null },
  bank_name: { type: String, default: null },
  bank_account_name: { type: String, default: null },
  bank_account_number: { type: String, default: null },
  bank_qr_url: { type: String, default: null },
  feature_flags: { type: String, default: '{}' },
  imports_sheet_id: { type: String, default: null },
  imports_sheet_url: { type: String, default: null },
  updated_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
}, {
  collection: 'shops',
  versionKey: false,
});

module.exports = model('Shop', ShopSchema);
