const mongoose = require('mongoose');

// Cache connections to avoid re-creating them on every request
const connections = {};

/**
 * Get a connection for a specific shop (tenant)
 * @param {string} shopId 
 * @returns {mongoose.Connection}
 */
function getTenantConnection(shopId) {
  if (!shopId) throw new Error('shopId is required for tenant connection');

  // For administrative/auth tasks, we use the main DB
  if (shopId === 'main') {
    return mongoose.connection;
  }

  if (connections[shopId]) {
    return connections[shopId];
  }

  const baseUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = `posweb_shop_${shopId}`;
  
  // Create a new connection for this shop
  const conn = mongoose.createConnection(baseUri, {
    dbName,
    serverSelectionTimeoutMS: 10000,
  });

  conn.on('connected', () => console.log(`[Tenant] Connected to DB: ${dbName}`));
  conn.on('error', (err) => console.error(`[Tenant] DB Error (${dbName}):`, err));

  connections[shopId] = conn;
  return conn;
}

/**
 * Get a model tied to a specific tenant's connection
 * @param {string} shopId 
 * @param {string} modelName 
 * @param {mongoose.Schema} schema 
 */
function getTenantModel(shopId, modelName, schema) {
  const conn = getTenantConnection(shopId);
  // Check if model already exists on this connection to avoid OverwriteModelError
  return conn.models[modelName] || conn.model(modelName, schema);
}

module.exports = {
  getTenantConnection,
  getTenantModel,
};
