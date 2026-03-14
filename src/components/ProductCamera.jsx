import { useRef, useEffect, useState } from 'react'

export default function ProductCamera({ onCapture }) {
    const videoRef = useRef(null)
    const [stream, setStream] = useState(null)
    const [error, setError] = useState(null)
    const [isCameraActive, setIsCameraActive] = useState(false)

    const startCamera = async () => {
        try {
            setError(null)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            })
            setStream(mediaStream)
            setIsCameraActive(true)
        } catch (err) {
            console.error('Lỗi camera:', err)
            setError('Không thể mở camera. Vui lòng kiểm tra quyền truy cập.')
        }
    }

    useEffect(() => {
        if (isCameraActive && stream && videoRef.current) {
            videoRef.current.srcObject = stream
        }
    }, [isCameraActive, stream])

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
        setIsCameraActive(false)
    }

    const capturePhoto = () => {
        if (!videoRef.current) return

        const video = videoRef.current
        const size = Math.min(video.videoWidth, video.videoHeight)
        const startX = (video.videoWidth - size) / 2
        const startY = (video.videoHeight - size) / 2

        const canvas = document.createElement('canvas')
        canvas.width = 600
        canvas.height = 600
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, startX, startY, size, size, 0, 0, 600, 600)

        const base64 = canvas.toDataURL('image/jpeg', 0.8)
        onCapture(base64)
        stopCamera()
    }

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [stream])

    if (!isCameraActive) {
        return (
            <div className="flex justify-center py-2">
                <div
                    className="w-24 h-24 bg-gray-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary transition-colors cursor-pointer group shadow-sm"
                    onClick={startCamera}
                >
                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">📸</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter text-center px-1">Chụp ảnh</span>
                    {error && <p className="absolute -bottom-6 text-[10px] text-red-500 w-full text-center">{error}</p>}
                </div>
            </div>
        )
    }

    return (
        <div className="flex justify-center py-2">
            <div className="relative w-48 h-48 bg-black rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none rounded-full scale-150"></div>

                <div className="absolute bottom-2 left-0 right-0 flex justify-around items-center px-4">
                    <button
                        type="button"
                        onClick={stopCamera}
                        className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white text-sm active:scale-90 transition-all border border-white/20"
                    >
                        ✕
                    </button>
                    <button
                        type="button"
                        onClick={capturePhoto}
                        className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95 transition-all shadow-2xl"
                    >
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-lg">
                            📸
                        </div>
                    </button>
                    <div className="w-8"></div>
                </div>
            </div>
        </div>
    )
}
