const { Schema } = require('mongoose');

const InventoryLogSchema = new Schema({
  id: { type: String, required: true, index: true },
  shop_id: { type: String, required: true, index: true },
  product_id: { type: String, required: true, index: true },
  change_amount: { type: Number, required: true },
  current_stock: { type: Number, required: true },
  type: { type: String, enum: ['sale', 'import', 'void', 'adjustment'], required: true },
  note: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
}, {
  collection: 'inventory_logs',
  versionKey: false,
});

InventoryLogSchema.index({ shop_id: 1, created_at: -1 });

module.exports = InventoryLogSchema;
