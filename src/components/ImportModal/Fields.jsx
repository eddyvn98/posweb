import { numberValue } from './utils'

export function Field({ label, name, value, onChange, type = 'text', readOnly = false }) {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
            <input type={type} name={name} value={value} onChange={onChange} readOnly={readOnly} className="input w-full" />
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
