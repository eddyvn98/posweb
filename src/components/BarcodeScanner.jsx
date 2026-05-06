import { useEffect, useRef, useState } from "react"
import { scanImageData } from "@undecaf/zbar-wasm/dist/inlined/index.mjs"

export default function BarcodeScanner({ onDetected, active }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const lastScannedRef = useRef(null)
    const lastScanTimeRef = useRef(0)
    const [error, setError] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    const playBeep = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.frequency.value = 1000
            oscillator.type = 'sine'

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.1)
        } catch (e) {
            console.warn("Beep failed", e)
        }
    }

    useEffect(() => {
        let stream = null
        let animationFrameId = null
        let isScanning = false

        const startCamera = async () => {
            try {
                // Try to get high resolution for better barcode detection
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: "environment",
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    setIsLoaded(true)
                }
            } catch (err) {
                console.error("Camera access error:", err)
                setError("Không thể truy cập camera. Vui lòng cấp quyền.")
            }
        }

        const tick = async () => {
            if (!active || !videoRef.current || isScanning) {
                animationFrameId = requestAnimationFrame(tick)
                return
            }

            const video = videoRef.current
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                const canvas = canvasRef.current
                if (!canvas) return
                
                const context = canvas.getContext('2d', { willReadFrequently: true })
                
                const sw = video.videoWidth
                const sh = video.videoHeight
                
                canvas.width = sw
                canvas.height = sh
                context.drawImage(video, 0, 0, sw, sh)

                try {
                    isScanning = true
                    const imageData = context.getImageData(0, 0, sw, sh)
                    const symbols = await scanImageData(imageData)
                    
                    if (symbols.length > 0) {
                        const now = Date.now()
                        const code = symbols[0].decode()
                        
                        // Prevent rapid fire of same code (1.5s cooldown for same barcode)
                        if (code !== lastScannedRef.current || (now - lastScanTimeRef.current > 1500)) {
                            lastScannedRef.current = code
                            lastScanTimeRef.current = now
                            playBeep()
                            onDetected(code)
                        }
                    }
                } catch (err) {
                    // Ignore scan errors
                } finally {
                    isScanning = false
                }
            }
            animationFrameId = requestAnimationFrame(tick)
        }

        if (active) {
            startCamera()
            animationFrameId = requestAnimationFrame(tick)
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [active, onDetected])

    return (
        <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden rounded-xl border border-gray-200">
            {error ? (
                <div className="text-white text-center p-6 bg-red-500/10 w-full h-full flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    <p className="text-xs font-bold text-red-500 max-w-[200px]">{error}</p>
                </div>
            ) : (
                <>
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* UI Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Dimmed background around scan area */}
                        <div className="absolute inset-0 bg-black/30"></div>
                        
                        {/* Scan Area Box */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[40%] bg-transparent rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] border border-white/20">
                            {/* Corners */}
                            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-md"></div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-md"></div>
                            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-md"></div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-md"></div>
                            
                            {/* Scanning line animation */}
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_15px_rgba(233,30,99,0.8)] animate-scan"></div>
                        </div>
                        
                        <div className="absolute bottom-4 left-0 right-0 text-center flex flex-col items-center gap-2">
                            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-white/10">
                                CÔNG NGHỆ QUÉT MÃ VẠCH, QR NGAY TRÊN WEB ĐỘC QUYỀN
                            </span>
                            <p className="text-[10px] text-white/60 font-bold uppercase tracking-tight">Đưa mã vạch vào khung để quét</p>
                        </div>
                    </div>

                    {!isLoaded && (
                        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                <span className="text-[10px] text-white font-black uppercase tracking-widest animate-pulse">Đang khởi động camera...</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
