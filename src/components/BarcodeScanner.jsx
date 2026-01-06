import { Html5Qrcode } from "html5-qrcode"
import { useEffect, useRef } from "react"

export default function BarcodeScanner({ onDetected, active }) {
    const scannerRef = useRef(null)
    const isStartingRef = useRef(false)
    const lastScannedRef = useRef(null)

    const playBeep = () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 1000 // 1kHz beep
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
    }

    const onScanSuccess = (decodedText) => {
        if (!decodedText) return
        if (decodedText === lastScannedRef.current) return

        console.log('[BarcodeScanner] Detected:', decodedText)
        lastScannedRef.current = decodedText
        playBeep()
        onDetected(decodedText)
    }

    const onScanError = (err) => {
        console.log('[BarcodeScanner] Scan error:', err?.message || err)
    }

    useEffect(() => {
        const startScanner = async () => {
            if (!active) return
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
                        fps: 15,
                        qrbox: (vw, vh) => {
                        const width = Math.min(vw * 0.9, 420)
                        const height = Math.min(90, vh * 0.6)
                        return { width, height }
                        },
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

        const stopScanner = async () => {
            if (!scannerRef.current) return
            
            try {
                if (scannerRef.current.getState() === "SCANNING") {
                    await scannerRef.current.stop()
                    console.log('[BarcodeScanner] Camera stopped')
                }
            } catch (err) {
                console.warn("Camera stop error", err)
            }
        }

        if (active) {
            startScanner()
        } else {
            stopScanner()
        }

        return () => {
            stopScanner()
        }
    }, [active, onDetected])

    return <div id="reader" />
}
