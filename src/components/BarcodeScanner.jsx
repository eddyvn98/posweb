import { useEffect, useRef, useState } from "react"
import { playBeep, unlockAudio } from "../lib/soundUtils"
import { Flashlight, FlashlightOff, RefreshCw, AlertCircle } from "lucide-react"
import { readBarcodesFromImageData, setZXingModuleOverrides, prepareZXingModule } from "zxing-wasm/reader"

// Configure ZXing WASM module location
setZXingModuleOverrides({
    locateFile: (path) => path.endsWith('.wasm') ? '/zxing_reader.wasm' : path
})

// Eagerly prepare WASM in background safely
try {
    if (typeof window !== 'undefined') {
        prepareZXingModule()
    }
} catch (e) {
    console.warn('[BarcodeScanner] ZXing WASM preload error:', e)
}

export default function BarcodeScanner({ onDetected, active }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const animFrameRef = useRef(null)
    const isProcessingRef = useRef(false)
    const lastScannedRef = useRef(null)
    const scanCooldownTimerRef = useRef(null)

    const [hasTorch, setHasTorch] = useState(false)
    const [isTorchOn, setIsTorchOn] = useState(false)
    const [cameraFacing, setCameraFacing] = useState("environment")
    const [cameraError, setCameraError] = useState(null)
    const [isDetecting, setIsDetecting] = useState(false)

    // Unlock audio on active
    useEffect(() => {
        if (active) {
            unlockAudio()
        }
    }, [active])

    // Handle barcode detection
    const handleDetected = (text) => {
        const cleanText = (text || '').trim()
        if (!cleanText) return
        if (cleanText === lastScannedRef.current) return

        console.log('[BarcodeScanner WASM] Scanned:', cleanText)
        lastScannedRef.current = cleanText

        // Cooldown 1.5s then allow scanning same barcode again
        if (scanCooldownTimerRef.current) clearTimeout(scanCooldownTimerRef.current)
        scanCooldownTimerRef.current = setTimeout(() => {
            if (lastScannedRef.current === cleanText) {
                lastScannedRef.current = null
            }
        }, 1500)

        // Haptic feedback (vibration)
        if (navigator.vibrate) {
            try { navigator.vibrate(100) } catch (e) {}
        }

        playBeep('success')
        onDetected(cleanText)
    }

    // Start camera stream
    const startCamera = async () => {
        stopCamera()
        setCameraError(null)

        try {
            const constraints = {
                video: {
                    facingMode: { ideal: cameraFacing },
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                },
                audio: false
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }

            // Check torch / flashlight support
            const videoTrack = stream.getVideoTracks()[0]
            if (videoTrack) {
                const capabilities = videoTrack.getCapabilities?.() || {}
                if (capabilities.torch) {
                    setHasTorch(true)
                }
            }

            // Start detection loop
            startScanningLoop()
        } catch (err) {
            console.error('[BarcodeScanner] Camera access error:', err)
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setCameraError('Trình duyệt chưa được cấp quyền sử dụng Camera. Vui lòng cho phép quyền Camera.')
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setCameraError('Không tìm thấy Camera trên thiết bị này.')
            } else {
                setCameraError(`Lỗi khởi động Camera: ${err.message || 'Không thể mở Camera'}`)
            }
        }
    }

    // Stop camera stream & release hardware
    const stopCamera = () => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current)
            animFrameRef.current = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop()
            })
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setIsTorchOn(false)
        setHasTorch(false)
        setIsDetecting(false)
    }

    // Toggle Flashlight (Torch)
    const toggleTorch = async () => {
        if (!streamRef.current) return
        const videoTrack = streamRef.current.getVideoTracks()[0]
        if (!videoTrack) return

        try {
            const nextState = !isTorchOn
            await videoTrack.applyConstraints({
                advanced: [{ torch: nextState }]
            })
            setIsTorchOn(nextState)
        } catch (e) {
            console.warn('[BarcodeScanner] Torch toggle error:', e)
        }
    }

    // Toggle Camera Facing (environment <-> user)
    const toggleCamera = () => {
        setCameraFacing(prev => prev === "environment" ? "user" : "environment")
    }

    // High performance scanning loop: Native BarcodeDetector + ZXing WASM
    const startScanningLoop = () => {
        // Native BarcodeDetector instance if supported by browser
        let nativeDetector = null
        if ('BarcodeDetector' in window) {
            try {
                nativeDetector = new window.BarcodeDetector({
                    formats: [
                        'ean_13', 'ean_8', 'code_128', 'code_39', 'code_93',
                        'codabar', 'upc_a', 'upc_e', 'itf', 'qr_code', 'data_matrix'
                    ]
                })
            } catch (e) {
                nativeDetector = null
            }
        }

        let lastScanTime = 0
        const SCAN_INTERVAL_MS = 80 // ~12 fps for optimal battery and instant recognition

        const scanFrame = async (timestamp) => {
            const video = videoRef.current
            const canvas = canvasRef.current

            if (!video || !canvas || video.readyState < 2 || video.paused || video.ended) {
                animFrameRef.current = requestAnimationFrame(scanFrame)
                return
            }

            if (timestamp - lastScanTime >= SCAN_INTERVAL_MS && !isProcessingRef.current) {
                lastScanTime = timestamp
                isProcessingRef.current = true
                setIsDetecting(true)

                try {
                    let detectedCode = null

                    // 1. Try Native BarcodeDetector first (Hardware accelerated GPU/NPU on Chrome Android)
                    if (nativeDetector) {
                        try {
                            const barcodes = await nativeDetector.detect(video)
                            if (barcodes && barcodes.length > 0) {
                                detectedCode = barcodes[0].rawValue
                            }
                        } catch (e) {
                            // Fallback to WASM
                        }
                    }

                    // 2. If not detected by native, run ZXing WebAssembly C++ engine
                    if (!detectedCode) {
                        const vw = video.videoWidth
                        const vh = video.videoHeight
                        if (vw > 0 && vh > 0) {
                            // Scale down if frame is huge to keep WASM scanning sub-10ms
                            const maxDim = 800
                            let targetW = vw
                            let targetH = vh
                            if (Math.max(vw, vh) > maxDim) {
                                const ratio = maxDim / Math.max(vw, vh)
                                targetW = Math.floor(vw * ratio)
                                targetH = Math.floor(vh * ratio)
                            }

                            if (canvas.width !== targetW || canvas.height !== targetH) {
                                canvas.width = targetW
                                canvas.height = targetH
                            }

                            const ctx = canvas.getContext('2d', { willReadFrequently: true })
                            ctx.drawImage(video, 0, 0, targetW, targetH)
                            const imageData = ctx.getImageData(0, 0, targetW, targetH)

                            const wasmResults = await readBarcodesFromImageData(imageData, {
                                tryHarder: true,
                                tryRotate: true,
                                tryInvert: true,
                                maxNumberOfSymbols: 1
                            })

                            if (wasmResults && wasmResults.length > 0) {
                                detectedCode = wasmResults[0].text
                            }
                        }
                    }

                    if (detectedCode) {
                        handleDetected(detectedCode)
                    }
                } catch (err) {
                    console.debug('[BarcodeScanner] Frame process error:', err)
                } finally {
                    isProcessingRef.current = false
                }
            }

            animFrameRef.current = requestAnimationFrame(scanFrame)
        }

        animFrameRef.current = requestAnimationFrame(scanFrame)
    }

    // Effect: Mount & active change
    useEffect(() => {
        if (active) {
            startCamera()
        } else {
            stopCamera()
        }

        return () => {
            stopCamera()
            if (scanCooldownTimerRef.current) clearTimeout(scanCooldownTimerRef.current)
        }
    }, [active, cameraFacing])

    return (
        <div className="relative w-full h-full min-h-[220px] max-h-[320px] bg-black flex items-center justify-center overflow-hidden select-none">
            {/* Hidden canvas for image data extraction */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Live Video Element */}
            <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
            />

            {/* Error Message */}
            {cameraError && (
                <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center z-20">
                    <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
                    <p className="text-white text-xs font-medium max-w-xs leading-relaxed">{cameraError}</p>
                    <button
                        onClick={startCamera}
                        className="mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* Viewfinder Target & Laser Animation */}
            {!cameraError && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-[80%] max-w-[280px] h-[130px] border-2 border-sky-400/90 rounded-2xl relative shadow-[0_0_20px_rgba(56,189,248,0.25)]">
                        {/* Scanning Laser Beam */}
                        <div className="scanner-laser" />
                        
                        {/* Corner Accents */}
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-sky-300 rounded-tl-lg" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-sky-300 rounded-tr-lg" />
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-sky-300 rounded-bl-lg" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-sky-300 rounded-br-lg" />
                    </div>
                </div>
            )}

            {/* Quick Controls Overlay (Top Right: Torch & Switch Cam) */}
            {!cameraError && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    {hasTorch && (
                        <button
                            type="button"
                            onClick={toggleTorch}
                            className={`p-2 rounded-full backdrop-blur-md transition-all ${
                                isTorchOn ? 'bg-amber-400 text-slate-900' : 'bg-black/40 text-white hover:bg-black/60'
                            }`}
                            title={isTorchOn ? "Tắt đèn flash" : "Bật đèn flash"}
                        >
                            {isTorchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={toggleCamera}
                        className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all active:scale-90"
                        title="Đổi camera trước/sau"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Engine Indicator Pill (Bottom Center) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] text-sky-300 font-mono flex items-center gap-1.5 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ZXing WebAssembly (WASM)</span>
            </div>
        </div>
    )
}
