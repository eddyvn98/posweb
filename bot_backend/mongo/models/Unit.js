const { Schema, model } = require('mongoose');

const UnitSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  shop_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: null },
}, {
  collection: 'units',
  versionKey: false,
});

UnitSchema.index({ shop_id: 1, name: 1 }, { unique: true });

module.exports = model('Unit', UnitSchema);
