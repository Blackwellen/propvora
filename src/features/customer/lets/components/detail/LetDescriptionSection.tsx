import type { LetProperty } from "../../../data/lets"

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-[14px] font-bold text-slate-900 mb-3">{title}</p>
      {children}
    </div>
  )
}

export default function LetDescriptionSection({ p }: { p: LetProperty }) {
  return (
    <Card title="About this property">
      <p className="text-[12.5px] text-slate-600 leading-relaxed">
        A stunning {p.beds}-bedroom apartment in the heart of {p.location.split(",")[0]}, offering bright open-plan
        living, floor-to-ceiling windows and premium finishes throughout. Moments from transport links, shops and
        restaurants. Managed by a verified, professional landlord with secure online rent payments.
      </p>
    </Card>
  )
}
