const { Schema } = require('mongoose');

const SaleItemSchema = new Schema({
  id: { type: String, required: true, index: true },
  sale_id: { type: String, required: true, index: true },
  product_id: { type: String, default: null },
  product_name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
}, {
  collection: 'sale_items',
  versionKey: false,
});

module.exports = SaleItemSchema;
