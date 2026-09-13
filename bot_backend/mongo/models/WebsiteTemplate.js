const { Schema, model } = require('mongoose');

const WebsiteTemplateSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  industry: { type: String, required: true },
  preview_image: { type: String, default: null },
  config_json: { type: String, default: '{}' },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
}, {
  collection: 'website_templates',
  versionKey: false,
});

module.exports = model('WebsiteTemplate', WebsiteTemplateSchema);
