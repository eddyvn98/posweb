// A decoder can lose focus for seconds while the physical barcode stays in place.
// Never infer physical removal from missing frames. A different code is accepted
// immediately; deliberately scanning the same code again requires explicit rearm.
export function createBarcodeGate() {
    let held = null
    return {
        observe(raw) {
            const code = String(raw || '').trim()
            if (!code || held === code) return { accepted: null, held }
            held = code
            return { accepted: code, held }
        },
        reset() { held = null }
    }
}
