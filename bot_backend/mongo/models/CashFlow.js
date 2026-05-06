const { Schema } = require('mongoose');

const CashFlowSchema = new Schema({
  id: { type: String, required: true, index: true },
  shop_id: { type: String, required: true, index: true },
  type: { type: String, enum: ['in', 'out', 'IN', 'OUT'], required: true },
  amount: { type: Number, default: 0 },
  category: { type: String, default: 'sale' },
  description: { type: String, default: null },
  note: { type: String, default: null },
  ref_id: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  created_by: { type: String, default: null },
}, {
  collection: 'cashflow',
  versionKey: false,
});

CashFlowSchema.index({ shop_id: 1, created_at: -1 });

module.exports = CashFlowSchema;
