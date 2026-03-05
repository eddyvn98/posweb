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
