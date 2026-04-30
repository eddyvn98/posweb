const { Schema, model } = require('mongoose');

const SaleSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  shop_id: { type: String, required: true, index: true },
  code: { type: String, required: true },
  total_amount: { type: Number, default: 0 },
  payment_method: { type: String, default: 'cash' },
  sale_date: { type: Date, default: Date.now },
  created_by: { type: String, default: null },
  is_void: { type: Boolean, default: false },
  void_reason: { type: String, default: null },
  void_at: { type: Date, default: null },
}, {
  collection: 'sales',
  versionKey: false,
});

SaleSchema.index({ shop_id: 1, sale_date: -1 });

module.exports = model('Sale', SaleSchema);
