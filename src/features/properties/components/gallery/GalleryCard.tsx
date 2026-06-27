"use client"

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  exterior:  { label: "Exterior",  color: "bg-[var(--color-brand-100)] text-[var(--brand-strong)]" },
  interior:  { label: "Interior",  color: "bg-purple-100 text-purple-800" },
  amenity:   { label: "Amenity",   color: "bg-green-100 text-green-800" },
  floor_plan:{ label: "Floor Plan", color: "bg-amber-100 text-amber-800" },
  other:     { label: "Other",     color: "bg-slate-100 text-slate-800" },
}

interface GalleryImage {
  id: string
  src: string | null
  alt: string
  property: string
  category: string
  gradient?: string
}

interface GalleryCardProps {
  image: GalleryImage
  onClick: () => void
}

export function GalleryCard({ image, onClick }: GalleryCardProps) {
  const catCfg = CATEGORY_CONFIG[image.category] ?? CATEGORY_CONFIG.other

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-xl cursor-pointer group mb-4 break-inside-avoid"
    >
      {image.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.src} alt={image.alt} className="w-full object-cover rounded-xl" />
      ) : (
        <div className={`w-full h-48 rounded-xl ${image.gradient ?? "bg-gradient-to-br from-slate-200 to-slate-300"}`} />
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-xl" />
      <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-white text-xs font-semibold truncate">{image.alt}</p>
        <p className="text-white/80 text-[10px] truncate">{image.property}</p>
      </div>
      {/* Category badge */}
      <span className={`absolute top-2 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${catCfg.color}`}>
        {catCfg.label}
      </span>
    </div>
  )
}
