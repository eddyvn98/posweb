const DeliveryOutbox = require('../mongo/models/DeliveryOutbox');

function sqliteEnqueue(db, event) {
  db.prepare(`INSERT OR IGNORE INTO delivery_outbox
    (event_key, kind, shop_id, payload, status, attempts, next_attempt_at, created_at)
    VALUES (?, ?, ?, ?, 'pending', 0, ?, ?)`
  ).run(event.event_key, event.kind, event.shop_id, JSON.stringify(event.payload), Date.now(), Date.now());
}

async function mongoEnqueue(event, session) {
  await DeliveryOutbox.updateOne(
    { event_key: event.event_key },
    { $setOnInsert: { ...event, status: 'pending', attempts: 0, next_attempt_at: new Date(), created_at: new Date() } },
    { upsert: true, session }
  );
}

function saleEvents(shop_id, sale) {
  return [
    { event_key: `sheet:sale:${sale.id}`, kind: 'sheet_sale', shop_id, payload: { sale } },
    { event_key: `sheet:cash:${sale.id}`, kind: 'sheet_cash', shop_id, payload: {
      amount: sale.total_amount, type: 'in', category: 'sale',
      description: `Thu tien ban hang don ${sale.code}`, ref_id: sale.id, created_at: sale.sale_date
    } }
  ];
}

function voidEvent(shop_id, saleId, reason) {
  return { event_key: `sheet:void:${saleId}`, kind: 'sheet_void', shop_id,
    payload: { saleId, reason } };
}
module.exports = { sqliteEnqueue, mongoEnqueue, saleEvents, voidEvent };
