import { useEffect, useMemo, useState } from 'react'
import { Plus, X, Tag, Save, List, Trash2, RefreshCw } from '../Icons'
import { saveAttributePreset, getAttributePresets, deleteAttributePreset } from '../../lib/db'
import ProductImage from './ProductImage'
import BarcodeScanner from '../BarcodeScanner'

const COMMON_ATTRIBUTES = ['Màu sắc', 'Kích thước', 'Chất liệu', 'Kiểu dáng']

export default function VariantsSection({ variants, attributes, onVariantsChange, onAttributesChange, basePrice, baseStock, parentImageUrl }) {
  const [attrName, setAttrName] = useState('')
  const [valueInputs, setValueInputs] = useState({})
  const [presets, setPresets] = useState([])
  const [showPresets, setShowPresets] = useState(false)
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [scanTargetVariantId, setScanTargetVariantId] = useState(null)

  useEffect(() => {
    loadPresets()
  }, [])

  const totalStock = useMemo(() => variants.reduce((s, v) => s + Number(v.stock_quantity || 0), 0), [variants])

  const loadPresets = async () => {
    const data = await getAttributePresets()
    setPresets(data || [])
  }

  const addAttribute = () => {
    const name = attrName.trim()
    if (!name || attributes.find(a => a.name === name)) return
    onAttributesChange([...attributes, { name, values: [] }])
    setAttrName('')
  }

  const removeAttribute = (index) => {
    const next = attributes.filter((_, i) => i !== index)
    onAttributesChange(next)
    generateVariants(next)
  }

  const addValue = (attrIndex, value) => {
    const nextValue = value.trim()
    if (!nextValue) return
    const next = [...attributes]
    if (next[attrIndex].values.includes(nextValue)) return
    next[attrIndex].values.push(nextValue)
    onAttributesChange(next)
    generateVariants(next)
  }

  const removeValue = (attrIndex, valIndex) => {
    const next = [...attributes]
    next[attrIndex].values.splice(valIndex, 1)
    onAttributesChange(next)
    generateVariants(next)
  }

  const generateVariants = (currentAttrs) => {
    const activeAttrs = currentAttrs.filter(a => a.values.length > 0)
    if (activeAttrs.length === 0) {
      onVariantsChange([])
      return
    }

    const combinations = activeAttrs.reduce((acc, attr) => {
      if (acc.length === 0) return attr.values.map(v => ({ [attr.name]: v }))
      const next = []
      acc.forEach(combo => attr.values.forEach(v => next.push({ ...combo, [attr.name]: v })))
      return next
    }, [])

    const nextVariants = combinations.map((combo, idx) => {
      const key = Object.values(combo).join('||')
      const existing = variants.find(v => Object.values(v.attributes || {}).join('||') === key)
      return existing || {
        id: `new-${Math.random().toString(36).slice(2, 10)}`,
        attributes: combo,
        price: Number(basePrice || 0),
        stock_quantity: Number(baseStock || 0),
        barcode: `${idx + 1}`,
        image_url: null
      }
    })

    onVariantsChange(nextVariants)
  }

  const updateVariant = (variantId, field, value) => {
    onVariantsChange(variants.map(v => v.id === variantId ? { ...v, [field]: value } : v))
  }

  const applyPreset = (preset) => {
    const nextAttrs = preset.attributes || []
    onAttributesChange(nextAttrs)
    generateVariants(nextAttrs)
    setShowPresets(false)
  }

  const saveCurrentAsPreset = async () => {
    if (!presetName.trim() || attributes.length === 0) return
    await saveAttributePreset(presetName.trim(), attributes)
    setPresetName('')
    setShowSavePreset(false)
    loadPresets()
  }

  const syncAllFromBase = (field) => {
    const value = field === 'price' ? Number(basePrice || 0) : Number(baseStock || 0)
    onVariantsChange(variants.map(v => ({ ...v, [field]: value })))
  }

  const handleScanDetected = (code) => {
    if (!scanTargetVariantId) return
    updateVariant(scanTargetVariantId, 'barcode', code)
    setScanTargetVariantId(null)
  }

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Cấu hình thuộc tính</h3>
          </div>
          <div className="flex items-center gap-2">
            {presets.length > 0 && <button type="button" onClick={() => setShowPresets(v => !v)} className="text-[11px] px-2 py-1 bg-white border rounded-lg font-bold text-gray-600"><List className="w-3 h-3 inline" /> Mẫu</button>}
            {attributes.length > 0 && <button type="button" onClick={() => setShowSavePreset(true)} className="text-[11px] px-2 py-1 bg-white border rounded-lg font-bold text-primary"><Save className="w-3 h-3 inline" /> Lưu mẫu</button>}
          </div>
        </div>

        {showPresets && (
          <div className="mb-3 bg-white border rounded-xl divide-y">
            {presets.map(p => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 text-xs">
                <button type="button" onClick={() => applyPreset(p)} className="font-semibold text-gray-700">{p.name}</button>
                <button type="button" onClick={async () => { await deleteAttributePreset(p.id); loadPresets() }} className="text-gray-400"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-[10px] font-bold text-gray-400 italic">Gợi ý:</span>
          {COMMON_ATTRIBUTES.filter(name => !attributes.find(a => a.name === name)).map(name => (
            <button key={name} type="button" onClick={() => onAttributesChange([...attributes, { name, values: [] }])} className="text-[11px] px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-500 font-bold">+ {name}</button>
          ))}
        </div>

        <div className="space-y-3">
          {attributes.map((attr, idx) => (
            <div key={idx} className="bg-white p-3 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-gray-500 uppercase">{attr.name}</span>
                <button type="button" onClick={() => removeAttribute(idx)} className="p-1 text-gray-400"><X className="w-3 h-3" /></button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {attr.values.map((v, vIdx) => (
                  <span key={vIdx} className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-2 py-1 text-xs font-bold">{v}<button type="button" onClick={() => removeValue(idx, vIdx)}><X className="w-3 h-3" /></button></span>
                ))}
                <div className="flex items-center gap-1 border border-gray-100 rounded-lg bg-gray-50/50 px-2 py-1 focus-within:border-primary/30 transition-colors">
                  <input 
                    type="text" 
                    className="text-xs border-none focus:ring-0 bg-transparent p-0 w-24" 
                    placeholder="Thêm giá trị" 
                    value={valueInputs[idx] || ''}
                    onChange={(e) => setValueInputs({ ...valueInputs, [idx]: e.target.value })}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter') { 
                        e.preventDefault(); 
                        addValue(idx, valueInputs[idx] || ''); 
                        setValueInputs({ ...valueInputs, [idx]: '' });
                      } 
                    }} 
                    enterKeyHint="enter"
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      addValue(idx, valueInputs[idx] || '');
                      setValueInputs({ ...valueInputs, [idx]: '' });
                    }}
                    className="p-1 text-primary hover:bg-primary/10 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <input 
              value={attrName} 
              onChange={(e) => setAttrName(e.target.value)} 
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttribute() } }}
              className="input flex-1 h-10 text-xs" 
              placeholder="Tên nhóm (Màu, Size...)" 
              enterKeyHint="done"
            />
            <button type="button" onClick={addAttribute} className="h-10 px-4 bg-primary text-white rounded-xl text-xs font-black flex items-center gap-1"><Plus className="w-4 h-4" /> Thêm</button>
          </div>
        </div>
      </div>

      {variants.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-700">Danh sách biến thể</h4>
            <div className="text-right">
              <div className="text-xs font-bold text-primary">{variants.length} biến thể</div>
              <div className="text-[11px] text-gray-500">Tổng tồn: <span className="font-bold">{totalStock}</span></div>
            </div>
          </div>
          <div className="px-4 py-2 border-b bg-white flex gap-2">
            <button type="button" onClick={() => syncAllFromBase('price')} className="text-xs px-3 py-1 border rounded-lg font-semibold text-gray-600"><RefreshCw className="w-3 h-3 inline" /> Đồng bộ giá gốc</button>
            <button type="button" onClick={() => syncAllFromBase('stock_quantity')} className="text-xs px-3 py-1 border rounded-lg font-semibold text-gray-600"><RefreshCw className="w-3 h-3 inline" /> Đồng bộ tồn gốc</button>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-white sticky top-0">
                <tr className="text-left text-xs text-gray-400">
                  <th className="px-3 py-2">Ảnh</th>
                  <th className="px-3 py-2">Phân loại</th>
                  <th className="px-3 py-2">Mã</th>
                  <th className="px-3 py-2">Giá bán</th>
                  <th className="px-3 py-2">Tồn</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id} className="border-t border-gray-100 align-top">
                    <td className="px-3 py-2 w-20"><ProductImage imageUrl={v.image_url || parentImageUrl} onChange={(url) => updateVariant(v.id, 'image_url', url)} /></td>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-700">{Object.values(v.attributes || {}).join(' / ') || '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <input type="text" className="w-20 border rounded-lg px-2 py-1 text-xs" value={v.barcode || ''} onChange={(e) => updateVariant(v.id, 'barcode', e.target.value)} />
                        <button type="button" onClick={() => setScanTargetVariantId(v.id)} className="px-2 py-1 text-[10px] border rounded-lg font-semibold text-primary">Quét</button>
                      </div>
                    </td>
                    <td className="px-3 py-2"><input type="number" className="w-24 border rounded-lg px-2 py-1 text-xs" value={v.price} onChange={(e) => updateVariant(v.id, 'price', Number(e.target.value))} /></td>
                    <td className="px-3 py-2"><input type="number" className="w-20 border rounded-lg px-2 py-1 text-xs" value={v.stock_quantity} onChange={(e) => updateVariant(v.id, 'stock_quantity', Number(e.target.value))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSavePreset && (
        <div className="fixed inset-0 bg-black/40 z-[130] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm">
            <h4 className="font-bold mb-2">Lưu mẫu biến thể</h4>
            <input autoFocus value={presetName} onChange={(e) => setPresetName(e.target.value)} className="input w-full h-10 text-sm mb-3" placeholder="Tên mẫu" />
            <div className="flex gap-2">
              <button type="button" className="flex-1 h-10 border rounded-lg" onClick={() => setShowSavePreset(false)}>Hủy</button>
              <button type="button" className="flex-1 h-10 bg-primary text-white rounded-lg" onClick={saveCurrentAsPreset}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {scanTargetVariantId && (
        <div className="fixed inset-0 bg-black/50 z-[140] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h4 className="font-bold text-sm">Quét mã biến thể</h4>
              <button type="button" onClick={() => setScanTargetVariantId(null)} className="text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-black aspect-video">
              <BarcodeScanner active={Boolean(scanTargetVariantId)} onDetected={handleScanDetected} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
