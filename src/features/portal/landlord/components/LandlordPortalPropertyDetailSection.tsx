import {
  Home, PoundSterling, MapPin, CreditCard, Wrench, FileText, MessageSquare, Bed, Bath,
  ShieldCheck, Users, History, ArrowDownLeft, ArrowUpRight, AlertTriangle,
} from "lucide-react"
import {
  PortalCard, PortalSectionCard, StatusChip, PortalEmptyState,
  PortalButtonLink, PortalFact, type PortalTone,
} from "@/components/portals/portal-ui"
import { formatMoney, formatDate, propertyStatusMeta } from "@/lib/portal/format"

interface PropertyDetail {
  id: string
  nickname: string | null
  address_line1: string | null
  city: string | null
  postcode: string | null
  status: string
  target_rent_pcm: number | null
}

interface PropertyExtra {
  bedrooms?: number | null
  bathrooms?: number | null
  category?: string | null
  tenure?: string | null
  cover_image_url?: string | null
}

interface Transaction {
  id: string
  direction: string | null
  amount: number | null
  currency: string | null
  description: string | null
  created_at: string | null
}

interface LandlordPortalPropertyDetailSectionProps {
  property: PropertyDetail
  extra: PropertyExtra | null
  transactions: Transaction[]
  base: string
}

export function LandlordPortalPropertyDetailSection({
  property,
  extra,
  transactions,
  base,
}: LandlordPortalPropertyDetailSectionProps) {
  const label =
    property.nickname ||
    [property.address_line1, property.city].filter(Boolean).join(", ") ||
    "Property"
  const meta = propertyStatusMeta(property.status)
  const tone: PortalTone =
    meta.variant === "success" ? "emerald" : meta.variant === "warning" ? "amber" : "slate"
  const incomeIn = transactions
    .filter((t) => t.direction === "in")
    .reduce((s, t) => s + (t.amount ?? 0), 0)
  const lastPay = transactions.find((t) => t.direction === "in")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      <div className="lg:col-span-2 space-y-4">
        <PortalSectionCard title="Financial snapshot" icon={PoundSterling}>
          <div className="grid grid-cols-3 gap-3">
            <PortalFact
              icon={PoundSterling}
              label="Income (to date)"
              value={formatMoney(incomeIn)}
            />
            <PortalFact
              icon={CreditCard}
              label="Last payment"
              value={lastPay ? formatDate(lastPay.created_at) : "—"}
            />
            <PortalFact icon={AlertTriangle} label="Arrears" value={formatMoney(0)} />
          </div>
        </PortalSectionCard>

        <PortalSectionCard
          title="Recent payments"
          icon={CreditCard}
          viewAllHref={`${base}/payments`}
        >
          {transactions.length === 0 ? (
            <PortalEmptyState icon={CreditCard} title="No payments recorded" />
          ) : (
            <div className="divide-y divide-[#EEF3FB] -my-1.5">
              {transactions.slice(0, 5).map((t) => {
                const inc = t.direction === "in"
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        inc ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                      }`}
                    >
                      {inc ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#071B4D] truncate">
                        {t.description ?? (inc ? "Rent received" : "Expense")}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatDate(t.created_at)}</p>
                    </div>
                    <span
                      className={`text-sm font-bold ${inc ? "text-emerald-600" : "text-slate-900"}`}
                    >
                      {inc ? "+" : "−"}
                      {formatMoney(t.amount, t.currency ?? "GBP")}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </PortalSectionCard>

        <PortalSectionCard
          title="Open maintenance"
          icon={Wrench}
          viewAllHref={`${base}/maintenance`}
        >
          <PortalEmptyState
            icon={Wrench}
            title="No open maintenance"
            description="Repairs raised on this property appear here."
          />
        </PortalSectionCard>
      </div>

      <div className="space-y-4">
        <PortalSectionCard title="Tenant & agreement" icon={Users}>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Occupancy</dt>
              <dd>
                <StatusChip tone={tone}>{meta.label}</StatusChip>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tenure</dt>
              <dd className="font-semibold text-[#071B4D]">{extra?.tenure ?? "—"}</dd>
            </div>
          </dl>
        </PortalSectionCard>

        <PortalSectionCard title="Compliance & certificates" icon={ShieldCheck}>
          <ul className="space-y-2 text-sm">
            {["Gas safety", "EPC", "EICR"].map((c) => (
              <li key={c} className="flex items-center justify-between">
                <span className="text-slate-600">{c}</span>
                <StatusChip tone="emerald">Valid</StatusChip>
              </li>
            ))}
          </ul>
        </PortalSectionCard>

        <PortalSectionCard title="Documents" icon={FileText} viewAllHref={`${base}/documents`}>
          <PortalButtonLink
            href={`${base}/documents`}
            variant="ghost"
            className="w-full justify-center"
          >
            View documents
          </PortalButtonLink>
        </PortalSectionCard>

        <PortalSectionCard title="Recent activity" icon={History}>
          <ol className="space-y-2.5">
            {lastPay && (
              <li className="flex gap-3">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-700">Rent received</p>
                  <p className="text-[11px] text-slate-400">{formatDate(lastPay.created_at)}</p>
                </div>
              </li>
            )}
          </ol>
        </PortalSectionCard>
      </div>
    </div>
  )
}
