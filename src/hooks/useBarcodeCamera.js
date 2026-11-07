import { useEffect, useRef, useState } from 'react'
import { readBarcodesFromImageData, setZXingModuleOverrides, prepareZXingModule } from 'zxing-wasm/reader'
import { createBarcodeGate } from '../lib/barcodeGate'

setZXingModuleOverrides({
    locateFile: path => path.endsWith('.wasm') ? '/zxing_reader.wasm' : path
})
if (typeof window !== 'undefined') {
    Promise.resolve().then(() => prepareZXingModule()).catch(() => {})
}

function getCameraMessage(error) {
    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        return 'Chưa cấp quyền camera. Hãy cho phép camera trong cài đặt trình duyệt.'
    }
    if (error?.name === 'NotFoundError') return 'Thiết bị không có camera khả dụng.'
    return 'Không thể mở camera. Hãy thử lại hoặc nhập mã bằng tay.'
}

export function useBarcodeCamera({ active, onDetected }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const gateRef = useRef(null)
    const callbackRef = useRef(onDetected)
    callbackRef.current = onDetected

    const [cameraFacing, setCameraFacing] = useState('environment')
    const [error, setError] = useState(null)
    const [hasTorch, setHasTorch] = useState(false)
    const [torchOn, setTorchOn] = useState(false)
    const [heldCode, setHeldCode] = useState(null)
    const [processingResult, setProcessingResult] = useState(false)
    const [restart, setRestart] = useState(0)

    useEffect(() => {
        if (!active) return undefined
        let stopped = false
        let frameId = null
        let processingFrame = false
        let lastFrameAt = 0
        let held = null
        const gate = createBarcodeGate()
        gateRef.current = gate
        const stop = () => {
            stopped = true
            if (frameId !== null) cancelAnimationFrame(frameId)
            streamRef.current?.getTracks().forEach(track => track.stop())
            streamRef.current = null
            if (videoRef.current) videoRef.current.srcObject = null
        }
        const schedule = () => {
            if (!stopped) frameId = requestAnimationFrame(scanFrame)
        }
        const scanFrame = async timestamp => {
            const video = videoRef.current
            const canvas = canvasRef.current
            if (stopped) return
            if (!video || !canvas || video.readyState < 2 || video.paused || video.ended) {
                schedule()
                return
            }
            if (processingFrame || timestamp - lastFrameAt < 60) {
                schedule()
                return
            }
            processingFrame = true
            lastFrameAt = timestamp
            try {
                let code = null
                if (detector) {
                    try {
                        const matches = await detector.detect(video)
                        code = matches?.[0]?.rawValue || null
                    } catch { /* ZXing is the fallback */ }
                }
                if (!code && !stopped && video.videoWidth && video.videoHeight) {
                    const ratio = Math.min(1, 800 / Math.max(video.videoWidth, video.videoHeight))
                    const w = Math.max(1, Math.floor(video.videoWidth * ratio))
                    const h = Math.max(1, Math.floor(video.videoHeight * ratio))
                    if (canvas.width !== w) canvas.width = w
                    if (canvas.height !== h) canvas.height = h
                    const ctx = canvas.getContext('2d', { willReadFrequently: true })
                    ctx.drawImage(video, 0, 0, w, h)
                    const matches = await readBarcodesFromImageData(ctx.getImageData(0, 0, w, h), {
                        tryHarder: true, tryRotate: true, tryInvert: true, maxNumberOfSymbols: 1
                    })
                    code = matches?.[0]?.text || null
                }
                if (stopped) return
                const result = gate.observe(code, performance.now())
                if (result.held !== held) {
                    held = result.held
                    setHeldCode(held)
                }
                if (result.accepted) {
                    setProcessingResult(true)
                    if (navigator.vibrate) {
                        try { navigator.vibrate(70) } catch { /* unsupported hardware */ }
                    }
                    try { await callbackRef.current?.(result.accepted) }
                    catch (err) { console.error('[BarcodeScanner] Scan callback failed:', err) }
                    finally { if (!stopped) setProcessingResult(false) }
                }
            } catch (err) {
                if (!stopped) console.debug('[BarcodeScanner] Frame decode failed:', err)
            } finally {
                processingFrame = false
                schedule()
            }
        }
        let detector = null
        if (typeof window.BarcodeDetector === 'function') {
            try {
                detector = new window.BarcodeDetector({
                    formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'code_93',
                        'codabar', 'upc_a', 'upc_e', 'itf', 'qr_code', 'data_matrix']
                })
            } catch { detector = null }
        }
        const start = async () => {
            setError(null)
            setHeldCode(null)
            setHasTorch(false)
            setTorchOn(false)
            if (!navigator.mediaDevices?.getUserMedia) {
                setError('Trình duyệt không hỗ trợ camera hoặc trang chưa dùng HTTPS.')
                return
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: cameraFacing },
                        width: { ideal: 1280, min: 640 },
                        height: { ideal: 720, min: 480 }
                    },
                    audio: false
                })
                if (stopped) {
                    stream.getTracks().forEach(track => track.stop())
                    return
                }
                streamRef.current = stream
                const video = videoRef.current
                if (!video) return
                video.srcObject = stream
                await video.play()
                if (stopped) return
                const track = stream.getVideoTracks()[0]
                setHasTorch(Boolean(track?.getCapabilities?.().torch))
                schedule()
            } catch (err) {
                if (!stopped) setError(getCameraMessage(err))
            }
        }
        start()
        return stop
    }, [active, cameraFacing, restart])

    const toggleTorch = async () => {
        const track = streamRef.current?.getVideoTracks()[0]
        if (!track || !hasTorch) return
        try {
            const enabled = !torchOn
            await track.applyConstraints({ advanced: [{ torch: enabled }] })
            setTorchOn(enabled)
        } catch { setError('Camera không hỗ trợ bật đèn flash.') }
    }

    return {
        videoRef, canvasRef, error, heldCode, processingResult,
        hasTorch, torchOn, toggleTorch,
        rearm: () => { gateRef.current?.reset(); setHeldCode(null) },
        toggleFacing: () => setCameraFacing(v => v === 'environment' ? 'user' : 'environment'),
        retry: () => setRestart(v => v + 1)
    }
}
