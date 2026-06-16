import {
  Home, Wrench, Siren, Package, Compass, type LucideIcon,
} from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   Marketplace intent map — the 4 discovery "doors" plus "All".

   Each intent maps to the real DB taxonomy: a top-level `marketplace_categories`
   slug (category filter) AND the fee-bearing `transaction_type`. The segmented
   search tabs and the per-intent landing pages both consume this single source.
─────────────────────────────────────────────────────────────────────────── */

export type IntentKey = "all" | "stays" | "suppliers" | "emergency" | "services"

export interface IntentMeta {
  key: IntentKey
  /** Public URL slug under /marketplace. */
  slug: string
  label: string
  tagline: string
  icon: LucideIcon
  /** Top-level category slug in `marketplace_categories`, or null for "all". */
  category: string | null
  /** Fee-bearing transaction_type the intent maps to, or null for "all". */
  transactionType: string | null
  /** Accent colour token (light only). */
  accent: string
  accentBg: string
  /** Whether the primary CTA is checkout (book/pay) or a quote request. */
  cta: "checkout" | "quote"
}

export const INTENTS: IntentMeta[] = [
  {
    key: "all",
    slug: "",
    label: "All",
    tagline: "Everything across the Propvora marketplace",
    icon: Compass,
    category: null,
    transactionType: null,
    accent: "text-[#2563EB]",
    accentBg: "bg-[#EFF6FF]",
    cta: "checkout",
  },
  {
    key: "stays",
    slug: "stays",
    label: "Stays",
    tagline: "Short lets, serviced accommodation & mid-term stays",
    icon: Home,
    category: "stays",
    transactionType: "stay_booking",
    accent: "text-sky-600",
    accentBg: "bg-sky-50",
    cta: "checkout",
  },
  {
    key: "suppliers",
    slug: "suppliers",
    label: "Suppliers",
    tagline: "Vetted trades, cleaning, gas, electrical & maintenance",
    icon: Wrench,
    category: "suppliers",
    transactionType: "supplier_job",
    accent: "text-orange-600",
    accentBg: "bg-orange-50",
    cta: "quote",
  },
  {
    key: "emergency",
    slug: "emergency",
    label: "Emergency",
    tagline: "Urgent call-outs, ready to respond now",
    icon: Siren,
    category: "emergency",
    transactionType: "emergency_job",
    accent: "text-red-600",
    accentBg: "bg-red-50",
    cta: "quote",
  },
  {
    key: "services",
    slug: "services",
    label: "Services",
    tagline: "Inventory, compliance & professional service packages",
    icon: Package,
    category: "services",
    transactionType: "service_package",
    accent: "text-violet-600",
    accentBg: "bg-[#F5F3FF]",
    cta: "checkout",
  },
]

const BY_KEY = new Map(INTENTS.map((i) => [i.key, i]))
const BY_SLUG = new Map(INTENTS.map((i) => [i.slug, i]))

export function intentByKey(key: string | null | undefined): IntentMeta {
  return (key && BY_KEY.get(key as IntentKey)) || INTENTS[0]
}
export function intentBySlug(slug: string | null | undefined): IntentMeta {
  if (slug == null) return INTENTS[0]
  return BY_SLUG.get(slug) || INTENTS[0]
}

/** Resolve which intent a listing belongs to from its transaction_type. */
export function intentForTransactionType(tt: string | null | undefined): IntentMeta {
  switch (tt) {
    case "stay_booking":
      return intentByKey("stays")
    case "emergency_job":
      return intentByKey("emergency")
    case "service_package":
      return intentByKey("services")
    case "supplier_job":
      return intentByKey("suppliers")
    default:
      return INTENTS[0]
  }
}

/** The public detail URL for a listing, routed by its intent. */
export function publicListingHref(args: { id: string; transactionType?: string | null }): string {
  const intent = intentForTransactionType(args.transactionType)
  switch (intent.key) {
    case "stays":
      return `/marketplace/stays/${args.id}`
    case "services":
      return `/marketplace/services/${args.id}`
    case "suppliers":
    case "emergency":
      return `/marketplace/suppliers/${args.id}`
    default:
      return `/marketplace/suppliers/${args.id}`
  }
}
