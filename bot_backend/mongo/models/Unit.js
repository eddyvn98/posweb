const { Schema } = require('mongoose');

const UnitSchema = new Schema({
  id: { type: String, required: true, index: true },
  shop_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  is_active: { type: Boolean, default: true },
}, {
  collection: 'units',
  versionKey: false,
});

UnitSchema.index({ shop_id: 1, name: 1 }, { unique: true });

module.exports = UnitSchema;
