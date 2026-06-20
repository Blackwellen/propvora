interface RuleEntry {
  label: string
  value: string
}

interface StayHouseRulesProps {
  rules: RuleEntry[]
}

export default function StayHouseRules({ rules }: StayHouseRulesProps) {
  if (rules.length === 0) return null

  return (
    <section className="py-7 border-b border-slate-200">
      <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-4">House rules</h2>
      <ul className="space-y-3">
        {rules.map((r, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-3 text-[14px] border-b border-slate-100 pb-3 last:border-0 last:pb-0"
          >
            <span className="text-slate-500">{r.label}</span>
            <span className="font-semibold text-[#0B1B3F]">{r.value}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
