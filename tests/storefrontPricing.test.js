import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Storefront pricing logic matching ShopContext & storefront route
function getStorefrontPricing(product) {
    const apiOriginalPrice = Number(product?.original_price)
    if (apiOriginalPrice > Number(product?.price || 0)) {
        return {
            price: Number(product.price || 0),
            original_price: apiOriginalPrice,
            promo_price: Number(product.price || 0),
        }
    }
    const onlinePrice = Number(product?.online_price)
    const offlinePrice = Number(product?.price || 0)
    const originalPrice = onlinePrice > 0 ? onlinePrice : offlinePrice
    const promoPrice = Number(product?.promo_price)
    const hasPromotion = promoPrice > 0 && promoPrice < originalPrice
    return {
        price: hasPromotion ? promoPrice : originalPrice,
        original_price: hasPromotion ? originalPrice : null,
        promo_price: hasPromotion ? promoPrice : null,
    }
}

function calculateVoucherDiscount(voucher, subtotal) {
    if (!voucher || subtotal < Number(voucher.minSubtotal || 0)) return 0
    if (voucher.type === 'percent') {
        return Math.min(Math.round(subtotal * Number(voucher.value || 0) / 100), Number(voucher.maxDiscount || Infinity))
    }
    return Math.min(Number(voucher.value || 0), subtotal)
}

function calculateShippingFee(shop, subtotal) {
    const fee = Number(shop?.shipping_fee || 0)
    const threshold = Number(shop?.free_shipping_threshold || 0)
    if (!fee || (threshold > 0 && subtotal >= threshold)) return 0
    return fee
}

describe('Storefront Pricing Rules', () => {
    it('should use offline price when online_price is not set or null', () => {
        const product = { id: '1', name: 'Sản phẩm A', price: 50000, online_price: null }
        const result = getStorefrontPricing(product)
        assert.equal(result.price, 50000)
        assert.equal(result.original_price, null)
    })

    it('should use offline price when online_price is 0 or empty string', () => {
        const product1 = { id: '1', name: 'Sản phẩm A', price: 50000, online_price: 0 }
        const product2 = { id: '2', name: 'Sản phẩm B', price: 50000, online_price: '' }
        assert.equal(getStorefrontPricing(product1).price, 50000)
        assert.equal(getStorefrontPricing(product2).price, 50000)
    })

    it('should use online_price when explicitly set higher than offline price', () => {
        const product = { id: '1', name: 'Sản phẩm A', price: 50000, online_price: 60000 }
        const result = getStorefrontPricing(product)
        assert.equal(result.price, 60000)
        assert.equal(result.original_price, null)
    })

    it('should apply promotion when promo_price is lower than online base price', () => {
        const product = { id: '1', name: 'Sản phẩm A', price: 50000, online_price: 60000, promo_price: 45000 }
        const result = getStorefrontPricing(product)
        assert.equal(result.price, 45000)
        assert.equal(result.original_price, 60000)
    })

    it('should apply promotion against offline price when online_price is empty', () => {
        const product = { id: '1', name: 'Sản phẩm A', price: 50000, online_price: null, promo_price: 40000 }
        const result = getStorefrontPricing(product)
        assert.equal(result.price, 40000)
        assert.equal(result.original_price, 50000)
    })

    it('should ignore promo_price if greater than or equal to online base price', () => {
        const product = { id: '1', name: 'Sản phẩm A', price: 50000, online_price: 60000, promo_price: 70000 }
        const result = getStorefrontPricing(product)
        assert.equal(result.price, 60000)
        assert.equal(result.original_price, null)
    })
})

describe('Storefront Voucher Discounts', () => {
    const vouchers = {
        SAVE20K: { type: 'fixed', value: 20000, minSubtotal: 149000 },
        SHOP10: { type: 'percent', value: 10, maxDiscount: 30000, minSubtotal: 99000 },
        SAVE50K: { type: 'fixed', value: 50000, minSubtotal: 349000 }
    }

    it('should apply SAVE20K correctly for eligible subtotals', () => {
        assert.equal(calculateVoucherDiscount(vouchers.SAVE20K, 150000), 20000)
        assert.equal(calculateVoucherDiscount(vouchers.SAVE20K, 100000), 0)
    })

    it('should apply SHOP10 percentage with maximum discount cap', () => {
        // 10% of 200.000 is 20.000 (under 30.000 cap)
        assert.equal(calculateVoucherDiscount(vouchers.SHOP10, 200000), 20000)
        // 10% of 500.000 is 50.000, capped at 30.000
        assert.equal(calculateVoucherDiscount(vouchers.SHOP10, 500000), 30000)
        // Under minimum subtotal (99.000)
        assert.equal(calculateVoucherDiscount(vouchers.SHOP10, 80000), 0)
    })

    it('should apply SAVE50K for high value orders', () => {
        assert.equal(calculateVoucherDiscount(vouchers.SAVE50K, 400000), 50000)
        assert.equal(calculateVoucherDiscount(vouchers.SAVE50K, 300000), 0)
    })
})

describe('Storefront Shipping Fee Calculation', () => {
    const shop = {
        shipping_fee: 25000,
        free_shipping_threshold: 200000
    }

    it('should charge shipping fee when subtotal is below free shipping threshold', () => {
        assert.equal(calculateShippingFee(shop, 150000), 25000)
    })

    it('should waive shipping fee when subtotal meets or exceeds threshold', () => {
        assert.equal(calculateShippingFee(shop, 200000), 0)
        assert.equal(calculateShippingFee(shop, 350000), 0)
    })

    it('should return 0 when shop has no shipping fee configured', () => {
        assert.equal(calculateShippingFee({ shipping_fee: 0 }, 100000), 0)
        assert.equal(calculateShippingFee(null, 100000), 0)
    })
})
