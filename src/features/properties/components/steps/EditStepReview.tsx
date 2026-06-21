import type { useForm } from "react-hook-form"

interface FormData {
  name: string
  status: string
  address_line1: string
  address_line2?: string
  city: string
  postcode: string
  property_type: string
  operation_profile: string
  bedrooms: number
  bathrooms: number
  target_rent: number
  [key: string]: unknown
}

interface EditStepReviewProps {
  watch: ReturnType<typeof useForm<FormData>>["watch"]
}

export function EditStepReview({ watch }: EditStepReviewProps) {
  const data = watch()
  const rows: [string, string][] = [
    ["Property name",     data.name],
    ["Status",            data.status],
    ["Address",           [data.address_line1, data.address_line2, data.city, data.postcode].filter(Boolean).join(", ")],
    ["Property type",     data.property_type],
    ["Operation profile", data.operation_profile],
    ["Bedrooms",          String(data.bedrooms)],
    ["Bathrooms",         String(data.bathrooms)],
    ["Target rent",       data.target_rent > 0 ? `£${data.target_rent}/mo` : "—"],
  ]

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-white">
        <p className="text-sm font-semibold text-slate-900">Property summary</p>
        <p className="text-xs text-slate-500 mt-0.5">Review before saving</p>
      </div>
      <div className="divide-y divide-slate-200">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-semibold text-slate-900 text-right max-w-[200px] truncate">
              {value || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
