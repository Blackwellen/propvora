import {
  Wrench,
  Zap,
  Flame,
  Home,
  PaintRoller,
  Sparkles,
  KeyRound,
  Bug,
  Hammer,
  Trees,
  Trash2,
  Snowflake,
  Droplets,
  Bath,
  DoorOpen,
  Layers,
  ShieldCheck,
  Boxes,
  Camera,
  Truck,
} from "lucide-react"

const CATEGORIES = [
  { icon: Wrench, label: "Plumbing & Heating" },
  { icon: Zap, label: "Electrical" },
  { icon: Flame, label: "Gas Safe" },
  { icon: Home, label: "Roofing & Guttering" },
  { icon: PaintRoller, label: "Painting & Decorating" },
  { icon: Sparkles, label: "Cleaning" },
  { icon: KeyRound, label: "Locksmith" },
  { icon: Bug, label: "Pest Control" },
  { icon: Hammer, label: "General Building" },
  { icon: Trees, label: "Gardening & Grounds" },
  { icon: Trash2, label: "Waste & Clearance" },
  { icon: Snowflake, label: "Heating & AC" },
  { icon: Droplets, label: "Drainage" },
  { icon: Bath, label: "Bathrooms & Kitchens" },
  { icon: DoorOpen, label: "Windows & Doors" },
  { icon: Layers, label: "Flooring" },
  { icon: ShieldCheck, label: "Fire & Security" },
  { icon: Boxes, label: "Appliance Repair" },
  { icon: Camera, label: "EPC & Inspections" },
  { icon: Truck, label: "Removals & Logistics" },
]

export default function SupplierCategories() {
  return (
    <section className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <h2 className="text-[32px] sm:text-[40px] font-bold text-[#06122F] leading-tight mb-3">
            Top service categories
          </h2>
          <p className="text-[16px] text-slate-500 leading-relaxed">
            Whatever your trade, there&apos;s demand for it across property portfolios.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((c) => {
            const Icon = c.icon
            return (
              <div
                key={c.label}
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3.5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700 leading-snug">
                  {c.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
