/**
 * Chuyển chuỗi Tiếng Việt có dấu thành không dấu, viết thường
 */
export const normalizeString = (str) => {
    if (!str) return ''
    return String(str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\u0111/g, 'd')
        .trim()
}

/**
 * Chuẩn hóa chuỗi mã vạch / SKU: Loại bỏ tất cả khoảng trắng, dấu gạch ngang, ký tự đặc biệt
 * Ví dụ: "893-123 456" -> "893123456"
 */
export const normalizeBarcode = (str) => {
    if (!str) return ''
    return String(str).toLowerCase().replace(/[^a-z0-9]/gi, '')
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
 * Tính khoảng cách Levenshtein giữa 2 chuỗi để tìm gần đúng khi gõ sai
 */
export const levenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length
    if (b.length === 0) return a.length

    const matrix = []

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i]
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // thay thế
                    matrix[i][j - 1] + 1,     // chèn
                    matrix[i - 1][j] + 1      // xóa
                )
            }
        }
    }

    return matrix[b.length][a.length]
}

/**
 * Kiểm tra fuzzy match (gõ nhầm 1-2 ký tự)
 */
export const isFuzzyMatch = (str, query) => {
    if (!query || query.length < 3) return false
    const normStr = normalizeString(str)
    const normQuery = normalizeString(query)

    // Kiểm tra từng từ trong tên sản phẩm
    const words = normStr.split(/\s+/).filter(w => w.length > 0)
    for (const word of words) {
        if (Math.abs(word.length - normQuery.length) <= 2) {
            const dist = levenshteinDistance(word, normQuery)
            const maxAllowed = normQuery.length <= 5 ? 1 : 2
            if (dist <= maxAllowed) return true
        }
    }

    // Kiểm tra toàn chuỗi nếu độ dài tương đồng
    if (Math.abs(normStr.length - normQuery.length) <= 3) {
        const dist = levenshteinDistance(normStr, normQuery)
        if (dist <= 2) return true
    }

    return false
}

/**
 * Kiểm tra xem một sản phẩm có khớp với chuỗi tìm kiếm không
 */
export const matchProduct = (product, query) => {
    if (!query || !String(query).trim()) return true

    const rawQuery = String(query).trim()
    const q = normalizeString(rawQuery)
    const qClean = normalizeBarcode(rawQuery)
    const name = normalizeString(product.name)
    const barcode = normalizeString(product.barcode)
    const cleanBarcode = normalizeBarcode(product.barcode)
    const sku = normalizeString(product.sku || product.code || product.id)
    const cleanSku = normalizeBarcode(product.sku || product.code || product.id)

    // 1. Khớp mã vạch / SKU (Cả nguyên bản & đã loại bỏ gạch ngang/khoảng trắng)
    if (qClean && (cleanBarcode === qClean || cleanSku === qClean)) return true
    if (qClean && qClean.length >= 3 && (cleanBarcode.includes(qClean) || cleanSku.includes(qClean))) return true
    if (barcode && barcode.includes(q)) return true
    if (sku && sku.includes(q)) return true

    // 2. Khớp các từ trong tên (không dấu)
    const terms = q.split(/\s+/).filter(t => t.length > 0)
    const isMatchAllTerms = terms.every(term => name.includes(term))
    if (isMatchAllTerms) return true

    // 3. Khớp chữ cái đầu (Initials)
    const initials = getInitials(product.name)
    if (initials && initials.includes(q)) return true

    // 4. Fuzzy match (cho phép gõ sai 1-2 ký tự)
    if (isFuzzyMatch(product.name, rawQuery)) return true

    return false
}

/**
 * Tính điểm tương quan (Relevance Score) để sắp xếp kết quả tìm kiếm
 */
export const getRelevanceScore = (product, query) => {
    if (!query || !String(query).trim()) return 0

    const rawQuery = String(query).trim()
    const q = normalizeString(rawQuery)
    const qClean = normalizeBarcode(rawQuery)
    const name = normalizeString(product.name)
    const barcode = (product.barcode || '').toLowerCase()
    const cleanBarcode = normalizeBarcode(product.barcode)
    const sku = (product.sku || product.code || product.id || '').toString().toLowerCase()
    const cleanSku = normalizeBarcode(sku)
    const initials = getInitials(product.name)

    let score = 0

    // 1. Khớp hoàn toàn Mã vạch hoặc SKU (Điểm cao nhất: 2000)
    if (qClean && (cleanBarcode === qClean || cleanSku === qClean)) {
        score += 2000
    } else if (barcode === q || sku === q) {
        score += 1800
    }

    // 2. Bắt đầu bằng Mã vạch hoặc SKU (Điểm: 900)
    if (qClean && qClean.length >= 2 && (cleanBarcode.startsWith(qClean) || cleanSku.startsWith(qClean))) {
        score += 900
    } else if (barcode.startsWith(q) || sku.startsWith(q)) {
        score += 800
    } else if (cleanBarcode.includes(qClean) || cleanSku.includes(qClean)) {
        score += 700
    }

    // 3. Khớp hoàn toàn Tên (Điểm: 1500)
    if (name === q) {
        score += 1500
    }

    // 4. Tên bắt đầu bằng từ khóa (Điểm: 1000)
    if (name.startsWith(q)) {
        score += 1000
    }

    // 5. Tên chứa nguyên cụm từ khóa (Điểm: 600)
    if (name.includes(q)) {
        score += 600
    }

    // 6. Khớp từ viết tắt initials (Điểm: 400/300/200)
    if (initials === q) {
        score += 400
    } else if (initials.startsWith(q)) {
        score += 300
    } else if (initials.includes(q)) {
        score += 200
    }

    // 7. Ưu tiên tên ngắn hơn
    score += Math.max(0, 100 - name.length)

    return score
}

/**
 * Sắp xếp kết quả tìm kiếm theo độ ưu tiên
 */
export const sortSearchResults = (products, query) => {
    if (!query || !String(query).trim()) return products

    return [...products].sort((a, b) => {
        const scoreA = getRelevanceScore(a, query)
        const scoreB = getRelevanceScore(b, query)

        if (scoreA !== scoreB) {
            return scoreB - scoreA
        }

        return (a.name || '').localeCompare(b.name || '')
    })
}
