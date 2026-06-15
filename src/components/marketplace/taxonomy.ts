import {
  Wrench, Home, Briefcase, Sparkles, ShieldCheck, Hammer, Building2,
  Truck, Megaphone, type LucideIcon, Tag,
} from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   Marketplace taxonomy — categories + transaction types.

   Presentation metadata only (label, icon, accent). The canonical value set
   is owned by the data layer; this map is tolerant — an unknown key falls back
   to a neutral "Other" descriptor so the UI never breaks on a new server value.
─────────────────────────────────────────────────────────────────────────── */

export interface CategoryMeta {
  key: string
  label: string
  icon: LucideIcon
  /** Tailwind text colour for the icon chip. */
  color: string
  /** Tailwind background for the icon chip. */
  bg: string
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "maintenance", label: "Maintenance", icon: Wrench, color: "text-[#2563EB]", bg: "bg-[#EFF6FF]" },
  { key: "trades", label: "Trades", icon: Hammer, color: "text-orange-600", bg: "bg-orange-50" },
  { key: "cleaning", label: "Cleaning", icon: Sparkles, color: "text-cyan-600", bg: "bg-cyan-50" },
  { key: "compliance", label: "Compliance", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "professional", label: "Professional", icon: Briefcase, color: "text-violet-600", bg: "bg-[#F5F3FF]" },
  { key: "property", label: "Property", icon: Home, color: "text-sky-600", bg: "bg-sky-50" },
  { key: "supplies", label: "Supplies", icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
  { key: "facilities", label: "Facilities", icon: Building2, color: "text-slate-600", bg: "bg-slate-100" },
  { key: "marketing", label: "Marketing", icon: Megaphone, color: "text-pink-600", bg: "bg-pink-50" },
]

const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.key, c]))

export function categoryMeta(key: string | null | undefined): CategoryMeta {
  if (key && CATEGORY_MAP.has(key)) return CATEGORY_MAP.get(key)!
  // Tolerant fallback for any unmapped server-side category value.
  return {
    key: key ?? "other",
    label: key ? prettify(key) : "Other",
    icon: Tag,
    color: "text-slate-600",
    bg: "bg-slate-100",
  }
}

export interface TransactionTypeMeta {
  key: string
  label: string
  /** chip background + text classes */
  chip: string
}

export const TRANSACTION_TYPES: TransactionTypeMeta[] = [
  { key: "service", label: "Service", chip: "bg-[#EFF6FF] text-[#2563EB] border border-blue-100" },
  { key: "booking", label: "Booking", chip: "bg-violet-50 text-[#7C3AED] border border-violet-100" },
  { key: "rental", label: "Rental", chip: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
  { key: "sale", label: "For sale", chip: "bg-amber-50 text-amber-700 border border-amber-100" },
  { key: "lead", label: "Enquiry", chip: "bg-slate-100 text-slate-600 border border-slate-200" },
]

const TT_MAP = new Map(TRANSACTION_TYPES.map((t) => [t.key, t]))

export function transactionTypeMeta(key: string | null | undefined): TransactionTypeMeta {
  if (key && TT_MAP.has(key)) return TT_MAP.get(key)!
  return {
    key: key ?? "other",
    label: key ? prettify(key) : "Listing",
    chip: "bg-slate-100 text-slate-600 border border-slate-200",
  }
}

/** "per_night" → "Per night"; "service" → "Service". */
export function prettify(raw: string): string {
  return raw
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}

/** Common country labels for the filter bar (extend as packs land). */
export const COUNTRY_OPTIONS: { value: string; label: string }[] = [
  { value: "GB", label: "United Kingdom" },
  { value: "IE", label: "Ireland" },
  { value: "US", label: "United States" },
  { value: "AE", label: "UAE" },
  { value: "AU", label: "Australia" },
]
