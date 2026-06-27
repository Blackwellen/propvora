"use client"

// ============================================================================
// ImageCropModal — dependency-free image cropper used before image uploads.
//
// Pan (drag) + zoom (slider/wheel) inside an aspect-locked viewport, then export
// the visible region to a downscaled JPEG/PNG File. Portalled to <body> so it's
// never trapped by an ancestor transform. Light tokens only — NEVER `dark:`.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, RotateCcw, X, ZoomIn } from "lucide-react"

interface ImageCropModalProps {
  file: File | null
  /** Output aspect ratio (width / height). e.g. 16/9 cover, 1 avatar, 3/1 banner. */
  aspect?: number
  title?: string
  /** Longest output edge in px (downscale guard). Default 1600. */
  maxOutput?: number
  onCancel: () => void
  onCropped: (file: File) => void
}

const VIEW_W = 460 // viewport width in px

export default function ImageCropModal({
  file,
  aspect = 16 / 9,
  title = "Crop image",
  maxOutput = 1600,
  onCancel,
  onCropped,
}: ImageCropModalProps) {
  const viewH = Math.round(VIEW_W / aspect)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const imgElRef = useRef<HTMLImageElement | null>(null)
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  // Load the file into an <img>.
  useEffect(() => {
    if (!file) { setImgUrl(null); setNat(null); return }
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    const im = new Image()
    im.onload = () => { imgElRef.current = im; setNat({ w: im.naturalWidth, h: im.naturalHeight }) }
    im.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Base scale so the image always covers the viewport at zoom = 1.
  const baseScale = nat ? Math.max(VIEW_W / nat.w, viewH / nat.h) : 1
  const scale = baseScale * zoom

  // Clamp pan so the image edges never reveal the backdrop.
  const clamp = useCallback((x: number, y: number) => {
    if (!nat) return { x: 0, y: 0 }
    const dw = nat.w * scale
    const dh = nat.h * scale
    const minX = VIEW_W - dw
    const minY = viewH - dh
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    }
  }, [nat, scale, viewH])

  useEffect(() => { setOffset((o) => clamp(o.x, o.y)) }, [zoom, clamp])

  function onPointerDown(e: React.PointerEvent) {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return
    const nx = drag.current.ox + (e.clientX - drag.current.x)
    const ny = drag.current.oy + (e.clientY - drag.current.y)
    setOffset(clamp(nx, ny))
  }
  function onPointerUp() { drag.current = null }

  function reset() { setZoom(1); setOffset({ x: 0, y: 0 }) }

  function apply() {
    if (!nat || !imgElRef.current || !file) return
    // Source rect (in natural px) currently shown in the viewport.
    const sx = -offset.x / scale
    const sy = -offset.y / scale
    const sw = VIEW_W / scale
    const sh = viewH / scale
    // Output size — cap the longest edge.
    let outW = Math.round(sw)
    let outH = Math.round(sh)
    const longest = Math.max(outW, outH)
    if (longest > maxOutput) {
      const r = maxOutput / longest
      outW = Math.round(outW * r)
      outH = Math.round(outH * r)
    }
    const canvas = document.createElement("canvas")
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(imgElRef.current, sx, sy, sw, sh, 0, 0, outW, outH)
    const isPng = file.type === "image/png"
    const mime = isPng ? "image/png" : "image/jpeg"
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const ext = isPng ? "png" : "jpg"
        const base = file.name.replace(/\.[^.]+$/, "") || "image"
        onCropped(new File([blob], `${base}-cropped.${ext}`, { type: mime }))
      },
      mime,
      isPng ? undefined : 0.9,
    )
  }

  if (!file || typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <p className="text-[14px] font-bold text-slate-900">{title}</p>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 p-4">
          {/* Crop viewport */}
          <div
            className="relative touch-none select-none overflow-hidden rounded-xl bg-slate-900"
            style={{ width: VIEW_W, height: viewH, cursor: drag.current ? "grabbing" : "grab" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {imgUrl && nat && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
                style={{
                  width: nat.w * scale,
                  height: nat.h * scale,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
              />
            )}
            {/* Rule-of-thirds overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute left-1/3 top-0 h-full w-px bg-white/70" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-white/70" />
              <div className="absolute top-1/3 left-0 w-full h-px bg-white/70" />
              <div className="absolute top-2/3 left-0 w-full h-px bg-white/70" />
            </div>
          </div>

          {/* Zoom control */}
          <div className="flex w-full items-center gap-3 px-1">
            <ZoomIn className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[var(--brand)]"
              aria-label="Zoom"
            />
            <button
              type="button"
              onClick={reset}
              aria-label="Reset"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!nat}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[var(--brand-strong)] disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> Apply &amp; upload
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
