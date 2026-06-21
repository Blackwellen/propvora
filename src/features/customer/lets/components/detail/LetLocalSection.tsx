import { GraduationCap, Train } from "lucide-react"

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-[14px] font-bold text-slate-900 mb-3">{title}</p>
      {children}
    </div>
  )
}

function Mini({
  icon: Icon,
  label,
  sub,
}: {
  icon: typeof Train
  label: string
  sub: string
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <p className="text-[12px] font-semibold text-slate-800">{label}</p>
        <p className="text-[10.5px] text-slate-400">{sub}</p>
      </div>
    </div>
  )
}

export default function LetLocalSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Card title="Transport links">
        <Mini icon={Train} label="New Bailey tram" sub="3 min walk" />
        <Mini icon={Train} label="Salford Central rail" sub="6 min walk" />
        <Mini icon={Train} label="Deansgate" sub="12 min walk" />
      </Card>
      <Card title="Nearby schools">
        <Mini icon={GraduationCap} label="St John's Primary" sub="Outstanding · 0.4 mi" />
        <Mini icon={GraduationCap} label="Manchester Academy" sub="Good · 0.9 mi" />
      </Card>
    </div>
  )
}
