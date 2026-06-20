import Link from "next/link"
import { SearchX } from "lucide-react"

interface MarketplaceNotFoundProps {
  title: string
  message: string
  backHref: string
  backLabel: string
}

export default function MarketplaceNotFound({
  title,
  message,
  backHref,
  backLabel,
}: MarketplaceNotFoundProps) {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <SearchX className="w-8 h-8 text-slate-300" />
      </div>
      <h1 className="text-[19px] font-bold text-[#0B1B3F]">{title}</h1>
      <p className="mt-2 text-[13.5px] text-slate-500">{message}</p>
      <Link
        href={backHref}
        className="mt-5 inline-flex h-11 px-5 items-center rounded-xl bg-[#2563EB] text-white text-[14px] font-semibold hover:bg-[#1d4ed8] transition-colors"
      >
        {backLabel}
      </Link>
    </div>
  )
}
