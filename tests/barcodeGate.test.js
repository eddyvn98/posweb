import test from 'node:test'
import assert from 'node:assert/strict'
import { createBarcodeGate } from '../src/lib/barcodeGate.js'

test('holding same barcode in frame for 10 seconds emits exactly once', () => {
    const gate = createBarcodeGate(1000)
    let accepted = 0
    for (let t = 0; t <= 10000; t += 85) {
        if (gate.observe('ABC123', t).accepted) accepted++
    }
    assert.equal(accepted, 1)
})

test('brief recognition losses do not re-add a barcode', () => {
    const gate = createBarcodeGate(1000)
    assert.equal(gate.observe('A', 0).accepted, 'A')
    for (let t = 85; t < 800; t += 85) gate.observe(null, t)
    assert.equal(gate.observe('A', 900).accepted, null)
})

test('same barcode can be scanned again after leaving frame', () => {
    const gate = createBarcodeGate(1000)
    assert.equal(gate.observe('A', 0).accepted, 'A')
    assert.equal(gate.observe(null, 500).accepted, null)
    assert.equal(gate.observe(null, 1100).held, null)
    assert.equal(gate.observe('A', 1200).accepted, 'A')
})

test('reset clears held barcode immediately', () => {
    const gate = createBarcodeGate(1000)
    assert.equal(gate.observe('A', 0).accepted, 'A')
    gate.reset()
    assert.equal(gate.observe('A', 50).accepted, 'A')
})

test('another barcode is accepted immediately', () => {
    const gate = createBarcodeGate(1000)
    assert.equal(gate.observe('A', 0).accepted, 'A')
    assert.equal(gate.observe('B', 85).accepted, 'B')
    assert.equal(gate.observe('B', 170).accepted, null)
})
