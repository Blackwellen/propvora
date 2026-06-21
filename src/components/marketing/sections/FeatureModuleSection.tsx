import { Check } from "lucide-react"
import PremiumProductImage from "../PremiumProductImage"

interface FeatureModuleSectionProps {
  eyebrow: string
  title: string
  copy: string
  points: readonly string[]
  images: readonly (readonly [string, string])[]
  index: number
}

export default function FeatureModuleSection({
  eyebrow,
  title,
  copy,
  points,
  images,
  index,
}: FeatureModuleSectionProps) {
  return (
    <section className={`${index % 2 ? "bg-[#f7faff]" : "bg-white"} px-4 py-24 sm:px-6 lg:py-32`}>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-[#06122f] sm:text-5xl">{title}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy}</p>
            <ul className="mt-7 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex gap-3 text-sm font-semibold text-slate-700">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-100">
                    <Check className="h-3 w-3 text-blue-700" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-8">
            {images.map(([file, label], imageIndex) => (
              <figure key={file}>
                <PremiumProductImage
                  label={label}
                  src={`/images/marketing/product/enriched/${file}`}
                  alt={`${label} using illustrative Propvora demo data`}
                  priority={index === 0 && imageIndex === 0}
                />
                <figcaption className="mt-3 flex items-center justify-between px-2 text-xs text-slate-500">
                  <span className="font-bold text-slate-700">{label}</span>
                  <span>Illustrative demo data</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
