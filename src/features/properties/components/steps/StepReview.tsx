import { cn } from "@/lib/utils"
import { PLANNING_PROFILES } from "@/lib/planning/profiles"
import { getPropertyTypeOption } from "@/lib/constants/propertyTypes"

interface Unit {
  id: string
  name: string
  type: string
  targetRent: number
}

interface StepReviewData {
  name: string
  propertyType: string
  status: string
  addressLine1: string
  city: string
  postcode: string
  operationProfile: string
  bedrooms: number
  bathrooms: number
  purchasePrice: number
  currentValue: number
  targetRent: number
  units: Unit[]
}

interface StepReviewProps {
  data: StepReviewData
}

export function StepReview({ data }: StepReviewProps) {
  const selectedProfile = PLANNING_PROFILES.find((p) => p.key === data.operationProfile)
  const rows = [
    { label: "Name",              value: data.name || "—" },
    { label: "Type",              value: getPropertyTypeOption(data.propertyType)?.label || "—" },
    { label: "Status",            value: data.status || "—" },
    { label: "Address",           value: [data.addressLine1, data.city, data.postcode].filter(Boolean).join(", ") || "—" },
    { label: "Operation Profile", value: selectedProfile?.label || "—" },
    { label: "Bedrooms",          value: String(data.bedrooms) },
    { label: "Bathrooms",         value: String(data.bathrooms) },
    { label: "Purchase Price",    value: data.purchasePrice ? `£${data.purchasePrice.toLocaleString()}` : "—" },
    { label: "Current Value",     value: data.currentValue ? `£${data.currentValue.toLocaleString()}` : "—" },
    { label: "Target Rent",       value: data.targetRent ? `£${data.targetRent.toLocaleString()}/mo` : "—" },
    { label: "Units",             value: data.units.length > 0 ? `${data.units.length} units` : "None" },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-50 rounded-2xl overflow-hidden border border-[#E2E8F0]">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={cn("flex items-center justify-between px-4 py-3 text-sm", i % 2 === 0 ? "bg-white" : "bg-slate-50")}
          >
            <span className="text-slate-500">{row.label}</span>
            <span className="font-medium text-slate-900 text-right max-w-[240px] truncate">{row.value}</span>
          </div>
        ))}
      </div>
      {data.units.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Units</p>
          <div className="flex flex-col gap-1.5">
            {data.units.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-[#E2E8F0] text-sm">
                <span className="text-slate-700">{u.name} ({u.type})</span>
                <span className="font-medium text-[#10B981]">£{u.targetRent}/mo</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
