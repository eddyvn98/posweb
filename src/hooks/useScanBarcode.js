import { useEffect, useRef } from 'react'

export function useScanBarcode({ onScan, enabled = true }) {
    const buffer = useRef('')
    const lastKeyTime = useRef(0)

    // Barcode scanners act like fast keyboard input followed by Enter
    // We detect fast typing (<50ms between keys)

    useEffect(() => {
        if (!enabled) return

        const handleKeyDown = (e) => {
            const now = Date.now()
            const char = e.key

            if (char === 'Enter') {
                if (buffer.current.length > 2) { // Min valid barcode length
                    onScan(buffer.current)
                    buffer.current = ''
                } else {
                    // Treat as normal enter if buffer too short
                }
                return
            }

            // Ignore special keys
            if (char.length > 1) return

            // Logic: Manual typing is slow, scanner is fast.
            // Reset buffer if too slow (likely manual typing)
            if (now - lastKeyTime.current > 100) {
                buffer.current = ''
            }

            buffer.current += char
            lastKeyTime.current = now
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [enabled, onScan])
}
