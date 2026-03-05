import React, { useState, useRef, useEffect } from 'react';

export default function SelectionModal({
    isOpen,
    onClose,
    title,
    options = [],
    selectedValue,
    onSelect,
    onCreate,
    onEdit,
    onDelete,
    emptyText = "Chưa có dữ liệu"
}) {
    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if ((isAdding || editingId) && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding, editingId]);

    if (!isOpen) return null;

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newItemName.trim()) return;
        await onCreate(newItemName.trim());
        setNewItemName('');
        setIsAdding(false);
    };

    const handleUpdate = async (opt) => {
        if (!editName.trim() || editName === opt.name) {
            setEditingId(null);
            return;
        }
        await onEdit(opt, editName.trim());
        setEditingId(null);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-xl p-1">✕</button>
                </div>

                {/* Search */}
                <div className="p-3 border-b">
                    <input
                        type="text"
                        placeholder="Tìm nhanh..."
                        className="input w-full p-2 h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus={!isAdding && !editingId}
                    />
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-2">
                    {filteredOptions.length === 0 && !isAdding ? (
                        <div className="p-8 text-center text-gray-400 text-sm italic">{emptyText}</div>
                    ) : (
                        <div className="space-y-1">
                            {filteredOptions.map((opt) => (
                                <div
                                    key={opt.id || opt.name}
                                    className={`group flex items-center gap-2 px-2 py-1 rounded-xl transition-all ${selectedValue === opt.name
                                        ? 'bg-primary/5'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    {editingId === opt.id ? (
                                        <div className="flex-1 flex items-center gap-2 p-1">
                                            <input
                                                ref={inputRef}
                                                className="input flex-1 h-9 text-sm px-2"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleUpdate(opt)}
                                            />
                                            <button onClick={() => handleUpdate(opt)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg font-bold">Lưu</button>
                                            <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">✕</button>
                                        </div>
                                    ) : deletingId === opt.id ? (
                                        <div className="flex-1 flex items-center justify-between p-2 bg-red-50 rounded-lg animate-in fade-in slide-in-from-right-2">
                                            <span className="text-xs font-bold text-red-600 truncate">Xóa "{opt.name}"?</span>
                                            <div className="flex gap-1 shrink-0">
                                                <button
                                                    onClick={() => { onDelete(opt); setDeletingId(null); }}
                                                    className="bg-red-500 text-white px-3 py-1 rounded-md text-xs font-bold shadow-sm"
                                                >
                                                    Xóa
                                                </button>
                                                <button
                                                    onClick={() => setDeletingId(null)}
                                                    className="bg-white text-gray-500 px-3 py-1 rounded-md text-xs border border-gray-200"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                disabled={deletingId || editingId}
                                                onClick={() => {
                                                    onSelect(opt.name);
                                                    onClose();
                                                }}
                                                className={`flex-1 text-left px-2 py-2 rounded-lg transition-all flex items-center justify-between ${selectedValue === opt.name
                                                    ? 'text-primary font-bold'
                                                    : 'text-gray-700'
                                                    }`}
                                            >
                                                <span>{opt.name}</span>
                                                {selectedValue === opt.name && <span className="text-primary font-bold">✓</span>}
                                            </button>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {onEdit && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingId(opt.id);
                                                            setEditName(opt.name);
                                                            setDeletingId(null);
                                                            setIsAdding(false);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="Sửa"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                )}

                                                {onDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeletingId(opt.id);
                                                            setEditingId(null);
                                                            setIsAdding(false);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer/Actions */}
                <div className="p-3 border-t bg-gray-100 flex flex-col gap-2">
                    {isAdding ? (
                        <div className="flex items-center gap-2 p-1 bg-white rounded-xl shadow-inner border border-primary/20">
                            <input
                                ref={inputRef}
                                className="input flex-1 h-11 border-none focus:ring-0 text-gray-900"
                                placeholder="Nhập tên mới..."
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            />
                            <div className="flex gap-1 pr-1">
                                <button onClick={handleCreate} className="p-2 bg-primary text-white rounded-lg shadow-sm hover:bg-primary-dark font-bold px-4">Lưu</button>
                                <button onClick={() => setIsAdding(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">✕</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setIsAdding(true);
                                setEditingId(null);
                                setDeletingId(null);
                            }}
                            className="flex-1 btn-primary h-11 text-sm rounded-xl font-bold tracking-wide shadow-md"
                        >
                            + Thêm mới
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
