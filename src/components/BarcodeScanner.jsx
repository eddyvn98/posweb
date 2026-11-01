import { AlertCircle, Camera, Check, Flashlight, FlashlightOff, RefreshCw, ScanLine } from 'lucide-react'
import { useBarcodeCamera } from '../hooks/useBarcodeCamera'
import { unlockAudio } from '../lib/soundUtils'
import { useEffect } from 'react'

export default function BarcodeScanner({ onDetected, active }) {
    const camera = useBarcodeCamera({ active, onDetected })
    useEffect(() => { if (active) unlockAudio() }, [active])
    const waiting = Boolean(camera.heldCode)
    return (
        <div data-testid="barcode-scanner" className="overflow-hidden bg-white">
            <div data-testid="barcode-viewfinder" className="relative h-[min(38dvh,300px)] min-h-[190px] bg-slate-950">
                <canvas ref={camera.canvasRef} className="hidden" />
                <video ref={camera.videoRef} playsInline autoPlay muted className="h-full w-full object-cover" />
                {!camera.error && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className={`relative h-[118px] w-[80%] max-w-[290px] rounded-2xl border-2 shadow-[0_0_0_999px_rgba(2,6,23,0.12)] ${waiting ? 'border-emerald-400' : 'border-sky-400'}`}>
                            <span className="absolute left-3 right-3 top-1/2 h-px bg-white/30" />
                            <ScanLine className={`absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-lg bg-slate-900 p-1 ${waiting ? 'text-emerald-300' : 'text-sky-300'}`} />
                        </div>
                    </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    Camera trực tiếp
                </span>
                {camera.error && (
                    <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/95 p-5 text-center text-white">
                        <AlertCircle className="h-8 w-8 text-amber-400" />
                        <p className="max-w-xs text-sm">{camera.error}</p>
                        <button type="button" onClick={camera.retry} className="min-h-11 rounded-xl bg-sky-600 px-6 text-sm font-bold text-white">Thử lại camera</button>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between gap-3 bg-white px-3 py-3 sm:px-4">
                <div aria-live="polite" className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        {waiting ? <Check className="h-4 w-4 shrink-0 text-emerald-600"/> : <ScanLine className="h-4 w-4 shrink-0 text-sky-600"/>}
                        <span>{camera.processingResult ? 'Đang xử lý mã...' : waiting ? 'Đã nhận mã vạch' : 'Sẵn sàng quét'}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                        {waiting ? 'Đưa mã ra khỏi khung rồi quét tiếp' : 'Đưa mã vạch vào giữa khung hình'}
                    </p>
                </div>
                <button
                    type="button"
                    aria-label={camera.torchOn ? 'Tắt đèn flash' : 'Bật đèn flash'}
                    title={camera.hasTorch ? 'Bật/tắt đèn' : 'Camera không hỗ trợ đèn'}
                    onClick={camera.toggleTorch}
                    disabled={!camera.hasTorch}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 disabled:opacity-40"
                >
                    {camera.torchOn ? <Flashlight className="h-5 w-5 text-amber-600"/> : <FlashlightOff className="h-5 w-5"/>}
                </button>
                <button type="button" aria-label="Đổi camera trước sau" title="Đổi camera"
                    onClick={camera.toggleFacing}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
                    <RefreshCw className="h-5 w-5"/>
                </button>
            </div>
        </div>
    )
}
