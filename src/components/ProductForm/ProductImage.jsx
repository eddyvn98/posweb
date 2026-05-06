import { useRef } from 'react'
import { compressImage, getProductImageUrl } from '../../lib/imageUtils'
import { Camera, Plus } from '../Icons'

export default function ProductImage({ imageUrl, onChange, readOnly }) {
    const fileInputRef = useRef(null)

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

    const triggerFileSelect = () => {
        if (!readOnly) {
            fileInputRef.current.click()
        }
    }

    return (
        <div className="flex flex-col items-center justify-center py-2">
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
            />
            
            <div 
                onClick={triggerFileSelect}
                className={`
                    relative w-32 h-32 rounded-3xl overflow-hidden border-2 border-dashed transition-all cursor-pointer group
                    ${imageUrl ? 'border-transparent shadow-lg' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-primary'}
                    ${readOnly ? 'cursor-default border-none shadow-none' : ''}
                `}
            >
                {imageUrl ? (
                    <>
                        <img 
                            src={getProductImageUrl(imageUrl)} 
                            alt="Preview" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                        {!readOnly && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                <Camera className="w-6 h-6 mb-1" />
                                <span className="text-[10px] font-black uppercase">Đổi ảnh</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                        <div className="bg-white p-3 rounded-2xl shadow-sm mb-2 group-hover:shadow-md transition-all">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Thêm ảnh</span>
                    </div>
                )}
            </div>

            {!readOnly && (
                <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {imageUrl ? 'Nhấn vào ảnh để thay đổi' : 'Nhấn để chọn ảnh sản phẩm'}
                </p>
            )}
        </div>
    )
}

