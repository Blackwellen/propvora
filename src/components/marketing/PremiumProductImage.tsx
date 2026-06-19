import Image from "next/image"

export default function PremiumProductImage({
  src,
  alt,
  priority = false,
}: {
  src: string
  alt: string
  priority?: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-2 shadow-[0_32px_90px_rgba(15,23,42,0.14)]">
      <Image
        src={src}
        alt={alt}
        width={1536}
        height={1024}
        priority={priority}
        className="h-auto w-full rounded-[21px]"
        sizes="(max-width: 768px) 96vw, 1200px"
      />
    </div>
  )
}
