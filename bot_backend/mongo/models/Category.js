const { Schema } = require('mongoose');

const CategorySchema = new Schema({
  id: { type: String, required: true, index: true },
  shop_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  is_active: { type: Boolean, default: true },
}, {
  collection: 'categories',
  versionKey: false,
});

CategorySchema.index({ shop_id: 1, name: 1 }, { unique: true });

module.exports = CategorySchema;
