import React, { useState } from 'react'
import SelectionModal from '../Common/SelectionModal'

export default function UnitSection({ units, selectedUnit, onChange, onCreate, onEdit, onDelete }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const DEFAULT_UNIT = 'Cái'

    return (
        <>
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="input w-full p-2 h-11 text-left flex items-center justify-between bg-white cursor-pointer hover:border-primary active:scale-[0.98] transition-all"
            >
                <span className={selectedUnit ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {selectedUnit || DEFAULT_UNIT}
                </span>
                <span className="text-gray-400 text-xs">▼</span>
            </button>

            <SelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Chọn đơn vị tính"
                options={units.length > 0 ? units : [{ id: 'default', name: DEFAULT_UNIT }]}
                selectedValue={selectedUnit || DEFAULT_UNIT}
                onSelect={onChange}
                onCreate={onCreate}
                onEdit={onEdit}
                onDelete={onDelete}
                emptyText="Chưa có đơn vị nào"
            />
        </>
    )
}
