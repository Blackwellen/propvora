const SPECS = [
  ["Council tax band", "C"],
  ["EPC rating", "B"],
  ["Floor area", "78 m²"],
  ["Deposit", "5 weeks' rent"],
  ["Min. tenancy", "12 months"],
  ["Bills included", "No"],
]

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-[14px] font-bold text-slate-900 mb-3">{title}</p>
      {children}
    </div>
  )
}

export default function LetDetailsSection() {
  return (
    <Card title="Property details">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SPECS.map(([l, r]) => (
          <div key={l}>
            <p className="text-[10.5px] text-slate-400">{l}</p>
            <p className="text-[12.5px] font-semibold text-slate-800">{r}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
