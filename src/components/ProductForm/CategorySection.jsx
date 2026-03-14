import React, { useState } from 'react'
import SelectionModal from '../Common/SelectionModal'

export default function CategorySection({ categories, selectedCategory, onChange, onCreate, onEdit, onDelete }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="input w-full p-2 h-11 text-left flex items-center justify-between bg-white cursor-pointer hover:border-primary active:scale-[0.98] transition-all"
            >
                <span className={selectedCategory ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {selectedCategory || '-- Nhóm --'}
                </span>
                <span className="text-gray-400 text-xs">▼</span>
            </button>

            <SelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Chọn nhóm hàng"
                options={categories}
                selectedValue={selectedCategory}
                onSelect={onChange}
                onCreate={onCreate}
                onEdit={onEdit}
                onDelete={onDelete}
                emptyText="Chưa có nhóm hàng nào"
            />
        </>
    )
}
