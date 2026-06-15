import { Wrench, CheckCircle2 } from "lucide-react"

interface KanbanCard {
  title: string
  address: string
  priority?: "High" | "Med" | "Low"
  supplier?: string
  done?: boolean
}

interface KanbanColumn {
  name: string
  count: number
  color: string
  dotColor: string
  cards: KanbanCard[]
}

const columns: KanbanColumn[] = [
  {
    name: "Open",
    count: 3,
    color: "border-t-rose-500",
    dotColor: "bg-rose-400",
    cards: [
      { title: "Gas boiler repair", address: "14 Oak Street", priority: "High", supplier: "GasSafe Pro" },
      { title: "Routine inspection", address: "Unit 5A, Riverview", priority: "Med", supplier: "Self" },
      { title: "Damp investigation", address: "3 Park Road", priority: "Med", supplier: "DampStop Ltd" },
    ],
  },
  {
    name: "In Progress",
    count: 2,
    color: "border-t-blue-500",
    dotColor: "bg-blue-400",
    cards: [
      { title: "Roof repair", address: "8 Maple Street", priority: "High", supplier: "RoofPro Ltd" },
      { title: "Electrical fault", address: "Unit 12B", priority: "High", supplier: "SparkElec" },
    ],
  },
  {
    name: "Completed",
    count: 2,
    color: "border-t-emerald-500",
    dotColor: "bg-emerald-400",
    cards: [
      { title: "Boiler service", address: "22 Cedar Ave", done: true },
      { title: "Void clean & check", address: "Flat 4B", done: true },
    ],
  },
]

const bullets = [
  "Task board with Kanban and list views",
  "Job pipeline with supplier assignment",
  "Status tracking from open to closed",
  "Invoice and cost linking",
  "Photo evidence capture and storage",
  "Recurring maintenance scheduling",
]

function PriorityBadge({ priority }: { priority: "High" | "Med" | "Low" }) {
  const styles = {
    High: "bg-red-100 text-red-700",
    Med: "bg-amber-100 text-amber-700",
    Low: "bg-slate-100 text-slate-600",
  }
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${styles[priority]}`}>
      {priority}
    </span>
  )
}

export default function WorkManagementSection() {
  return (
    <section id="work-management" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: copy */}
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-rose-200">
              <Wrench className="h-3.5 w-3.5" />
              Work Hub
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Every job tracked,{" "}
              <span className="text-rose-600">open to closed</span>
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Stop losing maintenance jobs between WhatsApp threads and email chains. The Work Hub is
              your operational engine room — every task, contractor, and invoice in one place.
            </p>

            <ul className="space-y-3 mb-8">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>

            {/* Stats */}
            <div className="flex gap-8 pt-6 border-t border-slate-100">
              <div>
                <div className="text-4xl font-bold text-rose-500">3</div>
                <div className="text-sm text-slate-500 mt-0.5">board views</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900">Full</div>
                <div className="text-sm text-slate-500 mt-0.5">audit trail</div>
              </div>
            </div>
          </div>

          {/* Right: Kanban mockup — tighter gap on mobile keeps 3 columns within the viewport */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {columns.map((col) => (
              <div key={col.name} className={`bg-slate-50 border border-slate-200 rounded-xl border-t-4 ${col.color} overflow-hidden`}>
                {/* Column header */}
                <div className="px-3 py-2.5 flex items-center gap-2 border-b border-slate-200 bg-white">
                  <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className="text-xs font-semibold text-slate-700">{col.name}</span>
                  <span className="ml-auto bg-slate-100 text-slate-500 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {col.count}
                  </span>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2">
                  {col.cards.map((card) => (
                    <div
                      key={card.title}
                      className={`bg-white border border-slate-200 rounded-lg p-2.5 ${card.done ? "opacity-50" : ""}`}
                    >
                      <div className="text-[11px] font-semibold text-slate-800 leading-tight mb-1">
                        {card.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mb-1.5">{card.address}</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {card.priority && <PriorityBadge priority={card.priority} />}
                        {card.done && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        )}
                        {card.supplier && (
                          <span className="text-[10px] text-slate-400 truncate">{card.supplier}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
