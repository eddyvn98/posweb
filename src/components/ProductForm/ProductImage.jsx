import { useRef } from 'react'
import { compressImage, getProductImageUrl } from '../../lib/imageUtils'
import { Camera, Plus } from '../Icons'

export default function ProductImage({ imageUrl, onChange, readOnly, className = "w-24 h-24" }) {
    const fileInputRef = useRef(null)

    const handleImageChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.7 })
            onChange(compressed)
        } catch (err) {
            console.error('Image compression error:', err)
        }
    }

    const triggerFileSelect = () => {
        if (!readOnly) {
            fileInputRef.current.click()
        }
    }

    return (
        <div className="flex flex-col items-center">
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
                    relative ${className} rounded-2xl overflow-hidden border-2 border-dashed transition-all cursor-pointer group
                    ${imageUrl ? 'border-transparent shadow-sm' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100 hover:border-red-200'}
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
                                <Camera className="w-5 h-5 mb-1" />
                                <span className="text-[8px] font-bold uppercase">Đổi ảnh</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 group-hover:text-red-400 transition-colors">
                        <Plus className="w-6 h-6 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Thêm ảnh</span>
                    </div>
                )}
            </div>
        </div>
    )
}
