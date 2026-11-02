const { Schema, model } = require('mongoose');

const schema = new Schema({
  event_key: { type: String, required: true, unique: true },
  kind: { type: String, required: true },
  shop_id: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'processing', 'done'] },
  attempts: { type: Number, default: 0 },
  next_attempt_at: { type: Date, default: Date.now },
  lease_until: { type: Date, default: null },
  worker_id: { type: String, default: null },
  last_error: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  processed_at: { type: Date, default: null }
}, { collection: 'delivery_outbox', versionKey: false });
schema.index({ status: 1, next_attempt_at: 1, lease_until: 1 });
module.exports = model('DeliveryOutbox', schema);
