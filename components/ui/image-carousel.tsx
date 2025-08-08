import { ChevronLeft, ChevronRight, ImageIcon, ZoomIn } from "lucide-react"
import { useState } from "react"
import { ImageModal } from "./image-modal"

// Compact image carousel component
export const ImageCarousel = ({ images }: { images: string[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
  
    if (images.length === 0) return null
  
    const nextImage = () => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }
  
    const prevImage = () => {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  
    const openModal = () => {
      setIsModalOpen(true)
    }
  
    const closeModal = () => {
      setIsModalOpen(false)
    }
  
    return (
      <>
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Imagens registradas</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {currentIndex + 1} de {images.length}
              </span>
              <button
                onClick={openModal}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Expandir imagem"
              >
                <ZoomIn className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
  
          <div className="relative">
            <img
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`Imagem ${currentIndex + 1}`}
              className="w-full h-60 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={openModal}
            />
  
            {/* Navigation arrows - only show if more than 1 image */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </>
            )}
  
            {/* Dots indicator - only show if more than 1 image */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      index === currentIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
  
            {/* Click to expand hint */}
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs opacity-0 hover:opacity-100 transition-opacity">
              Clique para expandir
            </div>
          </div>
        </div>
  
        {/* Image Modal */}
        <ImageModal
          isOpen={isModalOpen}
          onClose={closeModal}
          images={images}
          currentIndex={currentIndex}
          onNavigate={setCurrentIndex}
        />
      </>
    )
  }