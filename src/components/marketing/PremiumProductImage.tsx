import Image from "next/image"

export default function PremiumProductImage({
  src,
  alt,
  priority = false,
  label,
}: {
  src: string
  alt: string
  priority?: boolean
  label?: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-2 shadow-[0_32px_90px_rgba(15,23,42,0.14)]">
      <div className="flex h-9 items-center gap-1.5 px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffd43b]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#51cf66]" />
        {label && <span className="ml-3 truncate text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</span>}
      </div>
      <Image
        // `?v=` busts the Next.js image-optimizer cache when the product
        // screenshots are re-captured (the optimizer keys on the full URL, so a
        // changed source file alone can otherwise keep serving the stale render).
        // Bump this when the screenshots are regenerated.
        src={`${src}${src.includes("?") ? "&" : "?"}v=rel2`}
        alt={alt}
        width={1536}
        height={1024}
        priority={priority}
        className="h-auto w-full rounded-[20px] border border-slate-100"
        sizes="(max-width: 768px) 96vw, 1200px"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-blue-50/20" />
    </div>
  )
}
