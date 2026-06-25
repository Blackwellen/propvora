"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import {
  ArrowLeft, Images, Search, X, ChevronLeft, ChevronRight,
  Building2, Home, ZoomIn, Upload, Download, Maximize2, Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobilePageHeader from "@/components/mobile/MobilePageHeader"
import MobileFilterSheet, { type FilterGroup } from "@/components/mobile/MobileFilterSheet"

/* ------------------------------------------------------------------ */
/* Types & data                                                         */
/* ------------------------------------------------------------------ */
interface GalleryImage {
  id: string
  src: string
  alt: string
  category: "property" | "unit" | "document" | "inspection"
  propertyId: string
  propertyName: string
  unitId?: string
  unitName?: string
  title: string
  width: number
  height: number
}

/* Gradient palette for gallery placeholders — keyed by index */
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

const GALLERY_IMAGES: GalleryImage[] = []

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  property:   { label: "Property",   color: "text-[#2563EB]",  bg: "bg-blue-50",    icon: Building2 },
  unit:       { label: "Unit/Room",  color: "text-[#7C3AED]",  bg: "bg-violet-50",  icon: Home },
  document:   { label: "Document",   color: "text-slate-600",  bg: "bg-slate-50",   icon: Tag },
  inspection: { label: "Inspection", color: "text-amber-600",  bg: "bg-amber-50",   icon: ZoomIn },
}

