const { Schema, model } = require('mongoose');

const InviteCodeSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  shop_id: { type: String, required: true, index: true },
  code: { type: String, required: true, unique: true, index: true },
  created_by: { type: String, required: true },
  used_by: { type: String, default: null },
  is_used: { type: Boolean, default: false },
  role: { type: String, default: 'staff' },
  expires_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
}, {
  collection: 'invite_codes',
  versionKey: false,
});

module.exports = model('InviteCode', InviteCodeSchema);
