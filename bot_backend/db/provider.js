const provider = (process.env.DB_PROVIDER || 'sqlite').toLowerCase();

const VALID = new Set(['sqlite', 'mongo', 'dual']);

function getDbProvider() {
  return VALID.has(provider) ? provider : 'sqlite';
}

function isMongoEnabled() {
  const p = getDbProvider();
  return p === 'mongo' || p === 'dual';
}

function isSqliteEnabled() {
  const p = getDbProvider();
  return p === 'sqlite' || p === 'dual';
}

module.exports = {
  getDbProvider,
  isMongoEnabled,
  isSqliteEnabled,
};
