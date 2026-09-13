const { Schema, model } = require('mongoose');

const WebOrderSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  shop_id: { type: String, required: true, index: true },
  code: { type: String, required: true },
  customer_name: { type: String, required: true },
  customer_phone: { type: String, required: true },
  customer_address: { type: String, default: '' },
  note: { type: String, default: '' },
  total_amount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending', index: true },
  items_json: { type: String, default: '[]' },
  created_at: { type: Date, default: Date.now },
  confirmed_at: { type: Date, default: null },
}, {
  collection: 'web_orders',
  versionKey: false,
});

WebOrderSchema.index({ shop_id: 1, created_at: -1 });

module.exports = model('WebOrder', WebOrderSchema);
