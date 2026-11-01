import { useState } from 'react'
import { Camera, Filter, Plus, ScanLine, Search, X } from 'lucide-react'

// Thumb-first controls: intentionally anchored above the shared mobile navigation.
export default function MobileProductToolbar({
    query, onQueryChange, filter, onFilterChange, sortBy, onSortChange,
    onScan, onBulk, onCreate, isSelectionMode, selectedCount,
    onCancelSelection, onDeleteSelected
}) {
    const [filtersOpen, setFiltersOpen] = useState(false)

    return (
        <div
            data-testid="mobile-product-toolbar"
            className="md:hidden fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[90] border-t border-slate-200 bg-white/95 px-3 py-2.5 shadow-[0_-12px_30px_rgba(15,23,42,0.1)] backdrop-blur-lg"
        >
            {filtersOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Đóng bộ lọc"
                        className="fixed inset-0 z-0 bg-slate-900/25"
                        onClick={() => setFiltersOpen(false)}
                    />
                    <div
                        role="dialog"
                        aria-label="Lọc và sắp xếp sản phẩm"
                        className="absolute bottom-full left-3 right-3 z-10 mb-2 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-800">Bộ lọc sản phẩm</span>
                            <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Đóng bộ lọc sản phẩm" className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><X className="h-5 w-5"/></button>
                        </div>
                        <label className="block text-xs font-semibold text-slate-600" htmlFor="mobile-product-sort">Sắp xếp</label>
                        <select id="mobile-product-sort" aria-label="Sắp xếp sản phẩm" value={sortBy} onChange={e => onSortChange(e.target.value)} className="input h-12 w-full rounded-xl border border-slate-200 bg-white text-base">
                            <option value="name_asc">Tên A–Z</option>
                            <option value="price_asc">Giá tăng dần</option>
                            <option value="price_desc">Giá giảm dần</option>
                            <option value="stock_asc">Tồn kho ít</option>
                        </select>
                        <button
                            type="button"
                            aria-pressed={filter === 'low_stock'}
                            onClick={() => onFilterChange(filter === 'low_stock' ? 'all' : 'low_stock')}
                            className={`h-12 w-full rounded-xl border text-sm font-semibold ${filter === 'low_stock' ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                        >
                            {filter === 'low_stock' ? '✓ Chỉ xem hàng sắp hết' : 'Lọc hàng sắp hết'}
                        </button>
                        <button type="button" onClick={() => setFiltersOpen(false)} className="h-11 w-full rounded-xl bg-sky-600 text-sm font-bold text-white">Xem kết quả</button>
                    </div>
                </>
            )}
            {isSelectionMode ? (
                <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 text-sm font-bold text-slate-800">{selectedCount} sản phẩm đã chọn</span>
                    <button type="button" onClick={onCancelSelection} className="h-12 rounded-xl border border-slate-200 px-4 font-semibold text-slate-700">Hủy chọn</button>
                    <button type="button" onClick={onDeleteSelected} disabled={selectedCount === 0} className="h-12 rounded-xl bg-rose-600 px-4 font-bold text-white disabled:opacity-40">Xóa ({selectedCount})</button>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <label className="relative min-w-0 flex-1">
                            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-slate-400"/>
                            <input
                                aria-label="Tìm sản phẩm"
                                value={query}
                                onChange={e => onQueryChange(e.target.value)}
                                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-base text-slate-900 outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                                placeholder="Tìm tên, mã vạch..."
                            />
                            {query && (
                                <button type="button" aria-label="Xóa tìm kiếm" onClick={() => onQueryChange('')} className="absolute right-0 top-0 flex h-12 w-10 items-center justify-center text-slate-500"><X className="h-4 w-4"/></button>
                            )}
                        </label>
                        <button type="button" aria-label="Quét mã sản phẩm" onClick={onScan} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700"><Camera className="h-5 w-5"/></button>
                        <button type="button" aria-label="Bộ lọc sản phẩm" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(v => !v)} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${filtersOpen || filter !== 'all' ? 'border-sky-500 bg-sky-100 text-sky-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}><Filter className="h-5 w-5"/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={onBulk} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"><ScanLine className="h-4 w-4"/>Quét lô</button>
                        <button type="button" onClick={onCreate} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 text-sm font-bold text-white shadow-sm"><Plus className="h-5 w-5"/>Tạo mới</button>
                    </div>
                </div>
            )}
        </div>
    )
}
