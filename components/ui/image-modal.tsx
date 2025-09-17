import { ChevronLeft, ChevronRight, X } from "lucide-react"

// Image Modal Component
export const ImageModal = ({
    isOpen,
    onClose,
    images,
    currentIndex,
    onNavigate,
  }: {
    isOpen: boolean
    onClose: () => void
    images: string[]
    currentIndex: number
    onNavigate: (index: number) => void
  }) => {
    if (!isOpen) return null
  
    const nextImage = () => {
      onNavigate((currentIndex + 1) % images.length)
    }
  
    const prevImage = () => {
      onNavigate((currentIndex - 1 + images.length) % images.length)
    }
  
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="relative max-w-4xl max-h-full w-full">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
  
          {/* Image container */}
          <div className="relative bg-white rounded-lg overflow-hidden shadow-2xl">
            <img
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`Imagem ${currentIndex + 1}`}
              className="w-full max-h-[80vh] object-contain"
            />
  
            {/* Navigation arrows for multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </>
            )}
  
            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} de {images.length}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }