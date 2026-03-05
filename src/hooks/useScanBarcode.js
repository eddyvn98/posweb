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

            // Barcode scanners usually end with 'Enter'
            if (char === 'Enter') {
                if (buffer.current.length >= 3) {
                    onScan(buffer.current)
                    buffer.current = ''
                    e.preventDefault()
                } else {
                    buffer.current = ''
                }
                return
            }

            // Ignore system/control keys
            if (!char || char.length > 1) return

            // Logic: Manual typing is slow, scanner is fast.
            // Bluetooth scanners might have slight jitter, so 200ms is safer than 50ms-100ms
            if (now - lastKeyTime.current > 200) {
                buffer.current = ''
            }

            buffer.current += char
            lastKeyTime.current = now
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [enabled, onScan])
}
