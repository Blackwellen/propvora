"use client"

import React, { useState, useMemo, useRef, useCallback } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import {
  ArrowLeft, Images, Search, X, ChevronLeft, ChevronRight,
  Building2, Home, ZoomIn, Upload, Download, Maximize2, Tag, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobilePageHeader from "@/components/mobile/MobilePageHeader"
import MobileFilterSheet, { type FilterGroup } from "@/components/mobile/MobileFilterSheet"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
type GalleryCategory = "property" | "unit" | "inspection" | "document"

interface GalleryImage {
  id: string
  src: string | null
  alt: string
  category: GalleryCategory
  propertyId: string | null
  propertyName: string
  unitId?: string | null
  unitName?: string | null
  title: string
}

const CATEGORY_MAP: Record<string, GalleryCategory> = {
  property:   "property",
  unit:       "unit",
  inspection: "inspection",
  compliance: "inspection",
  tenancy:    "document",
  general:    "document",
}

const CATEGORY_CONFIG: Record<GalleryCategory, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  property:   { label: "Property",   color: "text-[#2563EB]",  bg: "bg-blue-50",    icon: Building2 },
  unit:       { label: "Unit/Room",  color: "text-[#7C3AED]",  bg: "bg-violet-50",  icon: Home },
  document:   { label: "Document",   color: "text-slate-600",  bg: "bg-slate-50",   icon: Tag },
  inspection: { label: "Inspection", color: "text-amber-600",  bg: "bg-amber-50",   icon: ZoomIn },
}

const GALLERY_GRADIENTS = [
  "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
  "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
  "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
  "linear-gradient(135deg, #0891B2 0%, #0EA5E9 100%)",
  "linear-gradient(135deg, #DB2777 0%, #EC4899 100%)",
  "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
  "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)",
]

function gradientForId(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return GALLERY_GRADIENTS[Math.abs(h) % GALLERY_GRADIENTS.length]
}

/* ------------------------------------------------------------------ */
/* Data hook                                                            */
/* ------------------------------------------------------------------ */
function useGallery(workspaceId: string | undefined) {
  const supabase = createClient()
  return useQuery<GalleryImage[]>({
    queryKey: ["gallery", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_media")
        .select(`
          id, title, category, public_url, storage_path,
          property_id, unit_id,
          properties ( nickname, address_line_1 ),
          property_units ( unit_ref )
        `)
        .eq("workspace_id", workspaceId!)
        .eq("media_type", "image")
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []).map((m: any) => {
        const prop = Array.isArray(m.properties) ? m.properties[0] : m.properties
        const unit = Array.isArray(m.property_units) ? m.property_units[0] : m.property_units
        return {
          id: m.id,
          src: m.public_url ?? null,
          alt: m.title ?? "Property image",
          category: CATEGORY_MAP[m.category] ?? "property",
          propertyId: m.property_id,
          propertyName: prop?.nickname ?? prop?.address_line_1 ?? "Unassigned",
          unitId: m.unit_id,
          unitName: unit?.unit_ref ?? null,
          title: m.title ?? "Untitled",
        } satisfies GalleryImage
      })
    },
  })
}

