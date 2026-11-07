import { AlertCircle, Camera, Check, Flashlight, FlashlightOff, RefreshCw, ScanLine } from 'lucide-react'
import { useBarcodeCamera } from '../hooks/useBarcodeCamera'
import { unlockAudio } from '../lib/soundUtils'
import { useEffect } from 'react'

export default function BarcodeScanner({ onDetected, active }) {
    const camera = useBarcodeCamera({ active, onDetected })
    useEffect(() => { if (active) unlockAudio() }, [active])
    const waiting = Boolean(camera.heldCode)
    return (
        <div data-testid="barcode-scanner" className="relative overflow-hidden bg-slate-950">
            <div data-testid="barcode-viewfinder" className="relative h-[min(36dvh,260px)] min-h-[170px] bg-slate-950">
                <canvas ref={camera.canvasRef} className="hidden" />
                <video ref={camera.videoRef} playsInline autoPlay muted className="h-full w-full object-cover" />
                {!camera.error && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className={`relative h-[105px] w-[80%] max-w-[280px] rounded-2xl border-2 shadow-[0_0_0_999px_rgba(2,6,23,0.18)] transition-colors duration-200 ${waiting ? 'border-emerald-400' : 'border-sky-400'}`}>
                            <span className="absolute left-3 right-3 top-1/2 h-px bg-white/30" />
                            <ScanLine className={`absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-lg bg-slate-900 p-1 ${waiting ? 'text-emerald-300' : 'text-sky-300'}`} />
                        </div>
                    </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md shadow-sm flex items-center gap-1.5 border border-white/10">
                    <span className={`inline-block h-2 w-2 rounded-full ${waiting ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span>{waiting ? 'Đã nhận mã' : 'Camera'}</span>
                </span>

                {/* Floating Torch & Flip Controls */}
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
                    <button
                        type="button"
                        aria-label={camera.torchOn ? 'Tắt đèn flash' : 'Bật đèn flash'}
                        title={camera.hasTorch ? (camera.torchOn ? 'Tắt đèn flash' : 'Bật đèn flash') : 'Camera không hỗ trợ đèn flash'}
                        onClick={camera.toggleTorch}
                        disabled={!camera.hasTorch}
                        className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md border transition-all active:scale-95 shadow-md disabled:opacity-40 ${
                            camera.torchOn
                                ? 'bg-amber-500/90 text-white border-amber-300'
                                : 'bg-slate-900/70 hover:bg-slate-900/90 text-white/90 border-white/20'
                        }`}
                    >
                        {camera.torchOn ? <Flashlight className="h-4 w-4 text-white"/> : <FlashlightOff className="h-4 w-4"/>}
                    </button>
                    <button
                        type="button"
                        aria-label="Đổi camera trước sau"
                        title="Đổi camera trước/sau"
                        onClick={camera.toggleFacing}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/70 hover:bg-slate-900/90 text-white/90 backdrop-blur-md border border-white/20 shadow-md transition-all active:scale-95"
                    >
                        <RefreshCw className="h-4 w-4"/>
                    </button>
                </div>

                {camera.error && (
                    <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/95 p-5 text-center text-white z-30">
                        <AlertCircle className="h-8 w-8 text-amber-400" />
                        <p className="max-w-xs text-sm">{camera.error}</p>
                        <button type="button" onClick={camera.retry} className="min-h-11 rounded-xl bg-sky-600 px-6 text-sm font-bold text-white">Thử lại camera</button>
                    </div>
                )}
            </div>
        </div>
    )
}
