const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

test('SQLite fallback fails closed for password login and existing sessions until Mongo reconciliation', async () => {
  const db = new Database(':memory:');
  try {
    db.exec(fs.readFileSync(path.resolve(__dirname, '../db/init.sql'), 'utf8'));
    db.prepare("INSERT INTO shops(id,name) VALUES ('shop-qa','QA')").run();
    db.prepare('INSERT INTO users(id,shop_id,email,password,role) VALUES (?, ?, ?, ?, ?)')
      .run('user-qa', 'shop-qa', 'qa@example.test', bcrypt.hashSync('old-pass-123', 10), 'owner');
    const source = fs.readFileSync(path.resolve(__dirname, '../repositories/auth.repo.js'), 'utf8');
    const mod = { exports: {} };
    new Function('require', 'module', 'exports', source)((name) => {
      if (name === '../db/connection') return db;
      if (name === '../db/provider') return { getDbProvider: () => 'sqlite' };
      if (name.startsWith('../mongo/models/')) return {};
      return require(name);
    }, mod, mod.exports);
    const auth = mod.exports.getAuthRepo();
    assert.equal((await auth.getUserById('user-qa')).id, 'user-qa');
    assert.equal((await auth.loginWithEmail('qa@example.test', 'old-pass-123')).id, 'user-qa');
    db.prepare('INSERT INTO auth_mirror_guard(user_id, changed_at) VALUES (?, ?)').run('user-qa', Date.now());
    assert.equal(await auth.getUserById('user-qa'), null);
    await assert.rejects(auth.loginWithEmail('qa@example.test', 'old-pass-123'), /đối soát/);
    const newHash = bcrypt.hashSync('new-pass-123', 10);
    db.transaction(() => {
      db.prepare('UPDATE users SET password=?, auth_version=1 WHERE id=?').run(newHash, 'user-qa');
      db.prepare('DELETE FROM auth_mirror_guard WHERE user_id=?').run('user-qa');
    })();
    assert.equal((await auth.getUserById('user-qa')).auth_version, 1);
    await assert.rejects(auth.loginWithEmail('qa@example.test', 'old-pass-123'));
    assert.equal((await auth.loginWithEmail('qa@example.test', 'new-pass-123')).id, 'user-qa');
  } finally { db.close(); }
});
