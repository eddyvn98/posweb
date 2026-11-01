import { Camera, CheckCircle2, ShoppingCart, X } from 'lucide-react'
import BarcodeScanner from './BarcodeScanner'

export default function CameraScanSheet({ title, active, onDetected, onClose, summary, feedback, actionLabel = 'Xong' }) {
    if (!active) return null
    return (
        <div data-testid="camera-scan-sheet" role="dialog" aria-modal="true" aria-label={title}
            className="fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="flex w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl">
                <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                            <Camera className="h-5 w-5"/>
                        </span>
                        <div className="min-w-0">
                            <h2 className="truncate text-base font-bold text-slate-900">{title}</h2>
                            <p className="text-xs text-slate-500">Quét bằng camera điện thoại</p>
                        </div>
                    </div>
                    <button type="button" aria-label="Đóng camera" onClick={onClose}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <X className="h-5 w-5"/>
                    </button>
                </header>
                <BarcodeScanner onDetected={onDetected} active={active}/>
                <div aria-live="polite" className="border-t border-slate-100 bg-sky-50/70 px-4 py-3">
                    {feedback ? (
                        <div data-testid="camera-scan-feedback" className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                            <CheckCircle2 className="h-5 w-5 shrink-0"/><span className="min-w-0 truncate">{feedback}</span>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-600">Giữ mã trong khung để nhận diện. Mỗi lần đưa vào chỉ tính một lượt.</p>
                    )}
                </div>
                <footer className="flex items-center gap-3 border-t border-slate-100 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                    <div className="min-w-0 flex-1 text-sm font-semibold text-slate-700">{summary || 'Sẵn sàng quét'}</div>
                    <button type="button" onClick={onClose} className="min-h-12 shrink-0 rounded-xl bg-sky-600 px-5 text-sm font-bold text-white">
                        {actionLabel}
                    </button>
                </footer>
            </div>
        </div>
    )
}
