const crypto = require('node:crypto');
const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');
const Outbox = require('../mongo/models/DeliveryOutbox');
const { getAuthRepo } = require('../repositories/auth.repo');
const User = require('../mongo/models/User');
const { syncSale, syncCashFlow, syncVoidSale } = require('./googleSheetService');

const workerId = crypto.randomUUID();
const LEASE_MS = 120000;
let running = false;

async function deliver(event) {
  // Missing optional Google credentials must NOT acknowledge and discard an export.
  if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error('Google Sheets export is not configured');
  }
  const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
  const shop = await getAuthRepo().getShopById(event.shop_id);
  const name = shop?.name || 'Cua hang';
  switch (event.kind) {
    case 'sheet_sale': return syncSale(payload.sale, name);
    case 'sheet_cash': return syncCashFlow(payload);
    case 'sheet_void': return syncVoidSale(payload.saleId, payload.reason, name);
    default: throw new Error('Unsupported outbox event ' + event.kind);
  }
}
function nextDelay(attempts) {
  return Math.min(3600000, 1000 * 2 ** Math.min(attempts, 12));
}
async function processSqliteOne() {
  const now = Date.now();
  const event = db.transaction(() => {
    const row = db.prepare(`SELECT * FROM delivery_outbox
      WHERE ((status = 'pending' AND next_attempt_at <= ?)
          OR (status = 'processing' AND lease_until <= ?))
      ORDER BY created_at LIMIT 1`).get(now, now);
    if (!row) return null;
    db.prepare(`UPDATE delivery_outbox SET status='processing', lease_until=?, worker_id=?
      WHERE event_key=?`).run(now + LEASE_MS, workerId, row.event_key);
    return row;
  })();
  if (!event) return false;
  try {
    await deliver(event);
    db.prepare(`UPDATE delivery_outbox SET status='done', processed_at=?, lease_until=NULL
      WHERE event_key=? AND worker_id=?`).run(Date.now(), event.event_key, workerId);
  } catch (e) {
    const attempts = event.attempts + 1;
    db.prepare(`UPDATE delivery_outbox SET status='pending', attempts=?, next_attempt_at=?,
      lease_until=NULL, last_error=? WHERE event_key=? AND worker_id=?`)
      .run(attempts, Date.now() + nextDelay(attempts), String(e.message).slice(0,1000), event.event_key, workerId);
    console.error('[outbox] delivery failed:', event.event_key, e.message);
  }
  return true;
}
async function processMongoOne() {
  const now = new Date();
  const event = await Outbox.findOneAndUpdate({
    $or: [{ status: 'pending', next_attempt_at: { $lte: now } },
      { status: 'processing', lease_until: { $lte: now } }]
  }, { $set: { status: 'processing', lease_until: new Date(Date.now() + LEASE_MS), worker_id: workerId } },
  { sort: { created_at: 1 }, new: true }).lean();
  if (!event) return false;
  try {
    await deliver(event);
    await Outbox.updateOne({ event_key: event.event_key, worker_id: workerId },
      { $set: { status: 'done', processed_at: new Date() }, $unset: { lease_until: 1, worker_id: 1 } });
  } catch (e) {
    const attempts = event.attempts + 1;
    await Outbox.updateOne({ event_key: event.event_key, worker_id: workerId },
      { $set: { status: 'pending', attempts, next_attempt_at: new Date(Date.now() + nextDelay(attempts)), last_error: String(e.message).slice(0,1000) },
        $unset: { lease_until: 1, worker_id: 1 } });
    console.error('[outbox] delivery failed:', event.event_key, e.message);
  }
  return true;
}
async function reconcileAuthMirrors(max = 20) {
  if (getDbProvider() !== 'dual') return 0;
  const pending = db.prepare('SELECT user_id FROM auth_mirror_guard ORDER BY changed_at LIMIT ?').all(max);
  for (const row of pending) {
    const source = await User.findOne({ id: row.user_id }).lean();
    if (!source) continue;
    db.transaction(() => {
      const result = db.prepare('UPDATE users SET password=?, auth_version=? WHERE id=?')
        .run(source.password, Number(source.auth_version || 0), row.user_id);
      if (!result.changes) throw new Error('Missing SQLite user for auth reconciliation');
      db.prepare('DELETE FROM auth_mirror_guard WHERE user_id=?').run(row.user_id);
    })();
  }
  return pending.length;
}
async function drainOnce(max = 50) {
  await reconcileAuthMirrors();
  // Dual uses Mongo as the authoritative journal; SQLite is a sales mirror.
  const processOne = getDbProvider() === 'sqlite' ? processSqliteOne : processMongoOne;
  let count = 0;
  while (count < max && await processOne()) count++;
  return count;
}
function startDeliveryOutboxWorker() {
  const interval = Number(process.env.OUTBOX_POLL_MS) || 5000;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await drainOnce(); } catch (e) { console.error('[outbox] worker error:', e); }
    finally { running = false; }
  };
  tick();
  const timer = setInterval(tick, Math.max(interval, 1000));
  timer.unref?.();
  return () => clearInterval(timer);
}
module.exports = { drainOnce, startDeliveryOutboxWorker, nextDelay, reconcileAuthMirrors };
