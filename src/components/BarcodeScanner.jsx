import { Html5Qrcode } from "html5-qrcode"
import { useEffect, useRef } from "react"

export default function BarcodeScanner({ onDetected, active }) {
    const scannerRef = useRef(null)
    const isStartingRef = useRef(false)
    const lastScannedRef = useRef(null)

    const onScanSuccess = (decodedText) => {
        if (!decodedText) return
        if (decodedText === lastScannedRef.current) return

        console.log('[BarcodeScanner] Detected:', decodedText)
        lastScannedRef.current = decodedText
        onDetected(decodedText)
    }

    const onScanError = (err) => {
        console.log('[BarcodeScanner] Scan error:', err?.message || err)
    }

    useEffect(() => {
        if (!active) return

        const startScanner = async () => {
            if (isStartingRef.current) return
            isStartingRef.current = true

            try {
                if (!scannerRef.current) {
                    scannerRef.current = new Html5Qrcode("reader")
                }

                // ⛔ nếu đang scan thì KHÔNG start lại
                if (scannerRef.current.getState() === "SCANNING") {
                    isStartingRef.current = false
                    return
                }

                await scannerRef.current.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 240, height: 240 },
                        aspectRatio: 1.0,
                        disableFlip: true
                    },
                    onScanSuccess,
                    onScanError
                )
            } catch (err) {
                console.error("Camera Start Error", err)
            } finally {
                isStartingRef.current = false
            }
        }

        startScanner()

        return () => {
            if (
                scannerRef.current &&
                scannerRef.current.getState() === "SCANNING"
            ) {
                scannerRef.current
                    .stop()
                    .then(() => {
                        // Stop completed successfully
                    })
                    .catch((err) => {
                        console.warn("Camera stop error", err)
                    })
            }
        }
    }, [active, onDetected])

    return <div id="reader" />
}
