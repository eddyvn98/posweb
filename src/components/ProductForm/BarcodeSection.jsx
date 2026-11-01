import { Camera } from 'lucide-react'

export default function BarcodeSection({ barcode, onChange, onGenerate, onBlur, onScan }) {
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
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                    placeholder="Quét hoặc nhập mã vạch..."
                />
                {onScan && (
                    <button
                        type="button"
                        onClick={onScan}
                        className="btn bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 text-xs px-2.5 flex items-center gap-1 font-bold rounded-xl active:scale-95 transition-all shrink-0"
                        title="Quét mã vạch bằng camera"
                    >
                        <Camera className="w-3.5 h-3.5 text-sky-600" />
                        <span>Quét</span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={onGenerate}
                    className="btn bg-gray-100 text-xs px-2 rounded-xl shrink-0"
                >
                    Auto
                </button>
            </div>
        </div>
    )
}
