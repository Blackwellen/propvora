"use client"

import React, { useRef } from "react"
import {
  UploadCloud,
  ImageIcon,
  Video,
  LayoutGrid,
  Sparkles,
  Wand2,
  Star,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useListingDraft } from "../data/useListingDraft"
import type { MediaPhoto } from "../data/types"
import { Card, SectionTitle, Toggle, ScoreRing, Pill, TextInput } from "../components/primitives"

const STORAGE_PREFIX = (listingId: string | null) =>
  `workspaces/{workspaceId}/listings/${listingId ?? "draft"}/media/`

const AI_CAPTIONS = [
  "Sun-soaked open-plan living with floor-to-ceiling windows",
  "Chef's kitchen with breakfast island and premium appliances",
  "Restful master bedroom dressed in soft neutral linens",
  "Spa-style bathroom with walk-in rainfall shower",
]

function fmtSize(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

export function MediaStep() {
  const { draft, update } = useListingDraft()
  const fileRef = useRef<HTMLInputElement>(null)

  const addPhotos = (files: FileList | null, room: string | null = null) => {
    const list = files ? Array.from(files) : []
    const newPhotos: MediaPhoto[] =
      list.length > 0
        ? list.map((f, i) => ({
            id: `p-${Date.now()}-${i}`,
            storagePath: STORAGE_PREFIX(draft.listingId) + f.name,
            fileName: f.name,
            caption: "",
            alt: "",
            isCover: draft.photos.length === 0 && i === 0,
            room,
            widthPx: 3000,
            heightPx: 2000,
            fileSizeBytes: f.size || 1_800_000,
            format: f.name.split(".").pop()?.toLowerCase() ?? "jpg",
            lighting: "good",
          }))
        : // No real file (button click in seeded mode) — add a placeholder tile.
          [
            {
              id: `p-${Date.now()}`,
              storagePath: STORAGE_PREFIX(draft.listingId) + `photo-${draft.photos.length + 1}.jpg`,
              fileName: `photo-${draft.photos.length + 1}.jpg`,
              caption: "",
              alt: "",
              isCover: draft.photos.length === 0,
              room,
              widthPx: 3000,
              heightPx: 2000,
              fileSizeBytes: 1_900_000,
              format: "jpg",
              lighting: "good",
            },
          ]
    update({
      photos: [...draft.photos, ...newPhotos],
      ...(room
        ? {
            rooms: draft.rooms.map((r) =>
              r.key === room
                ? { ...r, photoIds: [...r.photoIds, ...newPhotos.map((p) => p.id)] }
                : r,
            ),
          }
        : {}),
    })
  }

  const setCover = (id: string) =>
    update({ photos: draft.photos.map((p) => ({ ...p, isCover: p.id === id })) })

  const movePhoto = (id: string, dir: -1 | 1) => {
    const idx = draft.photos.findIndex((p) => p.id === id)
    const next = idx + dir
    if (idx < 0 || next < 0 || next >= draft.photos.length) return
    const arr = [...draft.photos]
    ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
    update({ photos: arr })
  }

  const removePhoto = (id: string) =>
    update({
      photos: draft.photos.filter((p) => p.id !== id),
      rooms: draft.rooms.map((r) => ({ ...r, photoIds: r.photoIds.filter((x) => x !== id) })),
    })

  const setCaption = (id: string, caption: string) =>
    update({ photos: draft.photos.map((p) => (p.id === id ? { ...p, caption } : p)) })
  const setAlt = (id: string, alt: string) =>
    update({ photos: draft.photos.map((p) => (p.id === id ? { ...p, alt } : p)) })

  // Content score: photos, cover, captions, alt text, rooms covered.
  const coverOk = draft.photos.some((p) => p.isCover)
  const captioned = draft.photos.filter((p) => p.caption.trim()).length
  const alts = draft.photos.filter((p) => p.alt.trim()).length
  const roomsCovered = draft.rooms.filter((r) => r.photoIds.length > 0).length
  const contentScore = Math.min(
    100,
    Math.round(
      Math.min(draft.photos.length, 8) * 7 +
        (coverOk ? 14 : 0) +
        (captioned / Math.max(1, draft.photos.length)) * 15 +
        (alts / Math.max(1, draft.photos.length)) * 15 +
        roomsCovered * 3,
    ),
  )

  const missing: string[] = []
  if (draft.photos.length < 5) missing.push(`Add ${5 - draft.photos.length} more photo(s)`)
  if (!coverOk) missing.push("Set a cover image")
  if (!draft.videoTourName) missing.push("Add a video tour")
  if (!draft.floorplanName) missing.push("Upload a floorplan")
  draft.rooms
    .filter((r) => r.photoIds.length === 0)
    .forEach((r) => missing.push(`Add ${r.label} photos`))

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <Card>
        <SectionTitle
          title="Photos"
          hint="Upload only — drag and drop or browse. No external URLs."
          action={
            <Toggle on={draft.autoEnhance} onChange={(v) => update({ autoEnhance: v })} label="Auto-enhance" />
          }
        />
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => addPhotos(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            addPhotos(e.dataTransfer.files)
          }}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-8 transition-colors hover:border-[var(--color-brand-400)] hover:bg-[var(--brand-soft)]"
        >
          <UploadCloud className="h-7 w-7 text-[var(--brand)]" />
          <span className="text-[13px] font-semibold text-slate-700">Upload photos</span>
          <span className="text-[11px] text-slate-400">Drag &amp; drop or click to browse</span>
        </button>
      </Card>

      {/* Gallery reorder */}
      {draft.photos.length > 0 && (
        <Card>
          <SectionTitle title="Gallery order" hint="Numbered tiles — reorder and pick a cover" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {draft.photos.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border-2",
                  p.isCover ? "border-[var(--brand)]" : "border-slate-200",
                )}
              >
                <div className="flex h-24 items-center justify-center bg-slate-100">
                  <ImageIcon className="h-6 w-6 text-slate-300" />
                </div>
                <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/80 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                {p.isCover && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                    Cover
                  </span>
                )}
                <div className="flex items-center justify-between gap-1 bg-white px-1.5 py-1">
                  <div className="flex gap-0.5">
                    <button type="button" aria-label="Move up" onClick={() => movePhoto(p.id, -1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100">
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button type="button" aria-label="Move down" onClick={() => movePhoto(p.id, 1)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100">
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex gap-0.5">
                    <button type="button" aria-label="Set as cover" onClick={() => setCover(p.id)} className="rounded p-0.5 text-amber-400 hover:bg-amber-50">
                      <Star className={cn("h-3 w-3", p.isCover && "fill-amber-400")} />
                    </button>
                    <button type="button" aria-label="Remove" onClick={() => removePhoto(p.id)} className="rounded p-0.5 text-red-400 hover:bg-red-50">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Room-by-room */}
      <Card>
        <SectionTitle title="Room-by-room media" hint="Group photos by room" action={<LayoutGrid className="h-4 w-4 text-slate-400" />} />
        <div className="space-y-2">
          {draft.rooms.map((r) => (
            <div key={r.key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
              <div>
                <p className="text-[13px] font-semibold text-slate-800">{r.label}</p>
                <p className="text-[11px] text-slate-400">{r.photoIds.length} photo(s)</p>
              </div>
              <button
                type="button"
                onClick={() => addPhotos(null, r.key)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Video + floorplan */}
      <Card>
        <SectionTitle title="Video tour & floorplan" />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update({ videoTourName: draft.videoTourName ? null : "property-tour.mp4" })}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed py-5 transition-colors",
              draft.videoTourName ? "border-emerald-300 bg-emerald-50" : "border-slate-300 hover:border-[var(--color-brand-400)]",
            )}
          >
            <Video className={cn("h-5 w-5", draft.videoTourName ? "text-emerald-600" : "text-slate-400")} />
            <span className="text-[12px] font-semibold text-slate-700">
              {draft.videoTourName ?? "Upload video"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => update({ floorplanName: draft.floorplanName ? null : "floorplan.pdf" })}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed py-5 transition-colors",
              draft.floorplanName ? "border-emerald-300 bg-emerald-50" : "border-slate-300 hover:border-[var(--color-brand-400)]",
            )}
          >
            <LayoutGrid className={cn("h-5 w-5", draft.floorplanName ? "text-emerald-600" : "text-slate-400")} />
            <span className="text-[12px] font-semibold text-slate-700">
              {draft.floorplanName ?? "Upload floorplan"}
            </span>
          </button>
        </div>
      </Card>

      {/* Captions & alt + quality readout */}
      {draft.photos.length > 0 && (
        <Card>
          <SectionTitle title="Captions, alt text & quality" hint="Improves accessibility and SEO" />
          <div className="space-y-3">
            {draft.photos.map((p, i) => (
              <div key={p.id} className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-700">Photo {i + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <Pill tone="slate">{p.widthPx}×{p.heightPx}</Pill>
                    <Pill tone="slate">{fmtSize(p.fileSizeBytes)}</Pill>
                    <Pill tone="blue">{p.format.toUpperCase()}</Pill>
                    <Pill tone={p.lighting === "good" ? "emerald" : p.lighting === "fair" ? "amber" : "red"}>
                      {p.lighting} light
                    </Pill>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <TextInput value={p.caption} onChange={(v) => setCaption(p.id, v)} placeholder="Caption" />
                    <button
                      type="button"
                      onClick={() => setCaption(p.id, AI_CAPTIONS[i % AI_CAPTIONS.length])}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-violet-50 px-2 py-2 text-[11px] font-semibold text-violet-700 hover:bg-violet-100"
                    >
                      <Wand2 className="h-3 w-3" /> Use
                    </button>
                  </div>
                  <TextInput value={p.alt} onChange={(v) => setAlt(p.id, v)} placeholder="Alt text" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI helper + content score */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Card>
          <SectionTitle title="AI content helper" action={<Sparkles className="h-4 w-4 text-violet-500" />} />
          <ul className="space-y-2">
            {AI_CAPTIONS.map((c, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-violet-50/60 px-2.5 py-1.5">
                <span className="text-[11.5px] text-slate-700">{c}</span>
                <button
                  type="button"
                  onClick={() => {
                    const target = draft.photos[i]
                    if (target) setCaption(target.id, c)
                  }}
                  className="shrink-0 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-violet-700 shadow-sm hover:bg-violet-100"
                >
                  Use
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              // Photo-order suggestion: cover first, then captioned photos.
              const sorted = [...draft.photos].sort(
                (a, b) => Number(b.isCover) - Number(a.isCover) || (b.caption ? 1 : 0) - (a.caption ? 1 : 0),
              )
              update({ photos: sorted })
            }}
            className="mt-3 w-full rounded-lg border border-violet-200 py-2 text-[12px] font-semibold text-violet-700 hover:bg-violet-50"
          >
            Apply photo-order suggestion
          </button>
        </Card>

        <Card className="flex flex-col items-center justify-center">
          <SectionTitle title="Content score" />
          <ScoreRing value={contentScore} size={96} colour={contentScore >= 70 ? "#10B981" : "#F59E0B"} />
          <p className="mt-2 text-center text-[11px] text-slate-500">
            {contentScore >= 70 ? "Great — listing looks polished" : "Add captions & more photos to lift the score"}
          </p>
        </Card>
      </div>

      {/* Missing media */}
      {missing.length > 0 && (
        <Card>
          <SectionTitle title="Missing media" hint="Recommended before publishing" />
          <ul className="space-y-1.5">
            {missing.map((m, i) => (
              <li key={i} className="flex items-center gap-2 text-[12px] text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {m}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
