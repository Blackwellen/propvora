'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

interface StayGalleryProps {
  images: string[]
  title: string
}

export default function StayGallery({ images, title }: StayGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  const displayImages = images.slice(0, 5)

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-96 rounded-2xl overflow-hidden">
        {/* Main image */}
        <button
          className="col-span-2 row-span-2 relative overflow-hidden"
          onClick={() => setLightbox(0)}
        >
          {displayImages[0] && (
            <Image src={displayImages[0]} alt={`${title} - photo 1`} fill className="object-cover hover:scale-105 transition-transform duration-300" sizes="50vw" />
          )}
        </button>
        {/* 4 smaller images */}
        {displayImages.slice(1, 5).map((img, i) => (
          <button key={i} className="relative overflow-hidden" onClick={() => setLightbox(i + 1)}>
            <Image src={img} alt={`${title} - photo ${i + 2}`} fill className="object-cover hover:scale-105 transition-transform duration-300" sizes="25vw" />
            {i === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">+{images.length - 5} more</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full" onClick={() => setLightbox(null)}>
            <X className="h-6 w-6" />
          </button>
          <div className="relative w-full max-w-4xl h-[70vh] mx-4" onClick={e => e.stopPropagation()}>
            {images[lightbox] && (
              <Image src={images[lightbox]} alt={`${title} - photo ${lightbox + 1}`} fill className="object-contain" sizes="100vw" />
            )}
          </div>
          <div className="absolute bottom-4 flex gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setLightbox(i) }} className={`w-2 h-2 rounded-full ${i === lightbox ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