const PROPERTIES = Array.from(new Set(GALLERY_IMAGES.map((i) => i.propertyName))).sort()

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

  // Close on escape
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-[fadeIn_150ms_ease-out]" onClick={onClose}>
      <div className="relative max-w-5xl w-full mx-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        {/* Image placeholder */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/50">
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: GALLERY_GRADIENTS[parseInt(img.id.replace("g", ""), 10) % GALLERY_GRADIENTS.length] }}
          >
            <div className="flex flex-col items-center gap-3 opacity-30">
              {img.category === "unit" ? <Home className="w-16 h-16 text-white" /> : <Building2 className="w-16 h-16 text-white" />}
              <span className="text-white text-sm font-medium">{img.title}</span>
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={onPrev}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onNext}
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Caption */}
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-white font-semibold text-sm">{img.title}</p>
            <p className="text-white/60 text-xs mt-0.5">
              {img.propertyName}{img.unitName ? ` · ${img.unitName}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs">{index + 1} / {images.length}</span>
            <button aria-label="Download image" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <Download className="w-4 h-4" />
            </button>
            <button aria-label="Close"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
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
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 shadow-sm hover:shadow-lg transition-all duration-200"
    >
      {/* Gradient placeholder — real uploaded images would go here */}
      <div
        className="w-full h-48 transition-transform duration-300 group-hover:scale-105"
        style={{ background: GALLERY_GRADIENTS[parseInt(image.id.replace("g", ""), 10) % GALLERY_GRADIENTS.length] }}
      >
        <div className="w-full h-full flex items-center justify-center opacity-20">
          {image.category === "unit" ? <Home className="w-10 h-10 text-white" /> : <Building2 className="w-10 h-10 text-white" />}
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
        <p className="text-white text-xs font-semibold truncate">{image.title}</p>
        <p className="text-white/70 text-[10px] truncate">{image.propertyName}</p>
        <div className="absolute top-2.5 right-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Maximize2 className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>

      {/* Category badge */}
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
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("all")
  const [filterProp, setFilterProp] = useState("all")
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const filtered = useMemo(() => {
    let r = [...GALLERY_IMAGES]
    if (search) r = r.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()) || i.propertyName.toLowerCase().includes(search.toLowerCase()) || (i.unitName ?? "").toLowerCase().includes(search.toLowerCase()))
    if (filterCat !== "all") r = r.filter((i) => i.category === filterCat)
    if (filterProp !== "all") r = r.filter((i) => i.propertyName === filterProp)
    return r
  }, [search, filterCat, filterProp])

  function openLightbox(idx: number) { setLightboxIdx(idx) }
  function closeLightbox() { setLightboxIdx(null) }
  function prevImage() { setLightboxIdx((i) => i != null ? (i - 1 + filtered.length) % filtered.length : null) }
  function nextImage() { setLightboxIdx((i) => i != null ? (i + 1) % filtered.length : null) }

  const propCount = filtered.filter((i) => i.category === "property").length
  const unitCount = filtered.filter((i) => i.category === "unit").length
  const activeFilters = [filterCat !== "all", filterProp !== "all"].filter(Boolean).length

  function clearFilters() { setSearch(""); setFilterCat("all"); setFilterProp("all") }

  /* ── Mobile filter groups (mirror the desktop toolbar) ─────────────────── */
  const mobileFilterGroups: FilterGroup[] = [
    {
      key: "category",
      label: "Category",
      value: filterCat,
      onChange: setFilterCat,
      options: [
        { value: "all", label: "All" },
        { value: "property", label: "Properties" },
        { value: "unit", label: "Units" },
      ],
    },
    {
      key: "property",
      label: "Property",
      value: filterProp,
      onChange: setFilterProp,
      options: [{ value: "all", label: "All properties" }, ...PROPERTIES.map((p) => ({ value: p, label: p }))],
    },
  ]

  return (
    <DashboardContainer>
      {/* Mobile top bar */}
      <MobileTopBar
        title="Portfolio Gallery"
        subtitle={`${filtered.length} images`}
        showBack
        backHref="/property-manager/portfolio"
      />

      {/* Mobile page header — search + filter sheet trigger */}
      <MobilePageHeader hideTitle
        title="Portfolio Gallery"
        count={`${filtered.length} images · ${propCount} property · ${unitCount} unit`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search images…"
        onOpenFilters={() => setShowMobileFilters(true)}
        activeFilterCount={activeFilters}
      />

      <MobileFilterSheet
        open={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        groups={mobileFilterGroups}
        activeCount={activeFilters}
        onClear={clearFilters}
      />

      {/* Desktop header — hidden on phones */}
      <div className="hidden md:block">
      <PageHeader
        title="Portfolio Gallery"
        description={`${filtered.length} images · ${propCount} property · ${unitCount} unit`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" asChild>
              <Link href="/property-manager/portfolio"><ArrowLeft className="w-4 h-4" />Portfolio</Link>
            </Button>
            <Button variant="primary" size="md">
              <Upload className="w-4 h-4" />Upload images
            </Button>
          </div>
        }
      />

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all shadow-sm"
          />
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
          {[{ key: "all", label: "All" }, { key: "property", label: "Properties" }, { key: "unit", label: "Units" }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterCat(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filterCat === key ? "bg-white shadow-sm text-[#2563EB]" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Property filter */}
        <select
          value={filterProp}
          onChange={(e) => setFilterProp(e.target.value)}
          className="h-9 px-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 shadow-sm cursor-pointer"
        >
          <option value="all">All properties</option>
          {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        {(search || filterCat !== "all" || filterProp !== "all") && (
          <button
            onClick={() => { setSearch(""); setFilterCat("all"); setFilterProp("all") }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />Clear
          </button>
        )}
      </div>
      </div>
      {/* end desktop header/toolbar (hidden on phones) */}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Images className="w-8 h-8 text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">No images yet</p>
            <p className="text-xs text-slate-500 mt-1">Upload property photos below to build your gallery.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFilterCat("all"); setFilterProp("all") }}>
            Clear filters
          </Button>
        </div>
      ) : (
        /* Masonry grid using CSS columns */
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filtered.map((img, idx) => (
            <div key={img.id} className="break-inside-avoid">
              <GalleryCard image={img} onClick={() => openLightbox(idx)} />
            </div>
          ))}
        </div>
      )}

      {/* Upload CTA (empty area) */}
      <div className="mt-8 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-[#2563EB]/30 hover:bg-blue-50/20 transition-all cursor-pointer group">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
          <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-600 group-hover:text-[#2563EB] transition-colors">Upload property or unit images</p>
          <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP · max 10 MB per file</p>
        </div>
        <Button variant="outline" size="sm"><Upload className="w-3.5 h-3.5" />Choose files</Button>
      </div>

      {/* Lightbox */}
      {lightboxIdx != null && (
        <Lightbox
          images={filtered}
          index={lightboxIdx}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </DashboardContainer>
  )
}
