"use client"

interface StepContactsData {
  landlordContactId: string
  agentContactId: string
}

interface StepContactsProps {
  data: StepContactsData
  onChange: (d: Partial<StepContactsData>) => void
}

export function StepContacts({ data, onChange }: StepContactsProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-500">Link contacts to this property (optional at this stage).</p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Landlord / Owner</label>
        <input
          type="text"
          placeholder="Search contacts or enter name..."
          value={data.landlordContactId}
          onChange={(e) => onChange({ landlordContactId: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Managing Agent</label>
        <input
          type="text"
          placeholder="Search contacts or enter name..."
          value={data.agentContactId}
          onChange={(e) => onChange({ agentContactId: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
        />
      </div>
      <div className="p-3 rounded-xl bg-[var(--brand-soft)] border border-[var(--color-brand-100)] text-xs text-[var(--brand)]">
        You can add and manage contacts fully from the Contacts section.
      </div>
    </div>
  )
}
