import { Html5Qrcode } from "html5-qrcode"
import { useEffect, useRef } from "react"

export default function BarcodeScanner({ onDetected, active }) {
    const scannerRef = useRef(null)
    const lastScannedRef = useRef(null)

    const onScanSuccess = (decodedText) => {
        if (!decodedText) return
        if (decodedText === lastScannedRef.current) return

        lastScannedRef.current = decodedText
        onDetected(decodedText)
    }

    const onScanError = () => {}

    useEffect(() => {
        if (!active) return

        const startScanner = async () => {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode("reader")
            }

            try {
                await scannerRef.current.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 240, height: 240 },
                        disableFlip: true
                    },
                    onScanSuccess,
                    onScanError
                )
            } catch (err) {
                console.error("Camera Start Error", err)
            }
        }

        startScanner()

        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop()
            }
        }
    }, [active, onDetected])

    return <div id="reader" />
}
