import React, { useState } from 'react'
import { Plus, X, Tag } from '../Icons'
import SelectionModal from '../Common/SelectionModal'

export default function ClassificationSection({ 
    classifications = {}, 
    onChange,
    existingClassifications = {} // { label: [values] }
}) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false)
    
    const [tempLabel, setTempLabel] = useState('')
    
    // Common labels for suggestions
    const commonLabels = [
        { id: '1', name: 'Nhóm con' },
        { id: '2', name: 'Hãng' },
        { id: '3', name: 'Loại' },
        { id: '4', name: 'Chất liệu' },
        { id: '5', name: 'Mùa' }
    ]

    const handleAddClassification = (label) => {
        setTempLabel(label)
        setIsLabelModalOpen(false)
        setIsAddModalOpen(true)
    }

    const handleValueSelect = (value) => {
        const next = { ...classifications, [tempLabel]: value }
        onChange(next)
        setIsAddModalOpen(false)
    }

    const removeClassification = (label) => {
        const next = { ...classifications }
        delete next[label]
        onChange(next)
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {Object.entries(classifications).map(([label, value]) => (
                    <div 
                        key={label} 
                        className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 pl-2.5 pr-1.5 py-1.5 rounded-xl animate-in fade-in zoom-in duration-200"
                    >
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}:</span>
                        <span className="text-xs font-bold text-gray-700">{value}</span>
                        <button 
                            type="button" 
                            onClick={() => removeClassification(label)}
                            className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
                
                <button
                    type="button"
                    onClick={() => setIsLabelModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-gray-300 text-gray-400 hover:text-primary hover:border-primary transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-tight">Thêm phân loại</span>
                </button>
            </div>

            {/* Modal chọn Nhãn (Label) */}
            <SelectionModal
                isOpen={isLabelModalOpen}
                onClose={() => setIsLabelModalOpen(false)}
                title="Chọn loại phân loại"
                options={commonLabels}
                onSelect={handleAddClassification}
                onCreate={(name) => handleAddClassification(name)}
                emptyText="Hãy chọn hoặc tạo nhãn (ví dụ: Hãng, Loại...)"
            />

            {/* Modal chọn Giá trị (Value) */}
            <SelectionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`Chọn giá trị cho ${tempLabel}`}
                options={(existingClassifications[tempLabel] || []).map(v => ({ id: v, name: v }))}
                onSelect={handleValueSelect}
                onCreate={handleValueSelect}
                emptyText={`Nhập giá trị cho ${tempLabel}`}
            />
        </div>
    )
}
