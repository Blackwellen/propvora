"use client"

import { useEffect } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface LightboxImage {
  id: string
  src: string | null
  alt: string
  property: string
  gradient?: string
}

interface LightboxProps {
  image: LightboxImage
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function Lightbox({ image, onClose, onPrev, onNext }: LightboxProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape")      onClose()
      if (e.key === "ArrowLeft")   onPrev()
      if (e.key === "ArrowRight")  onNext()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose, onPrev, onNext])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <button
        onClick={onPrev}
        className="absolute left-4 text-white/70 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button
        onClick={onNext}
        className="absolute right-4 text-white/70 hover:text-white transition-colors"
      >
        <ChevronRight className="w-8 h-8" />
      </button>
      <div className="max-w-4xl w-full mx-8">
        {image.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.src} alt={image.alt} className="w-full rounded-xl object-contain max-h-[80vh]" />
        ) : (
          <div className={`w-full h-80 rounded-xl ${image.gradient ?? "bg-gradient-to-br from-slate-600 to-slate-800"}`} />
        )}
        <div className="mt-3 text-center">
          <p className="text-white font-medium">{image.alt}</p>
          <p className="text-white/60 text-sm">{image.property}</p>
        </div>
      </div>
    </div>
  )
}
