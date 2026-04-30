const { Schema, model } = require('mongoose');

const InventoryLogSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  shop_id: { type: String, required: true, index: true },
  product_id: { type: String, default: null, index: true },
  change_amount: { type: Number, required: true },
  current_stock: { type: Number, required: true },
  type: { type: String, enum: ['import', 'sale', 'adjustment', 'void'], required: true },
  note: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
}, {
  collection: 'inventory_logs',
  versionKey: false,
});

module.exports = model('InventoryLog', InventoryLogSchema);
