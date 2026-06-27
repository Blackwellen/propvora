"use client"

import { useState } from "react"
import Image from "next/image"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { IntentMeta } from "@/components/marketplace-public/intent"

interface Props {
  images: string[]
  title: string
  instantBook: boolean | null | undefined
  intent: IntentMeta
}

/**
 * Photo gallery section for a public marketplace listing detail page.
 * Manages its own active-thumbnail state.
 */
export default function StayGallerySection({ images, title, instantBook, intent }: Props) {
  const [active, setActive] = useState(0)
  const Icon = intent.icon

  const GRADIENT: Record<string, string> = {
    stays: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)",
    suppliers: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
    emergency: "linear-gradient(135deg, #B91C1C 0%, #EF4444 100%)",
    services: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)",
    all: "linear-gradient(135deg, var(--brand-strong) 0%, var(--brand) 100%)",
  }

  return (
    <div>
      <div
        className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
        style={images.length === 0 ? { background: GRADIENT[intent.key] } : undefined}
      >
        {images.length > 0 ? (
          <Image
            key={images[active]}
            src={images[active]}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width:1024px) 100vw, 820px"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-85">
            <Icon className="w-14 h-14 text-white/90" />
            <span className="text-white/80 text-[13px] font-medium">No photos provided</span>
          </div>
        )}
        {instantBook && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[var(--brand)] shadow-sm">
            <Zap className="w-3 h-3" /> Instant book
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={cn(
                "relative w-20 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                i === active ? "border-[var(--brand)]" : "border-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
