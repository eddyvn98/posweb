import test from 'node:test'
import assert from 'node:assert/strict'
import { createBarcodeGate } from '../src/lib/barcodeGate.js'

test('holding same barcode in frame for 10 seconds emits exactly once', () => {
    const gate = createBarcodeGate()
    let accepted = 0
    for (let t = 0; t <= 10000; t += 85) {
        if (gate.observe('ABC123', t).accepted) accepted++
    }
    assert.equal(accepted, 1)
})

test('brief recognition losses do not re-add a barcode', () => {
    const gate = createBarcodeGate()
    assert.equal(gate.observe('A', 0).accepted, 'A')
    for (let t = 85; t < 1100; t += 85) gate.observe(null, t)
    assert.equal(gate.observe('A', 1200).accepted, null)
})

test('same barcode can be scanned again after leaving frame', () => {
    const gate = createBarcodeGate()
    assert.equal(gate.observe('A', 0).accepted, 'A')
    assert.equal(gate.observe(null, 1000).accepted, null)
    assert.equal(gate.observe(null, 1601).held, null)
    assert.equal(gate.observe('A', 1800).accepted, 'A')
})

test('another barcode is accepted immediately', () => {
    const gate = createBarcodeGate()
    assert.equal(gate.observe('A', 0).accepted, 'A')
    assert.equal(gate.observe('B', 85).accepted, 'B')
    assert.equal(gate.observe('B', 170).accepted, null)
})
