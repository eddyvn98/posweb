import SmartPriceInput from '../Common/SmartPriceInput'
import { numberValue } from './utils'

export function Field({ label, name, value, onChange, onBlur, type = 'text', readOnly = false }) {
    const handleBlur = (e) => {
        if (onBlur) onBlur(e)
        if (type === 'number' && onChange) {
            const num = numberValue(e.target.value)
            if (num > 0 && num < 1000) {
                onChange({ target: { name, value: num * 1000 } })
            }
        }
    }

    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
            {type === 'number' && !readOnly ? (
                <SmartPriceInput
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={handleBlur}
                    className="input w-full px-3 h-11"
                    inputClassName="font-mono text-sm font-bold text-gray-800"
                    suffixClassName="font-mono text-sm font-bold text-gray-400 opacity-60"
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={handleBlur}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                    readOnly={readOnly}
                    className="input w-full"
                />
            )}
            {type === 'number' && numberValue(value) > 0 && (
                <div className="text-[10px] font-bold text-primary mt-1">
                    = {new Intl.NumberFormat('vi-VN').format(numberValue(value) < 1000 ? numberValue(value) * 1000 : numberValue(value))} đ
                </div>
            )}
        </div>
    )
}

export function SelectField({ label, name, value, onChange, options }) {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
            <select name={name} value={value} onChange={onChange} className="input w-full">
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    )
}

export function SummaryRow({ label, value, tone, accent, strong }) {
    return (
        <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${tone || ''}`}>
            <span className={`text-gray-700 ${strong ? 'font-black' : 'font-medium'}`}>{label}</span>
            <span className={`${accent || 'text-gray-800'} ${strong ? 'font-black' : 'font-bold'}`}>
                {new Intl.NumberFormat('vi-VN').format(numberValue(value))} đ
            </span>
        </div>
    )
}
