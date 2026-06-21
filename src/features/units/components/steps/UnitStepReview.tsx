import { cn } from "@/lib/utils"

const UNIT_TYPE_LABELS: Record<string, string> = {
  room:     "Room",
  en_suite: "En-suite",
  studio:   "Studio",
  flat:     "Flat / Apartment",
  suite:    "Suite",
  office:   "Office",
  other:    "Other",
}

const STATUS_LABELS: Record<string, string> = {
  vacant:      "Vacant",
  reserved:    "Reserved",
  under_works: "Under Works",
}

interface UnitStepReviewData {
  unit_name: string
  unit_type: string
  floor: number
  bedrooms: number
  bathrooms: number
  floor_area_sqm: number
  target_rent: number
  status: string
}

interface UnitStepReviewProps {
  data: UnitStepReviewData
  propertyName: string
}

export function UnitStepReview({ data, propertyName }: UnitStepReviewProps) {
  const rows = [
    { label: "Property",    value: propertyName || "—" },
    { label: "Unit name",   value: data.unit_name || "—" },
    { label: "Type",        value: UNIT_TYPE_LABELS[data.unit_type] ?? "—" },
    { label: "Floor",       value: String(data.floor) },
    { label: "Bedrooms",    value: String(data.bedrooms) },
    { label: "Bathrooms",   value: String(data.bathrooms) },
    { label: "Floor area",  value: data.floor_area_sqm ? `${data.floor_area_sqm} m²` : "—" },
    { label: "Target rent", value: data.target_rent ? `£${data.target_rent.toLocaleString()}/mo` : "—" },
    { label: "Status",      value: STATUS_LABELS[data.status] ?? "Vacant" },
  ]

  return (
    <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={cn("flex items-center justify-between px-4 py-3 text-sm", i % 2 === 0 ? "bg-white" : "bg-slate-50")}
        >
          <span className="text-slate-500">{row.label}</span>
          <span className="font-medium text-slate-900">{row.value}</span>
        </div>
      ))}
    </div>
  )
}
