/**
 * Chuyển chuỗi Tiếng Việt có dấu thành không dấu, viết thường
 */
export const normalizeString = (str) => {
    if (!str) return ''
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\u0111/g, 'd')
        .trim()
}

/**
 * Lấy các chữ cái đầu của mỗi từ trong chuỗi (Initials)
 * Ví dụ: "Hanoi Beer" -> "hb"
 */
export const getInitials = (str) => {
    if (!str) return ''
    return normalizeString(str)
        .split(/\s+/)
        .map(word => word[0])
        .join('')
}

/**
 * Kiểm tra xem một sản phẩm có khớp với chuỗi tìm kiếm không
 */
export const matchProduct = (product, query) => {
    if (!query) return true

    const q = normalizeString(query)
    const name = normalizeString(product.name)
    const barcode = (product.barcode || '').toLowerCase()

    // 1. Khớp hoàn toàn mã vạch
    if (barcode === q) return true

    // 2. Chứa mã vạch
    if (barcode.includes(q)) return true

    // 3. Khớp từ khóa tìm kiếm trong tên (không dấu)
    const terms = q.split(/\s+/).filter(t => t.length > 0)
    const isMatchAllTerms = terms.every(term => name.includes(term))
    if (isMatchAllTerms) return true

    // 4. Khớp theo chữ cái đầu (Initials)
    const initials = getInitials(product.name)
    if (initials.includes(q)) return true

    return false
}

/**
 * Sắp xếp kết quả tìm kiếm theo độ ưu tiên
 */
export const sortSearchResults = (products, query) => {
    const q = normalizeString(query)

    return [...products].sort((a, b) => {
        const nameA = normalizeString(a.name)
        const nameB = normalizeString(b.name)
        const barcodeA = (a.barcode || '').toLowerCase()
        const barcodeB = (b.barcode || '').toLowerCase()

        // Ưu tiên 1: Khớp chính xác mã vạch
        if (barcodeA === q && barcodeB !== q) return -1
        if (barcodeB === q && barcodeA !== q) return 1

        // Ưu tiên 2: Bắt đầu bằng chuỗi tìm kiếm
        const startA = nameA.startsWith(q)
        const startB = nameB.startsWith(q)
        if (startA && !startB) return -1
        if (startB && !startA) return 1

        // Ưu tiên 3: Tên ngắn hơn (thường là khớp chính xác hơn)
        if (nameA.length !== nameB.length) {
            return nameA.length - nameB.length
        }

        return 0
    })
}
