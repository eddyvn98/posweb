import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function BarcodeScanner({ onScan }) {
    const [error, setError] = useState('')
    const scannerRef = useRef(null)
    const isRunning = useRef(false)
    const lastScan = useRef(0)

    useEffect(() => {
        // Unique ID for this effect instance to prevent race conditions
        let isDefaultMounted = true

        const startScanner = async () => {
            // If DOM element missing, retry briefly or fail
            if (!document.getElementById('reader')) return

            try {
                // If we already have a scanner instance, clear it first
                if (scannerRef.current) {
                    await scannerRef.current.clear()
                }

                const html5QrcodeScanner = new Html5Qrcode("reader")
                scannerRef.current = html5QrcodeScanner

                await html5QrcodeScanner.start(
                    { facingMode: { ideal: "environment" } },
                    {
                        fps: 5,
                        qrbox: 200
                    },
                    (decodedText) => {
                        console.log('[Scanner] Detected:', decodedText)
                        const now = Date.now()
                        if (now - lastScan.current > 1500) {
                            lastScan.current = now
                            console.log('[Scanner] Calling onScan:', decodedText)
                            onScan(decodedText)
                        }
                    },
                    (errorMessage) => {
                        // Ignore error spam
                    }
                )

                if (isDefaultMounted) {
                    isRunning.current = true
                } else {
                    // Component unmounted while starting
                    if (html5QrcodeScanner.isScanning) {
                        await html5QrcodeScanner.stop()
                    }
                    html5QrcodeScanner.clear()
                }

            } catch (err) {
                if (isDefaultMounted) {
                    console.error('Camera Start Error', err)
                    setError('Lỗi Camera: ' + (err.message || 'Không thể truy cập'))
                }
            }
        }

        // Delay slighty to ensure div is rendered
        const timer = setTimeout(startScanner, 100)

        return () => {
            isDefaultMounted = false
            clearTimeout(timer)

            // Robust cleanup
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        scannerRef.current.stop()
                            .then(() => scannerRef.current.clear())
                            .catch(err => console.warn('Stop failed', err))
                    } else {
                        scannerRef.current.clear()
                    }
                } catch (e) {
                    console.warn('Cleanup failed', e)
                }
            }
        }
    }, [onScan])

    return (
        <div className="w-full relative bg-black rounded-lg overflow-hidden border border-gray-300 mb-1" style={{ height: '150px' }}>
            {error ? (
                <div className="text-white p-4 text-center text-xs flex items-center justify-center h-full bg-gray-800">
                    {error} <br /> (Nếu trên PC, hãy đảm bảo có Camera)
                </div>
            ) : (
                <>
                    <div id="reader" className="w-full h-full object-cover"></div>
                    {/* Frame Guides */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-primary/50 m-4 rounded opacity-50"></div>
                </>
            )}
        </div>
    )
}
