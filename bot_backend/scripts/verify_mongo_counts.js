require('dotenv').config();

const db = require('../db/connection');
const mongoose = require('mongoose');
const { connectMongo } = require('../db/mongo');

const checks = [
  { sqlite: 'shops', mongo: 'shops' },
  { sqlite: 'users', mongo: 'users' },
  { sqlite: 'units', mongo: 'units' },
  { sqlite: 'categories', mongo: 'categories' },
  { sqlite: 'products', mongo: 'products' },
  { sqlite: 'sales', mongo: 'sales' },
  { sqlite: 'sale_items', mongo: 'sale_items' },
  { sqlite: 'inventory_logs', mongo: 'inventory_logs' },
  { sqlite: 'cash_flows', mongo: 'cash_flows' },
  { sqlite: 'imports', mongo: 'imports' },
];

(async () => {
  try {
    await connectMongo();

    let hasMismatch = false;

    for (const item of checks) {
      const sqliteCount = db.prepare(`SELECT COUNT(1) AS c FROM ${item.sqlite}`).get().c;
      const mongoCount = await mongoose.connection.db.collection(item.mongo).countDocuments();
      const mismatch = sqliteCount !== mongoCount;
      if (mismatch) hasMismatch = true;
      console.log(`[verify] ${item.sqlite}: sqlite=${sqliteCount}, mongo=${mongoCount}, mismatch=${mismatch}`);
    }

    if (hasMismatch) {
      console.error('[verify] count mismatch found');
      process.exit(2);
    }

    console.log('[verify] counts ok');
    process.exit(0);
  } catch (error) {
    console.error('[verify] failed:', error);
    process.exit(1);
  }
})();
