const { test } = require('node:test')
const assert = require('node:assert/strict')
const Database = require('better-sqlite3')
const fs = require('node:fs')
const path = require('node:path')
const bcrypt = require('bcryptjs')
const crypto = require('node:crypto')

function fixture() {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(fs.readFileSync(path.resolve(__dirname, '../db/init.sql'), 'utf8'))
  db.prepare("INSERT INTO shops(id,name) VALUES ('shop-qa','Test')").run()
  db.prepare('INSERT INTO users(id,shop_id,email,password,role) VALUES (?, ?, ?, ?, ?)')
    .run('user-qa', 'shop-qa', 'reset@example.test', bcrypt.hashSync('old-password', 10), 'owner')
  let mailed = []
  const module = { exports: {} }
  const source = fs.readFileSync(path.resolve(__dirname, '../services/passwordReset.js'), 'utf8')
  new Function('require', 'module', 'exports', source)((request) => {
    if (request === '../db/connection') return db
    if (request === '../db/provider') return { getDbProvider: () => 'sqlite' }
    if (request === '../mongo/models/User' || request === '../mongo/models/PasswordReset') return {}
    if (request === './resetMailer') return { sendResetMail: async (to, url) => { mailed.push({ to, url }) } }
    return require(request)
  }, module, module.exports)
  return { db, reset: module.exports, mailed }
}

test('password recovery: email neutral, SHA-256 only, single-use and revoke old auth version', async () => {
  const old = { RESEND_API_KEY: process.env.RESEND_API_KEY, RESET_EMAIL_FROM: process.env.RESET_EMAIL_FROM,
    RESET_PUBLIC_URL: process.env.RESET_PUBLIC_URL }
  process.env.RESEND_API_KEY = 'QA-only'
  process.env.RESET_EMAIL_FROM = 'qa@example.test'
  process.env.RESET_PUBLIC_URL = 'https://pos.example.test'
  const f = fixture()
  try {
    const before = f.db.prepare('SELECT password, auth_version FROM users WHERE id = ?').get('user-qa')
    const msg = await f.reset.requestReset('reset@example.test')
    assert.match(msg, /Nếu email có tài khoản/)
    assert.equal(f.mailed.length, 1)
    const link = new URL(f.mailed[0].url)
    assert.equal(link.pathname, '/reset-password')
    const token = link.searchParams.get('token')
    assert.match(token, /^[a-f0-9]{64}$/)
    const row = f.db.prepare('SELECT * FROM password_reset_tokens').get()
    assert.equal(row.token_hash, crypto.createHash('sha256').update(token).digest('hex'))
    assert.ok(!JSON.stringify(row).includes(token))
    await f.reset.resetPassword(token, 'new-password-2026')
    const after = f.db.prepare('SELECT password, auth_version FROM users WHERE id = ?').get('user-qa')
    assert.equal(after.auth_version, before.auth_version + 1)
    assert.ok(bcrypt.compareSync('new-password-2026', after.password))
    assert.equal(bcrypt.compareSync('old-password', after.password), false)
    await assert.rejects(f.reset.resetPassword(token, 'replayed-password'), e => e.status === 400)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM password_reset_tokens').get().n, 0)
  } finally {
    f.db.close()
    for (const [k,v] of Object.entries(old)) if(v === undefined) delete process.env[k]; else process.env[k]=v
  }
})

test('password recovery: no account disclosure, expired token rejected', async () => {
  const old = { RESEND_API_KEY: process.env.RESEND_API_KEY, RESET_EMAIL_FROM: process.env.RESET_EMAIL_FROM,
    RESET_PUBLIC_URL: process.env.RESET_PUBLIC_URL }
  process.env.RESEND_API_KEY = 'QA-only'
  process.env.RESET_EMAIL_FROM = 'qa@example.test'
  process.env.RESET_PUBLIC_URL = 'https://pos.example.test'
  const f=fixture()
  try {
    const normal = await f.reset.requestReset('nobody@example.test')
    assert.match(normal, /Nếu email có tài khoản/)
    assert.equal(f.mailed.length, 0)
    const expiredToken=crypto.randomBytes(32).toString('hex')
    f.db.prepare("INSERT INTO password_reset_tokens(token_hash,user_id,expires_at) VALUES (?,?,?)")
      .run(crypto.createHash('sha256').update(expiredToken).digest('hex'), 'user-qa', new Date(Date.now()-1000).toISOString())
    await assert.rejects(f.reset.resetPassword(expiredToken,'valid-password'),e=>e.status===400)
    assert.equal(f.db.prepare('SELECT auth_version FROM users WHERE id = ?').get('user-qa').auth_version,0)
  } finally {
    f.db.close()
    for(const [k,v] of Object.entries(old)) if(v===undefined) delete process.env[k]; else process.env[k]=v
  }
})

test('password recovery rejects missing email configuration', async () => {
  const saved=process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY
  const f=fixture()
  try { await assert.rejects(f.reset.requestReset('reset@example.test'),e=>e.status===503) }
  finally { f.db.close(); if(saved===undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY=saved }
})
