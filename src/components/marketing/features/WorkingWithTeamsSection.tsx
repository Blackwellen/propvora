import { Users, CheckCircle2, XCircle } from "lucide-react"

interface Permission {
  label: string
  admin: boolean
  manager: boolean
  viewer: boolean
}

const permissions: Permission[] = [
  { label: "Full portfolio access", admin: true, manager: false, viewer: false },
  { label: "Work Hub & job management", admin: true, manager: true, viewer: false },
  { label: "Contacts & CRM", admin: true, manager: true, viewer: false },
  { label: "Accounting & invoices", admin: true, manager: false, viewer: false },
  { label: "Calendar & scheduling", admin: true, manager: true, viewer: false },
  { label: "View assigned properties", admin: true, manager: true, viewer: true },
  { label: "Compliance tracker (read)", admin: true, manager: true, viewer: true },
  { label: "Team & workspace settings", admin: true, manager: false, viewer: false },
]

const teamMembers = [
  { initials: "JT", name: "J. Thomas", role: "Admin", color: "bg-blue-600" },
  { initials: "SR", name: "S. Rahman", role: "Manager", color: "bg-violet-600" },
  { initials: "LK", name: "L. Kim", role: "Manager", color: "bg-teal-600" },
  { initials: "AP", name: "A. Patel", role: "View Only", color: "bg-slate-500" },
  { initials: "OB", name: "O. Barnes", role: "View Only", color: "bg-slate-500" },
]

export default function WorkingWithTeamsSection() {
  return (
    <section id="teams" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centred header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-orange-200">
            <Users className="h-3.5 w-3.5" />
            Team & Permissions
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Built for teams.{" "}
            <span className="text-orange-600">Not just one operator.</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Invite your team, assign granular roles, and keep sensitive data locked down. Every
            action is logged — who did what, and when.
          </p>
        </div>

        {/* Permission matrix */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden mb-8">
          {/* Column headers */}
          <div className="grid grid-cols-4 bg-slate-900 px-6 py-4">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Permission</div>
            <div className="text-center">
              <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Administrator</span>
            </div>
            <div className="text-center">
              <span className="inline-block bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">Manager</span>
            </div>
            <div className="text-center">
              <span className="inline-block bg-slate-600 text-white text-xs font-bold px-3 py-1 rounded-full">View Only</span>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {permissions.map((p) => (
              <div key={p.label} className="grid grid-cols-4 px-6 py-3.5 items-center hover:bg-slate-50 transition-colors">
                <span className="text-sm text-slate-700">{p.label}</span>
                <div className="flex justify-center">
                  {p.admin ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4.5 w-4.5 text-slate-300" />
                  )}
                </div>
                <div className="flex justify-center">
                  {p.manager ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4.5 w-4.5 text-slate-300" />
                  )}
                </div>
                <div className="flex justify-center">
                  {p.viewer ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4.5 w-4.5 text-slate-300" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team workspace visual */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Workspace Members
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {teamMembers.map((m) => (
                  <div key={m.initials} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-3 py-1">
                    <div
                      className={`w-7 h-7 rounded-full ${m.color} flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {m.initials}
                    </div>
                    <span className="text-xs text-slate-700 font-medium">{m.name}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        m.role === "Admin"
                          ? "bg-blue-100 text-blue-700"
                          : m.role === "Manager"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:ml-auto flex gap-6 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="text-2xl font-bold text-slate-800">Full</div>
                <div className="text-xs text-slate-500 mt-0.5">Audit log</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="text-2xl font-bold text-slate-800">ISO</div>
                <div className="text-xs text-slate-500 mt-0.5">Workspace isolation</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="text-2xl font-bold text-slate-800">Live</div>
                <div className="text-xs text-slate-500 mt-0.5">Activity feed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
