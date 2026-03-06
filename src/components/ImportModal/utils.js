import { v4 as uuidv4 } from 'uuid'
import api from '../../lib/api'

export function getSupplierLabel(supplier) {
    return supplier?.name?.trim() || 'Nhà cung cấp chưa đặt tên'
}

export function numberValue(value) {
    const parsed = Number(value || 0)
    return Number.isFinite(parsed) ? parsed : 0
}

export function buildEmptyItem() {
    return {
        id: uuidv4(),
        search: '',
        product_id: '',
        product_name: '',
        quantity: 1,
        unit_price: 0,
        vat_amount: 0,
        total_amount: 0
    }
}

export function matchSupplierId(importRecord, suppliers) {
    if (!importRecord?.supplier_name) return ''
    const matched = suppliers.find((item) => item.name?.trim() === importRecord.supplier_name?.trim())
    return matched?.id || ''
}

export function buildInitialForm(importRecord, suppliers) {
    return {
        import_date: importRecord?.import_date || new Date().toISOString().split('T')[0],
        supplier_id: matchSupplierId(importRecord, suppliers),
        supplier_name: importRecord?.supplier_name || '',
        supplier_tax_code: importRecord?.supplier_tax_code || '',
        invoice_number: importRecord?.invoice_number || '',
        invoice_date: importRecord?.invoice_date || '',
        invoice_type: importRecord?.invoice_type || 'no_invoice',
        payment_method: importRecord?.payment_method || 'unpaid',
        payment_date: importRecord?.payment_date || '',
        paid_amount: importRecord?.paid_amount || 0,
        note: importRecord?.note || '',
        status: importRecord?.status || 'draft',
        items: Array.isArray(importRecord?.items) && importRecord.items.length > 0
            ? importRecord.items.map((item) => ({
                id: item.id || uuidv4(),
                search: item.product_name || '',
                product_id: item.product_id || '',
                product_name: item.product_name || '',
                quantity: numberValue(item.quantity),
                unit_price: numberValue(item.unit_price),
                vat_amount: numberValue(item.vat_amount),
                total_amount: numberValue(item.total_amount)
            }))
            : [],
        attachment_files: Array.isArray(importRecord?.attachment_files) ? importRecord.attachment_files : []
    }
}

export function summarize(items, paidAmount) {
    const totalGoodsAmount = items.reduce((sum, item) => sum + numberValue(item.quantity) * numberValue(item.unit_price), 0)
    const totalVatAmount = items.reduce((sum, item) => sum + numberValue(item.vat_amount), 0)
    const totalCost = totalGoodsAmount + totalVatAmount
    const debtAmount = Math.max(0, totalCost - numberValue(paidAmount))

    return { totalGoodsAmount, totalVatAmount, totalCost, debtAmount }
}

export function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

export function formatBytes(bytes) {
    if (!bytes) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getApiBaseUrl() {
    return String(api.defaults.baseURL || '').replace(/\/$/, '')
}

function extensionFromMimeType(mimeType) {
    const normalized = String(mimeType || '').toLowerCase()
    if (normalized.includes('pdf')) return '.pdf'
    if (normalized.includes('png')) return '.png'
    if (normalized.includes('jpeg') || normalized.includes('jpg')) return '.jpg'
    if (normalized.includes('webp')) return '.webp'
    if (normalized.includes('gif')) return '.gif'
    if (normalized.includes('msword')) return '.doc'
    if (normalized.includes('wordprocessingml')) return '.docx'
    if (normalized.includes('spreadsheetml')) return '.xlsx'
    if (normalized.includes('excel')) return '.xls'
    if (normalized.includes('csv')) return '.csv'
    if (normalized.includes('zip')) return '.zip'
    if (normalized.includes('rar')) return '.rar'
    if (normalized.includes('text/plain')) return '.txt'
    return ''
}

function ensureFilename(filename, mimeType) {
    const safeName = String(filename || '').trim()
    if (safeName) {
        if (safeName.includes('.')) return safeName
        return `${safeName}${extensionFromMimeType(mimeType)}`
    }

    const extension = extensionFromMimeType(mimeType)
    return `attachment${extension}`
}

export async function openTelegramFile({ fileId, filename, mimeType, download = false }) {
    const token = localStorage.getItem('pos_token')
    const url = `${getApiBaseUrl()}/files/tg?fileId=${encodeURIComponent(fileId)}${download ? '&download=1' : ''}`
    const finalFilename = ensureFilename(filename, mimeType)
    const previewWindow = download ? null : window.open('', '_blank', 'noopener,noreferrer')

    try {
        const response = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const responseMimeType = response.headers.get('content-type') || mimeType || 'application/octet-stream'
        const blob = await response.blob()
        const typedBlob = blob.type ? blob : new Blob([blob], { type: responseMimeType })
        const objectUrl = URL.createObjectURL(typedBlob)

        if (download) {
            const link = document.createElement('a')
            link.href = objectUrl
            link.download = finalFilename
            document.body.appendChild(link)
            link.click()
            link.remove()
        } else if (previewWindow) {
            previewWindow.location.href = objectUrl
        } else {
            window.open(objectUrl, '_blank', 'noopener,noreferrer')
        }

        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
        return true
    } catch (error) {
        if (previewWindow) {
            previewWindow.close()
        }
        console.error('Open telegram file error:', error)
        throw error
    }
}
