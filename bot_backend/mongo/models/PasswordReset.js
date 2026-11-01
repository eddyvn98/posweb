const { Schema, model } = require('mongoose');
const schema = new Schema({
  token_hash: { type: String, required: true, unique: true, index: true },
  user_id: { type: String, required: true, unique: true, index: true },
  expires_at: { type: Date, required: true },
}, { collection: 'password_reset_tokens', versionKey: false });
schema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
module.exports = model('PasswordReset', schema);
