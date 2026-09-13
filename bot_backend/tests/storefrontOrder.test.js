const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const MAX_ITEMS = 50;

function validateOrder(body, shopId, customerToken) {
    const customer = body.customer || {};
    const address = body.address || {};
    const paymentMethod = body.payment_method || body.paymentMethod;
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (!customerToken || !shopId) return 'Missing order scope';
    if (!String(customer.name || '').trim() || !String(customer.phone || '').trim()) return 'Missing recipient information';
    if (!String(address.address || '').trim() || !String(address.city || '').trim()) return 'Missing delivery address';
    if (!['cod', 'bank_transfer'].includes(paymentMethod)) return 'Invalid payment method';
    if (!rawItems.length || rawItems.length > MAX_ITEMS) return 'Invalid order items';

    const items = rawItems.map((item) => ({
        productId: String(item.product_id || item.productId || '').trim(),
        quantity: Number(item.quantity),
    }));
    if (items.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999)) {
        return 'Invalid order items';
    }

    const quantities = new Map();
    for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
    return { customer, address, paymentMethod, quantities };
}

describe('Storefront Online Order Validation Unit Tests', () => {
    const validShopId = 'shop-123';
    const validCustomerToken = 'token-uuid-123456789';

    const validPayload = {
        customer: { name: 'Nguyen Van A', phone: '0901234567' },
        address: { address: '302 Vuon Lai', city: 'Ho Chi Minh' },
        payment_method: 'cod',
        items: [{ product_id: 'prod-1', quantity: 2 }]
    };

    it('should approve valid order payload', () => {
        const result = validateOrder(validPayload, validShopId, validCustomerToken);
        assert.equal(typeof result, 'object');
        assert.equal(result.customer.name, 'Nguyen Van A');
        assert.equal(result.paymentMethod, 'cod');
        assert.equal(result.quantities.get('prod-1'), 2);
    });

    it('should reject order when shopId or customerToken is missing', () => {
        assert.equal(validateOrder(validPayload, '', validCustomerToken), 'Missing order scope');
        assert.equal(validateOrder(validPayload, validShopId, ''), 'Missing order scope');
    });

    it('should reject order when recipient name or phone is empty', () => {
        const badPayload = { ...validPayload, customer: { name: '', phone: '0901234567' } };
        assert.equal(validateOrder(badPayload, validShopId, validCustomerToken), 'Missing recipient information');

        const badPhone = { ...validPayload, customer: { name: 'Nguyen Van A', phone: '' } };
        assert.equal(validateOrder(badPhone, validShopId, validCustomerToken), 'Missing recipient information');
    });

    it('should reject order when delivery address is empty', () => {
        const badAddress = { ...validPayload, address: { address: '', city: 'HCM' } };
        assert.equal(validateOrder(badAddress, validShopId, validCustomerToken), 'Missing delivery address');
    });

    it('should reject order with unsupported payment method', () => {
        const badPayment = { ...validPayload, payment_method: 'crypto' };
        assert.equal(validateOrder(badPayment, validShopId, validCustomerToken), 'Invalid payment method');
    });

    it('should reject order with empty items or invalid quantities', () => {
        assert.equal(validateOrder({ ...validPayload, items: [] }, validShopId, validCustomerToken), 'Invalid order items');
        assert.equal(validateOrder({ ...validPayload, items: [{ product_id: 'p1', quantity: 0 }] }, validShopId, validCustomerToken), 'Invalid order items');
        assert.equal(validateOrder({ ...validPayload, items: [{ product_id: 'p1', quantity: -1 }] }, validShopId, validCustomerToken), 'Invalid order items');
        assert.equal(validateOrder({ ...validPayload, items: [{ product_id: 'p1', quantity: 1.5 }] }, validShopId, validCustomerToken), 'Invalid order items');
    });
});
