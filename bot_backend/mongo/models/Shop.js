const { Schema, model } = require('mongoose');

const ShopSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  address: { type: String, default: null },
  updated_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
}, {
  collection: 'shops',
  versionKey: false,
});

module.exports = model('Shop', ShopSchema);
