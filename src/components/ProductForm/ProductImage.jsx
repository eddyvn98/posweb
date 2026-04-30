import { compressImage, getProductImageUrl } from '../../lib/imageUtils'
import api from '../../lib/api'

export default function ProductImage({ imageUrl, onChange }) {
    const handleImageChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.7 })
            onChange(compressed)
        } catch (err) {
            console.error('Image compression error:', err)
            alert('Lỗi nén ảnh. Vui lòng thử lại.')
        }
    }

    return (
        <div className="flex bg-gray-50 p-2 rounded items-center gap-3">
            <div className="w-16 h-16 bg-white border rounded flex items-center justify-center overflow-hidden shrink-0">
                {imageUrl ? (
                    <img src={getProductImageUrl(imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-2xl opacity-20">📷</span>
                )}
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1">ẢNH SẢN PHẨM</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
            </div>
        </div>
    )
}