/* ------------------------------------------------------------------ */
/* Upload handler                                                        */
/* ------------------------------------------------------------------ */
function useUpload(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const upload = useCallback(async (files: FileList | null) => {
    if (!files || !workspaceId) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()
        const path = `property-media/${workspaceId}/${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("property-media")
          .upload(path, file, { upsert: false })
        if (uploadError) { console.error("Upload error:", uploadError); continue }
        const { data: urlData } = supabase.storage.from("property-media").getPublicUrl(path)
        await supabase.from("property_media").insert({
          workspace_id: workspaceId,
          storage_path: path,
          public_url: urlData.publicUrl,
          media_type: "image",
          category: "property",
          title: file.name.replace(/\.[^.]+$/, ""),
          file_size_bytes: file.size,
          mime_type: file.type,
        })
      }
      qc.invalidateQueries({ queryKey: ["gallery", workspaceId] })
    } finally {
      setUploading(false)
    }
  }, [supabase, qc, workspaceId])

  return { upload, uploading }
}

/* ------------------------------------------------------------------ */
/* Lightbox                                                             */
/* ------------------------------------------------------------------ */
function Lightbox({ images, index, onClose, onPrev, onNext }: {
  images: GalleryImage[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const img = images[index]

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onPrev()
      if (e.key === "ArrowRight") onNext()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, onPrev, onNext])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative max-w-5xl w-full mx-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/50">
          {img.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img.src} alt={img.alt} className="absolute inset-0 w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: gradientForId(img.id) }}>
              <div className="flex flex-col items-center gap-3 opacity-30">
                {img.category === "unit" ? <Home className="w-16 h-16 text-white" /> : <Building2 className="w-16 h-16 text-white" />}
                <span className="text-white text-sm font-medium">{img.title}</span>
              </div>
            </div>
          )}

          <button onClick={onPrev} aria-label="Previous image" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={onNext} aria-label="Next image" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-white font-semibold text-sm">{img.title}</p>
            <p className="text-white/60 text-xs mt-0.5">{img.propertyName}{img.unitName ? ` · ${img.unitName}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs">{index + 1} / {images.length}</span>
            {img.src && (
              <a href={img.src} download aria-label="Download image" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <Download className="w-4 h-4" />
              </a>
            )}
            <button aria-label="Close" onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Gallery card                                                         */
/* ------------------------------------------------------------------ */
function GalleryCard({ image, onClick }: { image: GalleryImage; onClick: () => void }) {
  const cat = CATEGORY_CONFIG[image.category]
  const CatIcon = cat.icon

  return (
    <button onClick={onClick} className="group relative overflow-hidden rounded-2xl bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 shadow-sm hover:shadow-lg transition-all duration-200 w-full">
      <div className="w-full h-48 transition-transform duration-300 group-hover:scale-105 relative overflow-hidden">
        {image.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: gradientForId(image.id) }}>
            <div className="opacity-20">
              {image.category === "unit" ? <Home className="w-10 h-10 text-white" /> : <Building2 className="w-10 h-10 text-white" />}
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
        <p className="text-white text-xs font-semibold truncate">{image.title}</p>
        <p className="text-white/70 text-[10px] truncate">{image.propertyName}</p>
        <div className="absolute top-2.5 right-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Maximize2 className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>

      <div className={cn("absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold shadow-sm", cat.bg, cat.color)}>
        <CatIcon className="w-2.5 h-2.5" />
        {cat.label}
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function PortfolioGalleryPage() {
  const workspaceId = useWorkspaceId()
  const { data: images = [], isLoading } = useGallery(workspaceId)
  const { upload, uploading } = useUpload(workspaceId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("all")
  const [filterProp, setFilterProp] = useState("all")
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const allProperties = useMemo(() => Array.from(new Set(images.map((i) => i.propertyName))).sort(), [images])

  const filtered = useMemo(() => {
    let r = [...images]
    if (search) r = r.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()) || i.propertyName.toLowerCase().includes(search.toLowerCase()))
    if (filterCat !== "all") r = r.filter((i) => i.category === filterCat)
    if (filterProp !== "all") r = r.filter((i) => i.propertyName === filterProp)
    return r
  }, [images, search, filterCat, filterProp])

  const openLightbox = (idx: number) => setLightboxIdx(idx)
  const closeLightbox = () => setLightboxIdx(null)
  const prevImage = () => setLightboxIdx((i) => i != null ? (i - 1 + filtered.length) % filtered.length : null)
  const nextImage = () => setLightboxIdx((i) => i != null ? (i + 1) % filtered.length : null)

  const propCount = filtered.filter((i) => i.category === "property").length
  const unitCount = filtered.filter((i) => i.category === "unit").length
  const activeFilters = [filterCat !== "all", filterProp !== "all"].filter(Boolean).length
  const clearFilters = () => { setSearch(""); setFilterCat("all"); setFilterProp("all") }

  const mobileFilterGroups: FilterGroup[] = [
    { key: "category", label: "Category", value: filterCat, onChange: setFilterCat, options: [{ value: "all", label: "All" }, { value: "property", label: "Properties" }, { value: "unit", label: "Units" }] },
    { key: "property", label: "Property", value: filterProp, onChange: setFilterProp, options: [{ value: "all", label: "All properties" }, ...allProperties.map((p) => ({ value: p, label: p }))] },
  ]

  return (
    <DashboardContainer>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />

      <MobileTopBar title="Portfolio Gallery" subtitle={`${images.length} images`} showBack backHref="/property-manager/portfolio" />

      <MobilePageHeader hideTitle
        title="Portfolio Gallery"
        count={`${filtered.length} images · ${propCount} property · ${unitCount} unit`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search images…"
        onOpenFilters={() => setShowMobileFilters(true)}
        activeFilterCount={activeFilters}
      />

      <MobileFilterSheet open={showMobileFilters} onClose={() => setShowMobileFilters(false)} groups={mobileFilterGroups} activeCount={activeFilters} onClear={clearFilters} />

      <div className="hidden md:block">
        <PageHeader
          title="Portfolio Gallery"
          description={`${filtered.length} images · ${propCount} property · ${unitCount} unit`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" asChild>
                <Link href="/property-manager/portfolio"><ArrowLeft className="w-4 h-4" />Portfolio</Link>
              </Button>
              <Button variant="primary" size="md" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Uploading…" : "Upload images"}
              </Button>
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search images..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl text-sm bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all shadow-sm" />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
            {[{ key: "all", label: "All" }, { key: "property", label: "Properties" }, { key: "unit", label: "Units" }].map(({ key, label }) => (
              <button key={key} onClick={() => setFilterCat(key)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filterCat === key ? "bg-white shadow-sm text-[#2563EB]" : "text-slate-500 hover:text-slate-700")}>{label}</button>
            ))}
          </div>

          <select value={filterProp} onChange={(e) => setFilterProp(e.target.value)} className="h-9 px-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 shadow-sm cursor-pointer">
            <option value="all">All properties</option>
            {allProperties.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          {(search || filterCat !== "all" || filterProp !== "all") && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-3.5 h-3.5" />Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="break-inside-avoid w-full h-48 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Images className="w-8 h-8 text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">{images.length === 0 ? "No images yet" : "No matching images"}</p>
            <p className="text-xs text-slate-500 mt-1">{images.length === 0 ? "Upload property photos to build your gallery." : "Try adjusting your filters."}</p>
          </div>
          {images.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
          )}
        </div>
      )}

      {/* Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filtered.map((img, idx) => (
            <div key={img.id} className="break-inside-avoid">
              <GalleryCard image={img} onClick={() => openLightbox(idx)} />
            </div>
          ))}
        </div>
      )}

      {/* Upload drop zone */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mt-8 w-full border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-[#2563EB]/30 hover:bg-blue-50/20 transition-all cursor-pointer group disabled:opacity-50"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
          {uploading ? <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" /> : <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#2563EB] transition-colors" />}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-600 group-hover:text-[#2563EB] transition-colors">
            {uploading ? "Uploading images…" : "Upload property or unit images"}
          </p>
          <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP · max 10 MB per file</p>
        </div>
      </button>

      {lightboxIdx != null && (
        <Lightbox images={filtered} index={lightboxIdx} onClose={closeLightbox} onPrev={prevImage} onNext={nextImage} />
      )}
    </DashboardContainer>
  )
}
