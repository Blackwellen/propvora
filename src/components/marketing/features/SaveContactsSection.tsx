import { Users, CheckCircle2, Building2, Phone, Mail, Clock, Tag, Bell } from "lucide-react"

const contactTypes = [
  { label: "Landlord", emoji: "🏠", count: 24, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Tenant", emoji: "👤", count: 61, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { label: "Supplier", emoji: "🔧", count: 38, color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "Agent", emoji: "🏢", count: 15, color: "bg-violet-100 text-violet-700 border-violet-200" },
  { label: "Professional", emoji: "⚖️", count: 9, color: "bg-pink-100 text-pink-700 border-pink-200" },
]

const timeline = [
  { icon: Phone, label: "Call logged — renewal discussion", date: "3 Jun", color: "text-blue-500" },
  { icon: Mail, label: "Email sent — tenancy terms draft", date: "1 Jun", color: "text-emerald-500" },
  { icon: Building2, label: "Linked to 14 Oak Street", date: "18 May", color: "text-violet-500" },
]

const bullets = [
  "CRM built specifically for property operators",
  "Property and deal linkage per contact",
  "Interaction timeline and activity log",
  "Document attachment per contact",
  "Follow-up reminders and tasks",
  "Import and export contacts (CSV)",
]

export default function SaveContactsSection() {
  return (
    <section id="contacts" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centred header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-orange-200">
            <Users className="h-3.5 w-3.5" />
            Contacts Hub
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Your property relationships,{" "}
            <span className="text-orange-600">properly organised</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Property operations run on relationships. The Contacts Hub is a CRM built for operators —
            with the contact types, fields, and workflows that actually matter.
          </p>
        </div>

        {/* Contact type pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-14">
          {contactTypes.map((ct) => (
            <div
              key={ct.label}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border font-medium text-sm ${ct.color}`}
            >
              <span>{ct.emoji}</span>
              <span>{ct.label}</span>
              <span className="bg-white/60 px-1.5 py-0.5 rounded-full text-xs font-bold">{ct.count}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: contact card mockup */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                  MR
                </div>
                <div>
                  <div className="text-white text-lg font-bold">Mohammed Rashid</div>
                  <div className="text-white/80 text-sm">Landlord · Active</div>
                </div>
              </div>
            </div>

            {/* Contact details */}
            <div className="px-6 py-4 border-b border-slate-100 space-y-2">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>07712 345 678</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>m.rashid@email.com</span>
              </div>
            </div>

            {/* Linked properties */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Linked Properties
              </div>
              <div className="flex flex-wrap gap-2">
                {["14 Oak Street", "8 Park Lane", "Unit 5A"].map((p) => (
                  <span
                    key={p}
                    className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                  >
                    <Building2 className="h-3 w-3" />
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {["Portfolio landlord", "HMO friendly", "Long-term deal"].map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Activity timeline */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Recent Activity
              </div>
              <div className="space-y-2.5">
                {timeline.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className={`h-3 w-3 ${item.color}`} />
                      </div>
                      <span className="text-xs text-slate-600 flex-1">{item.label}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{item.date}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Follow-up */}
            <div className="px-6 py-4 bg-amber-50">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-amber-500" />
                <div>
                  <div className="text-xs font-semibold text-amber-800">Follow-up reminder</div>
                  <div className="text-xs text-amber-600 mt-0.5">Call re: renewal terms — 15 Jun 2026</div>
                </div>
                <span className="ml-auto bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  Due soon
                </span>
              </div>
            </div>
          </div>

          {/* Right: bullets + stats */}
          <div>
            <ul className="space-y-3 mb-8">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>

            {/* Portfolio stat */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
              {contactTypes.map((ct) => (
                <div
                  key={ct.label}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3"
                >
                  <span className="text-2xl">{ct.emoji}</span>
                  <div>
                    <div className="text-xl font-bold text-slate-800">{ct.count}</div>
                    <div className="text-xs text-slate-500">{ct.label}s</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
