const { Pool } = require('pg');

let pool = null;

function isPostgresConfigured() {
  return !!process.env.POSTGRES_URL;
}

function getPool() {
  if (!isPostgresConfigured()) return null;
  if (pool) return pool;

  pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    max: Number(process.env.POSTGRES_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.POSTGRES_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.POSTGRES_CONNECT_TIMEOUT_MS || 5000),
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  pool.on('error', (err) => {
    console.error('[postgres] pool error:', err.message);
  });

  return pool;
}

async function testPostgresConnection() {
  const p = getPool();
  if (!p) return { enabled: false, connected: false };
  try {
    await p.query('SELECT 1');
    return { enabled: true, connected: true };
  } catch (error) {
    return { enabled: true, connected: false, error: error.message };
  }
}

module.exports = {
  isPostgresConfigured,
  getPool,
  testPostgresConnection,
};
