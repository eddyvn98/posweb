const { Schema, model } = require('mongoose');

const CashFlowSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  shop_id: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['in', 'out'], required: true },
  category: { type: String, default: 'sale' },
  description: { type: String, default: '' },
  ref_id: { type: String, default: null, index: true },
  created_at: { type: Date, default: Date.now },
}, {
  collection: 'cash_flows',
  versionKey: false,
});

module.exports = model('CashFlow', CashFlowSchema);
