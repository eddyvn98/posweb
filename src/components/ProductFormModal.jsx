import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { useCart } from '../contexts/CartContext'
import { saveProductLocal, getVariantsByParentId, getAllLocalProducts } from '../lib/db'
import { useNotification } from '../contexts/NotificationContext'
import api from '../lib/api'
import ProductImage from './ProductForm/ProductImage'
import CategorySection from './ProductForm/CategorySection'
import ClassificationSection from './ProductForm/ClassificationSection'
import VariantsSection from './ProductForm/VariantsSection'
import BarcodeScanner from './BarcodeScanner'
import { ChevronRight, QrCode, Plus } from './Icons'

const DEFAULT_UNIT = 'Cái'

const DEFAULT_ONLINE_CATALOG = {
  title: '',
  subtitle: '',
  description: '',
  gallery_images: [],
  specifications: [],
  detail_sections: [],
  guides: [],
  policies: { shipping: '', returns: '', warranty: '' },
  seo: { title: '', description: '' },
  channel_visibility: { web: true, shopee: false, tiktok: false }
}

const safeJson = (value, fallback) => {
  if (!value) return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const getOnlineCatalog = (attrs) => ({
  ...DEFAULT_ONLINE_CATALOG,
  ...(attrs?.online_catalog || {}),
  policies: { ...DEFAULT_ONLINE_CATALOG.policies, ...(attrs?.online_catalog?.policies || {}) },
  seo: { ...DEFAULT_ONLINE_CATALOG.seo, ...(attrs?.online_catalog?.seo || {}) },
  channel_visibility: { ...DEFAULT_ONLINE_CATALOG.channel_visibility, ...(attrs?.online_catalog?.channel_visibility || {}) }
})

export default function ProductFormModal({ product, onClose, onFinish }) {
  const { shop, isGuest } = useAuth()
  const { pushProducts } = useSync()
  const { updateProductInCart } = useCart()
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showScanner, setShowScanner] = useState(false)
  const [categories, setCategories] = useState([])
  const [variants, setVariants] = useState([])
  const [attributes, setAttributes] = useState([])
  const [onlineCatalog, setOnlineCatalog] = useState(DEFAULT_ONLINE_CATALOG)
  const [existingClassifications, setExistingClassifications] = useState({})

  const [formData, setFormData] = useState({
    name: '', barcode: '', unit: DEFAULT_UNIT, category: '',
    price: '', cost_price: '', stock_quantity: 1, image_url: null,
    classifications: {}
  })

  const draftId = useRef(uuidv4())
  const isVariantsActive = variants.length > 0 || attributes.length > 0

  useEffect(() => {
    const loadCategories = async () => {
      try {
        if (isGuest) {
          const { MOCK_CATEGORIES } = await import('../lib/mockData')
          setCategories(MOCK_CATEGORIES)
          return
        }
        const res = await api.get('/categories')
        setCategories(res.data || [])
      } catch {}
    }
    loadCategories()

    const loadExistingClassifications = async () => {
      try {
        const all = await getAllLocalProducts()
        const map = {}
        all.forEach(p => {
          const classifs = typeof p.classifications === 'string' ? JSON.parse(p.classifications) : (p.classifications || {})
          Object.entries(classifs).forEach(([k, v]) => {
            if (!map[k]) map[k] = new Set()
            map[k].add(v)
          })
        })
        const finalMap = {}
        Object.entries(map).forEach(([k, vSet]) => {
          finalMap[k] = Array.from(vSet)
        })
        setExistingClassifications(finalMap)
      } catch {}
    }
    loadExistingClassifications()

    if (product) {
      const parsedAttributes = safeJson(product.attributes, {})
      setFormData({ ...product, attributes: parsedAttributes })
      setOnlineCatalog(getOnlineCatalog(parsedAttributes))
      const loadVariants = async () => {
        const childProducts = await getVariantsByParentId(product.id)
        if (childProducts?.length > 0) {
          const attrMap = {}
          childProducts.forEach(child => {
            const attrs = typeof child.attributes === 'string' ? JSON.parse(child.attributes) : (child.attributes || {})
            Object.entries(attrs).forEach(([n, v]) => {
              if (!attrMap[n]) attrMap[n] = new Set()
              attrMap[n].add(v)
            })
          })
          setAttributes(Object.entries(attrMap).map(([name, values]) => ({ name, values: Array.from(values) })))
          setVariants(childProducts.map(c => ({ ...c, attributes: typeof c.attributes === 'string' ? JSON.parse(c.attributes) : (c.attributes || {}) })))
        }
      }
      loadVariants()
    }
  }, [product])

  // Helper to safely handle classifications data
  const classifications = typeof formData.classifications === 'string' 
    ? JSON.parse(formData.classifications) 
    : (formData.classifications || {})

  const updateOnlineCatalog = (field, value) => {
    setOnlineCatalog(prev => ({ ...prev, [field]: value }))
  }

  const updateOnlinePolicy = (field, value) => {
    setOnlineCatalog(prev => ({ ...prev, policies: { ...prev.policies, [field]: value } }))
  }

  const updateOnlineSeo = (field, value) => {
    setOnlineCatalog(prev => ({ ...prev, seo: { ...prev.seo, [field]: value } }))
  }

  const updateOnlineVisibility = (field, value) => {
    setOnlineCatalog(prev => ({ ...prev, channel_visibility: { ...prev.channel_visibility, [field]: value } }))
  }

  const addListItem = (field, item) => {
    setOnlineCatalog(prev => ({ ...prev, [field]: [...(prev[field] || []), item] }))
  }

  const updateListItem = (field, index, item) => {
    setOnlineCatalog(prev => ({ ...prev, [field]: (prev[field] || []).map((entry, i) => i === index ? item : entry) }))
  }

  const removeListItem = (field, index) => {
    setOnlineCatalog(prev => ({ ...prev, [field]: (prev[field] || []).filter((_, i) => i !== index) }))
  }

  const handleCameraScan = (code) => {
    setFormData(p => ({ ...p, barcode: code }))
    setShowScanner(false)
  }

  const handleCreateCategory = async (name) => {
    try {
      if (isGuest) {
        const category = { id: `guest-${Date.now()}`, name }
        setCategories(prev => [...prev, category])
        setFormData(p => ({ ...p, category: name }))
        showNotification('Đã thêm nhóm hàng mới', 'success')
        return
      }
      const res = await api.post('/categories', { name })
      setCategories(prev => [...prev, res.data])
      setFormData(p => ({ ...p, category: name }))
      showNotification('Đã thêm nhóm hàng mới', 'success')
    } catch {
      showNotification('Lỗi khi thêm nhóm hàng', 'error')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const productId = product?.id || draftId.current
      const baseAttributes = safeJson(formData.attributes, {})
      const cleanOnlineCatalog = {
        ...onlineCatalog,
        gallery_images: (onlineCatalog.gallery_images || []).filter(Boolean),
        specifications: (onlineCatalog.specifications || []).filter(item => item.label || item.value),
        detail_sections: (onlineCatalog.detail_sections || []).filter(item => item.title || item.content),
        guides: (onlineCatalog.guides || []).filter(item => item.title || item.note || item.rows?.length),
      }
      const parentData = {
        ...formData,
        classifications: typeof formData.classifications === 'object' ? JSON.stringify(formData.classifications) : formData.classifications,
        attributes: { ...baseAttributes, online_catalog: cleanOnlineCatalog },
        id: productId,
        shop_id: shop.id,
        price: Number(formData.price),
        cost_price: Number(formData.cost_price),
        stock_quantity: isVariantsActive ? variants.reduce((s, v) => s + (v.stock_quantity || 0), 0) : Number(formData.stock_quantity),
        is_active: true
      }
      await saveProductLocal(parentData)
      if (!isGuest) await pushProducts(parentData)
      updateProductInCart(parentData)

      if (isVariantsActive) {
        for (const v of variants) {
          const vData = { ...parentData, id: v.id?.startsWith('new-') ? uuidv4() : v.id, parent_id: productId, ...v }
          await saveProductLocal(vData)
          if (!isGuest) await pushProducts(vData)
        }
      }
      showNotification('Đã lưu sản phẩm', 'success')
      onFinish()
      onClose()
    } catch {
      showNotification('Lỗi khi lưu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const renderHeader = (title) => (
    <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-20">
      <button type="button" onClick={() => currentStep > 1 ? setCurrentStep(1) : onClose()} className="text-gray-400 p-1">
        <ChevronRight className="w-6 h-6 rotate-180" />
      </button>
      <h2 className="text-sm font-bold text-gray-800">{title}</h2>
      <button type="button" className="text-gray-400 p-1 font-bold">â‹®</button>
    </div>
  )

  const renderMainStep = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
      {renderHeader('Thêm sản phẩm')}
      <div className="p-5 space-y-6 overflow-y-auto flex-1">
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Hình ảnh sản phẩm *</label>
          <div className="flex gap-4">
            <ProductImage imageUrl={formData.image_url} onChange={u => setFormData(p => ({ ...p, image_url: u }))} />
            <ProductImage readOnly />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Tên sản phẩm *</label>
          <input className="w-full py-3 text-lg font-medium border-b border-gray-100 focus:border-primary outline-none" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Nhóm chính *</label>
          <CategorySection 
            categories={categories} 
            selectedCategory={formData.category} 
            onChange={v => setFormData(p => ({ ...p, category: v }))} 
            onCreate={handleCreateCategory}
            isCompact 
          />
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Phân loại mở rộng (Hãng, Loại...)</label>
          <ClassificationSection 
            classifications={classifications} 
            onChange={v => setFormData(p => ({ ...p, classifications: v }))} 
            existingClassifications={existingClassifications}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Mã sản phẩm (SKU/Barcode)</label>
          <div className="relative">
            <input className="w-full py-3 font-medium border-b border-gray-100 focus:border-primary outline-none" value={formData.barcode} onChange={e => setFormData(p => ({ ...p, barcode: e.target.value }))} />
            <button type="button" onClick={() => setShowScanner(true)} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-primary"><QrCode className="w-5 h-5" /></button>
          </div>
        </div>

        {showScanner && <div className="rounded-2xl overflow-hidden border-2 border-primary/20 bg-black"><BarcodeScanner active={showScanner} onDetected={handleCameraScan} /></div>}

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Giá bán *</label>
          <div className="flex items-center border-b border-gray-100"><input type="number" className="flex-1 py-3 text-2xl font-bold text-primary outline-none" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} /><span className="text-gray-400 font-bold">Ä'</span></div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Giá vốn (tùy chọn)</label>
          <div className="flex items-center border-b border-gray-100"><input type="number" className="flex-1 py-3 font-bold text-gray-700 outline-none" value={formData.cost_price} onChange={e => setFormData(p => ({ ...p, cost_price: e.target.value }))} /><span className="text-gray-400">Ä'</span></div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Số lượng tồn kho *</label>
          <div className="flex items-center border-b border-gray-100"><input type="number" className="flex-1 py-3 font-bold text-gray-700 outline-none" value={formData.stock_quantity} onChange={e => setFormData(p => ({ ...p, stock_quantity: e.target.value }))} /><span className="text-gray-400 text-xs">Cái</span></div>
        </div>

        <div className="pt-2">
          <button 
            type="button" 
            onClick={() => setCurrentStep(2)} 
            className="w-full py-4 rounded-2xl bg-gray-50 text-gray-600 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm tùy chọn sản phẩm
          </button>
        </div>
        <div className="pt-2">
          <button 
            type="button" 
            onClick={() => setCurrentStep(3)} 
            className="w-full py-4 rounded-2xl bg-primary/5 text-primary text-[11px] font-bold uppercase tracking-widest hover:bg-primary/10 transition-all border border-primary/10 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ban online
          </button>
        </div>
      </div>
      <div className="p-4 border-t bg-gray-50 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl bg-white text-sm font-bold text-gray-500 border border-gray-200">Đóng</button>
        <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 h-12 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20">{loading ? 'Đang lưu...' : 'Lưu sản phẩm'}</button>
      </div>
    </div>
  )

  const renderVariantStep = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
      {renderHeader('Biến thể (tùy chọn)')}
      <div className="p-5 flex-1 overflow-y-auto min-h-0">
        <VariantsSection variants={variants} attributes={attributes} onVariantsChange={setVariants} onAttributesChange={setAttributes} basePrice={formData.price} baseStock={formData.stock_quantity} parentImageUrl={formData.image_url} />
      </div>
      <div className="p-4 border-t bg-gray-50 flex gap-3">
        <button type="button" onClick={() => setCurrentStep(1)} className="flex-1 h-12 rounded-xl bg-white text-sm font-bold text-gray-500 border border-gray-200">Quay lại</button>
        <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 h-12 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20">{loading ? 'Đang lưu...' : 'Lưu sản phẩm'}</button>
      </div>
    </div>
  )

  const renderOnlineStep = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
      {renderHeader('Ban online')}
      <div className="p-5 space-y-5 flex-1 overflow-y-auto min-h-0">
        <label className="flex items-center justify-between rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-bold text-gray-700">
          Hien thi tren website
          <input type="checkbox" checked={onlineCatalog.channel_visibility.web !== false} onChange={(e) => updateOnlineVisibility('web', e.target.checked)} />
        </label>

        <div className="space-y-3">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Tieu de ban online</label>
          <input className="w-full py-3 text-lg font-semibold border-b border-gray-100 focus:border-primary outline-none" value={onlineCatalog.title} onChange={(e) => updateOnlineCatalog('title', e.target.value)} placeholder={formData.name || 'Ten hien thi tren san'} />
          <input className="w-full py-3 text-sm border-b border-gray-100 focus:border-primary outline-none" value={onlineCatalog.subtitle} onChange={(e) => updateOnlineCatalog('subtitle', e.target.value)} placeholder="Mo ta ngan" />
          <textarea className="w-full min-h-28 rounded-2xl border border-gray-100 p-3 text-sm outline-none focus:border-primary" value={onlineCatalog.description} onChange={(e) => updateOnlineCatalog('description', e.target.value)} placeholder="Mo ta san pham chi tiet" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Anh phu / gallery</label>
            <button type="button" onClick={() => addListItem('gallery_images', '')} className="text-xs font-bold text-primary">+ Anh</button>
          </div>
          {(onlineCatalog.gallery_images || []).map((url, index) => (
            <div key={index} className="flex gap-2">
              <input className="flex-1 h-10 rounded-xl border border-gray-100 px-3 text-xs" value={url} onChange={(e) => updateListItem('gallery_images', index, e.target.value)} placeholder="https://... hoac /mocking/..." />
              <button type="button" onClick={() => removeListItem('gallery_images', index)} className="px-3 rounded-xl border text-gray-500">X</button>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Thong so dong</label>
            <button type="button" onClick={() => addListItem('specifications', { label: '', value: '' })} className="text-xs font-bold text-primary">+ Dong</button>
          </div>
          {(onlineCatalog.specifications || []).map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input className="h-10 rounded-xl border border-gray-100 px-3 text-xs" value={item.label || ''} onChange={(e) => updateListItem('specifications', index, { ...item, label: e.target.value })} placeholder="Ten thong so" />
              <input className="h-10 rounded-xl border border-gray-100 px-3 text-xs" value={item.value || ''} onChange={(e) => updateListItem('specifications', index, { ...item, value: e.target.value })} placeholder="Gia tri" />
              <button type="button" onClick={() => removeListItem('specifications', index)} className="px-3 rounded-xl border text-gray-500">X</button>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Khoi noi dung</label>
            <button type="button" onClick={() => addListItem('detail_sections', { title: '', content: '' })} className="text-xs font-bold text-primary">+ Khoi</button>
          </div>
          {(onlineCatalog.detail_sections || []).map((item, index) => (
            <div key={index} className="rounded-2xl border border-gray-100 p-3 space-y-2">
              <input className="w-full h-10 rounded-xl border border-gray-100 px-3 text-xs" value={item.title || ''} onChange={(e) => updateListItem('detail_sections', index, { ...item, title: e.target.value })} placeholder="Tieu de" />
              <textarea className="w-full min-h-20 rounded-xl border border-gray-100 p-3 text-xs" value={item.content || ''} onChange={(e) => updateListItem('detail_sections', index, { ...item, content: e.target.value })} placeholder="Noi dung" />
              <button type="button" onClick={() => removeListItem('detail_sections', index)} className="text-xs font-bold text-gray-500">Xoa khoi</button>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Bang huong dan</label>
            <button type="button" onClick={() => addListItem('guides', { title: '', note: '', rows: [{ label: '', value: '' }] })} className="text-xs font-bold text-primary">+ Bang</button>
          </div>
          {(onlineCatalog.guides || []).map((guide, index) => (
            <div key={index} className="rounded-2xl border border-gray-100 p-3 space-y-2">
              <input className="w-full h-10 rounded-xl border border-gray-100 px-3 text-xs" value={guide.title || ''} onChange={(e) => updateListItem('guides', index, { ...guide, title: e.target.value })} placeholder="Ten bang" />
              {(guide.rows || []).map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-[1fr_1fr] gap-2">
                  <input className="h-10 rounded-xl border border-gray-100 px-3 text-xs" value={row.label || ''} onChange={(e) => {
                    const rows = [...(guide.rows || [])]
                    rows[rowIndex] = { ...row, label: e.target.value }
                    updateListItem('guides', index, { ...guide, rows })
                  }} placeholder="Cot / muc" />
                  <input className="h-10 rounded-xl border border-gray-100 px-3 text-xs" value={row.value || ''} onChange={(e) => {
                    const rows = [...(guide.rows || [])]
                    rows[rowIndex] = { ...row, value: e.target.value }
                    updateListItem('guides', index, { ...guide, rows })
                  }} placeholder="Gia tri" />
                </div>
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={() => updateListItem('guides', index, { ...guide, rows: [...(guide.rows || []), { label: '', value: '' }] })} className="text-xs font-bold text-primary">+ Dong</button>
                <button type="button" onClick={() => removeListItem('guides', index)} className="text-xs font-bold text-gray-500">Xoa bang</button>
              </div>
              <input className="w-full h-10 rounded-xl border border-gray-100 px-3 text-xs" value={guide.note || ''} onChange={(e) => updateListItem('guides', index, { ...guide, note: e.target.value })} placeholder="Ghi chu" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Chinh sach</label>
          <textarea className="w-full min-h-16 rounded-2xl border border-gray-100 p-3 text-xs" value={onlineCatalog.policies.shipping} onChange={(e) => updateOnlinePolicy('shipping', e.target.value)} placeholder="Giao hang" />
          <textarea className="w-full min-h-16 rounded-2xl border border-gray-100 p-3 text-xs" value={onlineCatalog.policies.returns} onChange={(e) => updateOnlinePolicy('returns', e.target.value)} placeholder="Doi tra" />
          <textarea className="w-full min-h-16 rounded-2xl border border-gray-100 p-3 text-xs" value={onlineCatalog.policies.warranty} onChange={(e) => updateOnlinePolicy('warranty', e.target.value)} placeholder="Bao hanh" />
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">SEO</label>
          <input className="w-full h-10 rounded-xl border border-gray-100 px-3 text-xs" value={onlineCatalog.seo.title} onChange={(e) => updateOnlineSeo('title', e.target.value)} placeholder="SEO title" />
          <textarea className="w-full min-h-16 rounded-2xl border border-gray-100 p-3 text-xs" value={onlineCatalog.seo.description} onChange={(e) => updateOnlineSeo('description', e.target.value)} placeholder="SEO description" />
        </div>
      </div>
      <div className="p-4 border-t bg-gray-50 flex gap-3">
        <button type="button" onClick={() => setCurrentStep(1)} className="flex-1 h-12 rounded-xl bg-white text-sm font-bold text-gray-500 border border-gray-200">Quay lai</button>
        <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 h-12 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20">{loading ? 'Dang luu...' : 'Luu san pham'}</button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-[120] flex items-stretch sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#FDFDFD] w-full max-w-md rounded-none sm:rounded-[40px] shadow-2xl flex flex-col h-[calc(100dvh-5.5rem)] mb-[5.5rem] sm:h-[90vh] max-h-[calc(100dvh-5.5rem)] sm:max-h-[90vh] overflow-hidden transition-all duration-300">
        {currentStep === 1 && renderMainStep()}
        {currentStep === 2 && renderVariantStep()}
        {currentStep === 3 && renderOnlineStep()}
      </div>
    </div>
  )
}
