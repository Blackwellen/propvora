"use client"

import { useState, useEffect, useCallback } from "react"
import { ImageIcon, Grid2x2, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ListingGalleryProps {
  images: string[]
  title: string
}

/**
 * Airbnb 1:1 premium listing gallery.
 *
 * Desktop: 1 large hero (left, 60%) + 2×2 mosaic (right, 40%), rounded corners
 * on the outer edges only. "Show all photos" button over the last cell opens a
 * full-screen lightbox with keyboard navigation.
 *
 * Mobile: single-photo hero with swipe arrows and dot indicators + "Show all" sheet.
 */
export default function ListingGallery({ images, title }: ListingGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [mobileIndex, setMobileIndex] = useState(0)
  const valid = images.filter((u) => typeof u === "string" && u.length > 0)

  const totalPhotos = valid.length

  const openLightbox = useCallback((i: number) => {
    setLightboxIndex(i)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  const lbPrev = useCallback(
    () => setLightboxIndex((i) => (i - 1 + totalPhotos) % totalPhotos),
    [totalPhotos]
  )
  const lbNext = useCallback(
    () => setLightboxIndex((i) => (i + 1) % totalPhotos),
    [totalPhotos]
  )

  // Keyboard handler for lightbox
  useEffect(() => {
    if (!lightboxOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox()
      if (e.key === "ArrowLeft") lbPrev()
      if (e.key === "ArrowRight") lbNext()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [lightboxOpen, closeLightbox, lbPrev, lbNext])

  // Lock scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [lightboxOpen])

  if (valid.length === 0) {
    return (
      <div className="w-full h-[320px] sm:h-[420px] rounded-2xl bg-gradient-to-br from-slate-100 to-blue-50 border border-[#E2EAF6] flex flex-col items-center justify-center gap-2 text-slate-400">
        <ImageIcon className="w-10 h-10" aria-hidden="true" />
        <span className="text-[14px] font-medium">No photos yet</span>
      </div>
    )
  }

  return (
    <>
      {/* ── Mobile: hero + swipe arrows + counter ── */}
      <div className="sm:hidden relative">
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={valid[mobileIndex]}
            alt={`${title} — photo ${mobileIndex + 1} of ${totalPhotos}`}
            className="w-full h-full object-cover"
            onClick={() => openLightbox(mobileIndex)}
          />
          {totalPhotos > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => setMobileIndex((i) => (i - 1 + totalPhotos) % totalPhotos)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => setMobileIndex((i) => (i + 1) % totalPhotos)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>
              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {valid.slice(0, 8).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMobileIndex(i)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === mobileIndex ? "bg-white scale-125" : "bg-white/60"
                    )}
                  />
                ))}
                {totalPhotos > 8 && <span className="text-white/60 text-[10px] font-medium">…</span>}
              </div>
              {/* Counter */}
              <div className="absolute top-3 right-3 bg-slate-900/60 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                {mobileIndex + 1} / {totalPhotos}
              </div>
            </>
          )}
        </div>
        {/* Show all button (mobile) */}
        {totalPhotos > 1 && (
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-[12.5px] font-semibold text-[#0B1B3F] px-3 py-1.5 rounded-lg shadow"
          >
            <Grid2x2 className="w-3.5 h-3.5" />
            Show all {totalPhotos} photos
          </button>
        )}
      </div>

      {/* ── Desktop: Airbnb 5-photo grid ── */}
      <div className="hidden sm:grid grid-cols-10 grid-rows-2 gap-2 h-[460px] rounded-2xl overflow-hidden">
        {/* Hero: 6 cols × 2 rows */}
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="col-span-6 row-span-2 relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={valid[0]}
            alt={`${title} — main photo`}
            className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-200"
          />
        </button>

        {/* 4 thumbnails: 4 cols × 1 row each, 2 per row */}
        {[1, 2, 3, 4].map((i) => {
          const isLast = i === 4 && totalPhotos > 5
          const url = valid[i]
          if (!url) {
            return (
              <div
                key={i}
                className={cn(
                  "col-span-2 bg-slate-100",
                  i <= 2 ? "row-start-1" : "row-start-2"
                )}
              />
            )
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => openLightbox(i)}
              className={cn(
                "col-span-2 relative group overflow-hidden bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]",
                i <= 2 ? "row-start-1" : "row-start-2"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`${title} — photo ${i + 1}`}
                className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-200"
              />
              {isLast && (
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 bg-white text-[#0B1B3F] text-[13px] font-semibold px-4 py-2 rounded-xl shadow-md">
                    <Grid2x2 className="w-4 h-4" />
                    Show all {totalPhotos} photos
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Show all button when < 5 photos on desktop */}
      {totalPhotos > 0 && totalPhotos <= 5 && (
        <div className="hidden sm:block mt-3">
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="inline-flex items-center gap-2 border border-slate-300 text-[13px] font-semibold text-[#0B1B3F] px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Grid2x2 className="w-4 h-4" />
            Show all {totalPhotos} photos
          </button>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
          onClick={closeLightbox}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/70 text-[13px] font-medium">
              {lightboxIndex + 1} / {totalPhotos}
            </span>
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Close gallery"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Main image */}
          <div
            className="flex-1 flex items-center justify-center px-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={lightboxIndex}
              src={valid[lightboxIndex]}
              alt={`${title} — photo ${lightboxIndex + 1} of ${totalPhotos}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {totalPhotos > 1 && (
              <>
                <button
                  type="button"
                  onClick={lbPrev}
                  aria-label="Previous photo"
                  className="absolute left-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  type="button"
                  onClick={lbNext}
                  aria-label="Next photo"
                  className="absolute right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {totalPhotos > 1 && (
            <div
              className="shrink-0 px-4 py-4 flex gap-2 overflow-x-auto scrollbar-hide"
              onClick={(e) => e.stopPropagation()}
            >
              {valid.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`View photo ${i + 1}`}
                  className={cn(
                    "shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                    i === lightboxIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
