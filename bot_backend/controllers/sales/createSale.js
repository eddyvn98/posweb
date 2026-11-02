const { getSalesRepo } = require('../../repositories/sales.repo');
async function createSale(req, res) {
  const { shop_id, id: user_id } = req.user;
  try {
    const outcome = await getSalesRepo().createSale(shop_id, user_id, req.body, { withMeta: true });
    // Email/Sheets are delivered asynchronously by the durable outbox worker.
    res.json({ success: true, id: outcome.id });
  } catch (error) {
    console.error('Create Sale Error:', error);
    const status = [400, 403, 409].includes(error.status) ? error.status : 500;
    res.status(status).json({ error: status === 500 ? 'Internal Server Error' : error.message });
  }
}
module.exports = createSale;
