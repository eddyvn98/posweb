import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Logic replicated from ProductFormModal
function normalizePriceInput(val) {
    if (val === '' || val === null || val === undefined) return null
    const cleaned = String(val).trim().replace(',', '.')
    const num = Number(cleaned)
    if (isNaN(num)) return null
    if (num > 0 && num < 1000) return num * 1000
    return num
}

function validateProductPrices({ price, online_price, promo_price }) {
    const finalPrice = normalizePriceInput(price)
    const finalOnline = normalizePriceInput(online_price)
    const finalPromo = normalizePriceInput(promo_price)

    if (!finalPrice || finalPrice <= 0) {
        return { valid: false, error: 'Giá offline phải lớn hơn 0' }
    }

    const onlineBasePrice = finalOnline > 0 ? finalOnline : finalPrice
    if (finalPromo > 0 && finalPromo >= onlineBasePrice) {
        return { valid: false, error: 'Giá KM online phải thấp hơn giá online' }
    }

    return {
        valid: true,
        price: finalPrice,
        online_price: finalOnline,
        promo_price: finalPromo,
        effective_online_price: finalPromo > 0 ? finalPromo : onlineBasePrice
    }
}

describe('Price Input Parsing and Normalization', () => {
    it('should expand shortcut numbers (< 1000) to Vietnamese Dong thousands', () => {
        assert.equal(normalizePriceInput('35'), 35000)
        assert.equal(normalizePriceInput('12'), 12000)
        assert.equal(normalizePriceInput('150'), 150000)
        assert.equal(normalizePriceInput(50), 50000)
    })

    it('should keep standard prices (>= 1000) intact', () => {
        assert.equal(normalizePriceInput('35000'), 35000)
        assert.equal(normalizePriceInput('120000'), 120000)
        assert.equal(normalizePriceInput(45000), 45000)
    })

    it('should handle comma separated numbers', () => {
        assert.equal(normalizePriceInput('35,5'), 35500) // 35.5k = 35.500đ
        assert.equal(normalizePriceInput('45.000'), 45000)
    })

    it('should return null for empty or invalid inputs', () => {
        assert.equal(normalizePriceInput(''), null)
        assert.equal(normalizePriceInput(null), null)
        assert.equal(normalizePriceInput(undefined), null)
        assert.equal(normalizePriceInput('abc'), null)
    })
})

describe('Product Price Validation Rules', () => {
    it('should require a valid offline price', () => {
        const result = validateProductPrices({ price: '', online_price: '', promo_price: '' })
        assert.equal(result.valid, false)
        assert.equal(result.error, 'Giá offline phải lớn hơn 0')
    })

    it('should accept valid offline price with no online price', () => {
        const result = validateProductPrices({ price: '32', online_price: '', promo_price: '' })
        assert.equal(result.valid, true)
        assert.equal(result.price, 32000)
        assert.equal(result.online_price, null)
        assert.equal(result.effective_online_price, 32000) // Fallback to offline
    })

    it('should accept separate online price higher than offline price', () => {
        const result = validateProductPrices({ price: '30000', online_price: '38000', promo_price: '' })
        assert.equal(result.valid, true)
        assert.equal(result.price, 30000)
        assert.equal(result.online_price, 38000)
        assert.equal(result.effective_online_price, 38000)
    })

    it('should reject promo price higher than or equal to online price', () => {
        const result = validateProductPrices({ price: '30000', online_price: '40000', promo_price: '45000' })
        assert.equal(result.valid, false)
        assert.equal(result.error, 'Giá KM online phải thấp hơn giá online')

        const resultEqual = validateProductPrices({ price: '30000', online_price: '40000', promo_price: '40000' })
        assert.equal(resultEqual.valid, false)
    })

    it('should reject promo price higher than or equal to offline price when online price is empty', () => {
        const result = validateProductPrices({ price: '30000', online_price: '', promo_price: '30000' })
        assert.equal(result.valid, false)
        assert.equal(result.error, 'Giá KM online phải thấp hơn giá online')
    })

    it('should accept valid promo price lower than online base price', () => {
        const result = validateProductPrices({ price: '30000', online_price: '40000', promo_price: '32000' })
        assert.equal(result.valid, true)
        assert.equal(result.promo_price, 32000)
        assert.equal(result.effective_online_price, 32000)
    })
})
