export default function BarcodeSection({ barcode, onChange, onGenerate, onBlur }) {
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
                    onClick={onGenerate}
                    className="btn bg-gray-100 text-xs px-2"
                >
                    Auto
                </button>
            </div>
        </div>
    )
}
