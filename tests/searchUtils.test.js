import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    normalizeString,
    normalizeBarcode,
    getInitials,
    levenshteinDistance,
    isFuzzyMatch,
    matchProduct,
    sortSearchResults
} from '../src/lib/searchUtils.js'

describe('searchUtils - Vietnamese and Barcode Normalization', () => {
    it('normalizeString should remove Vietnamese accents and convert to lowercase', () => {
        assert.equal(normalizeString('Cà Phê Sữa Đá'), 'ca phe sua da')
        assert.equal(normalizeString('Đèn bàn LED'), 'den ban led')
        assert.equal(normalizeString('Bút lông bảng'), 'but long bang')
        assert.equal(normalizeString(''), '')
        assert.equal(normalizeString(null), '')
    })

    it('normalizeBarcode should clean whitespace and symbols', () => {
        assert.equal(normalizeBarcode(' 893-123 456 '), '893123456')
        assert.equal(normalizeBarcode('DEMO-001'), 'demo001')
        assert.equal(normalizeBarcode(''), '')
    })

    it('getInitials should extract first letter of words', () => {
        assert.equal(getInitials('Hanoi Beer'), 'hb')
        assert.equal(getInitials('Cà Phê Sữa'), 'cps')
        assert.equal(getInitials('Bút bi Thiên Long'), 'bbtl')
    })

    it('levenshteinDistance should measure string edit distances correctly', () => {
        assert.equal(levenshteinDistance('heineken', 'heineken'), 0)
        assert.equal(levenshteinDistance('heinken', 'heineken'), 1)
        assert.equal(levenshteinDistance('tiger', 'tigar'), 1)
    })

    it('isFuzzyMatch should allow small typos but reject distant words', () => {
        assert.equal(isFuzzyMatch('heineken', 'heinken'), true)
        assert.equal(isFuzzyMatch('coca', 'pepsi'), false)
    })
})

describe('searchUtils - matchProduct and sortSearchResults', () => {
    const products = [
        { id: '1', name: 'Bút bi Thiên Long TL-027', barcode: '8935001800361', price: 5000 },
        { id: '2', name: 'Bút gel mực tím Star', barcode: '8936122453771', price: 8000 },
        { id: '3', name: 'Sổ tay bìa da cao cấp', barcode: '8936014829936', price: 45000 },
        { id: '4', name: 'Bình nước giữ nhiệt Lock&Lock', barcode: '89300012', price: 159000 },
    ]

    it('matchProduct should find product by unaccented name', () => {
        assert.equal(matchProduct(products[0], 'thien long'), true)
        assert.equal(matchProduct(products[0], 'but bi'), true)
        assert.equal(matchProduct(products[1], 'muc tim'), true)
        assert.equal(matchProduct(products[2], 'so tay'), true)
    })

    it('matchProduct should find product by exact or partial barcode', () => {
        assert.equal(matchProduct(products[0], '8935001800361'), true)
        assert.equal(matchProduct(products[3], '89300012'), true)
        assert.equal(matchProduct(products[0], '99999999'), false)
    })

    it('matchProduct should find product by initials acronym', () => {
        assert.equal(matchProduct(products[0], 'bbtl'), true) // But Bi Thien Long
    })

    it('sortSearchResults should prioritize exact barcode and prefix matches', () => {
        const results = sortSearchResults(products, 'but')
        assert.equal(results[0].name.startsWith('Bút'), true)
    })
})
