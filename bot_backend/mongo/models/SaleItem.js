const { Schema, model } = require('mongoose');

const SaleItemSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  sale_id: { type: String, required: true, index: true },
  product_id: { type: String, default: null },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  product_name: { type: String, required: true },
}, {
  collection: 'sale_items',
  versionKey: false,
});

module.exports = model('SaleItem', SaleItemSchema);
