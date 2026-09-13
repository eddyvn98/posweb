const { Schema, model } = require('mongoose');

const StorefrontSettingsSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  shop_id: { type: String, required: true, unique: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  template_id: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published', 'paused'], default: 'draft' },
  brand_name: { type: String, required: true },
  logo_url: { type: String, default: null },
  primary_color: { type: String, default: '#111111' },
  hero_title: { type: String, default: '' },
  hero_subtitle: { type: String, default: '' },
  hero_image_url: { type: String, default: null },
  featured_category_names_json: { type: String, default: '[]' },
  config_json: { type: String, default: '{}' },
  published_at: { type: Date, default: null },
  updated_at: { type: Date, default: Date.now },
}, {
  collection: 'storefront_settings',
  versionKey: false,
});

module.exports = model('StorefrontSettings', StorefrontSettingsSchema);
