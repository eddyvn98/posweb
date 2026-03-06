const mongoose = require('mongoose');

let mongoConnected = false;

async function connectMongo() {
  if (mongoConnected) return mongoose.connection;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is required when DB_PROVIDER is mongo or dual');
  }

  const dbName = process.env.MONGO_DB_NAME || 'posweb';
  const timeout = Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 10000);

  await mongoose.connect(mongoUri, {
    dbName,
    serverSelectionTimeoutMS: timeout,
    maxPoolSize: 20,
  });

  mongoConnected = true;
  return mongoose.connection;
}

function getMongoHealth() {
  return {
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
}

module.exports = {
  connectMongo,
  getMongoHealth,
};
