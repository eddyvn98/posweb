// Barcode gate: prevents repeated reads while a barcode is held stationary,
// accepts different barcodes immediately, and automatically re-arms once the
// barcode leaves the frame or after a brief release window (no manual rearm needed).
export function createBarcodeGate(releaseAfterMs = 1000) {
    let held = null
    let lastVisibleAt = 0
    return {
        observe(raw, now = performance.now()) {
            const code = String(raw || '').trim()
            if (code) {
                lastVisibleAt = now
                if (held === code) return { accepted: null, held }
                held = code
                return { accepted: code, held }
            }
            if (held && now - lastVisibleAt >= releaseAfterMs) {
                held = null
            }
            return { accepted: null, held }
        },
        reset() {
            held = null
            lastVisibleAt = 0
        }
    }
}
