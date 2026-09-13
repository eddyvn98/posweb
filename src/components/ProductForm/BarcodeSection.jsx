import { QrCode } from '../Icons'

export default function BarcodeSection({ barcode, onChange, onGenerate, onBlur, onScanClick }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">Mã vạch</label>
            <div className="flex gap-2">
                <input
                    id="barcode-input"
                    className="input flex-1"
                    value={barcode}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                />
                <button
                    type="button"
                    onClick={onScanClick}
                    className="btn bg-primary/10 text-primary px-3 flex items-center justify-center gap-1.5"
                    title="Quét mã vạch"
                >
                    <QrCode className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase">Quét</span>
                </button>
                <button
                    type="button"
                    onClick={onGenerate}
                    className="btn bg-gray-100 text-xs px-2"
                >
                    Auto
                </button>
            </div>
        </div>
    )
}
