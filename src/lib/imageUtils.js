import api from './api'

/**
 * Compresses an image file to a specific size and dimensions.
 * @param {File} file - The image file to compress.
 * @param {Object} options - Compression options.
 * @returns {Promise<string>} - Base64 string of the compressed image.
 */
export const compressImage = (file, options = { maxWidth: 800, maxHeight: 800, quality: 0.7 }) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target.result
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > options.maxWidth) {
                        height *= options.maxWidth / width
                        width = options.maxWidth
                    }
                } else {
                    if (height > options.maxHeight) {
                        width *= options.maxHeight / height
                        height = options.maxHeight
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)
                resolve(canvas.toDataURL('image/jpeg', options.quality))
            }
            img.onerror = (err) => reject(err)
        }
        reader.onerror = (err) => reject(err)
    })
}

/**
 * Resolves a product image URL, handling Telegram file IDs and relative paths.
 * @param {string} url - The stored image URL or file ID.
 * @returns {string|null} - The resolved URL for display.
 */
export const getProductImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('tg_file_id:')) {
        const fileId = url.replace('tg_file_id:', '')
        return `${api.defaults.baseURL}/images/tg/${fileId}`
    }
    if (url.startsWith('data:image')) return url
    if (url.startsWith('http')) return url
    // Local static assets under /public should be served directly (not through /api)
    if (url.startsWith('/mocking/')) return url

    // Fallback for relative paths if any
    const base = api.defaults.baseURL || '/api'
    const cleanUrl = url.startsWith('/') ? url : `/${url}`
    
    // If url already starts with /api or base, don't prepend base again
    if (cleanUrl.startsWith(base)) return cleanUrl
    
    return `${base}${cleanUrl}`
}
