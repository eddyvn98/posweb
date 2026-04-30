const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  shop_id: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, default: null },
  role: { type: String, enum: ['owner', 'staff'], default: 'staff' },
  telegram_id: { type: String, default: null, index: true, sparse: true },
  created_at: { type: Date, default: Date.now },
}, {
  collection: 'users',
  versionKey: false,
});

module.exports = model('User', UserSchema);
