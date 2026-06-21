import { Check } from "lucide-react"

const AMENITIES = [
  "Lift access",
  "Concierge",
  "Gym",
  "Parking",
  "Balcony",
  "Dishwasher",
  "Washer/dryer",
  "Pet friendly",
]

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-[14px] font-bold text-slate-900 mb-3">{title}</p>
      {children}
    </div>
  )
}

export default function LetAmenitiesSection() {
  return (
    <Card title="Amenities">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {AMENITIES.map((a) => (
          <p key={a} className="text-[12px] text-slate-600 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" /> {a}
          </p>
        ))}
      </div>
    </Card>
  )
}
