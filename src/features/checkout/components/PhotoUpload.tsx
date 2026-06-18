"use client"

// ============================================================================
// Upload-only photo grid. Thumb-friendly tap target (important for emergency).
// Storage path convention: workspaces/{workspaceId}/checkout/{sessionId}/uploads/
// This is a client-only staging area; actual persistence happens via a server
// route. Models max-N constraint and shows local previews.
// ============================================================================

import { useRef, useState } from "react"
import { Camera, X, ImagePlus } from "lucide-react"

interface StagedPhoto {
  id: string
  name: string
  url: string
}

export function PhotoUpload({
  max = 5,
  onChange,
}: {
  max?: number
  onChange?: (count: number) => void
}) {
  const [photos, setPhotos] = useState<StagedPhoto[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function add(files: FileList | null) {
    if (!files) return
    const room = max - photos.length
    const next: StagedPhoto[] = []
    Array.from(files)
      .slice(0, Math.max(0, room))
      .forEach((f) => {
        next.push({ id: `${Date.now()}-${f.name}-${Math.random().toString(36).slice(2, 7)}`, name: f.name, url: URL.createObjectURL(f) })
      })
    const merged = [...photos, ...next].slice(0, max)
    setPhotos(merged)
    onChange?.(merged.length)
  }

  function remove(id: string) {
    const merged = photos.filter((p) => p.id !== id)
    setPhotos(merged)
    onChange?.(merged.length)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => add(e.target.files)}
      />
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {photos.map((p) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border border-[#E2EAF6] bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(p.id)}
              aria-label={`Remove ${p.name}`}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {photos.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#CBD8EE] bg-[#F7FAFF] text-[#2563EB] transition-colors hover:border-[#2563EB] hover:bg-[#EFF5FF]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
              {photos.length === 0 ? <Camera className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
            </span>
            <span className="text-[11.5px] font-semibold">Add photo</span>
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-[11.5px] text-slate-400">
        Upload up to {max} photos. {photos.length}/{max} added.
      </p>
    </div>
  )
}
