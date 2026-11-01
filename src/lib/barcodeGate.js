// Prevent a camera from selling the same stationary barcode repeatedly.
// A different visible barcode is accepted immediately. The same barcode is
// accepted again only after it has been genuinely absent for a continuous span.
export function createBarcodeGate(releaseAfterMs = 1600) {
    let held = null
    let lastVisibleAt = 0
    return {
        observe(raw, now) {
            const code = String(raw || '').trim()
            if (code) {
                lastVisibleAt = now
                if (held === code) return { accepted: null, held }
                held = code
                return { accepted: code, held }
            }
            if (held && now - lastVisibleAt >= releaseAfterMs) held = null
            return { accepted: null, held }
        },
        reset() {
            held = null
            lastVisibleAt = 0
        }
    }
}
