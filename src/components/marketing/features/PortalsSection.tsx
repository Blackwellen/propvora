import { Store, Share2, CheckCircle2, Clock, Upload, FileText, BarChart2, Copy } from "lucide-react"

const supplierJobs = [
  { title: "Gas boiler repair", address: "14 Oak Street", status: "In Progress", statusColor: "bg-blue-100 text-blue-700" },
  { title: "Roof inspection", address: "8 Maple Street", status: "Awaiting Visit", statusColor: "bg-amber-100 text-amber-700" },
  { title: "Electrical fault fix", address: "Unit 12B", status: "Completed", statusColor: "bg-emerald-100 text-emerald-700" },
]

export default function PortalsSection() {
  return (
    <section id="portals" className="py-24 relative overflow-hidden" style={{ background: "#06122F" }}>
      {/* Dot overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 rounded-full px-4 py-1.5 text-sm font-medium border border-white/20">
            External Portals
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ---- Supplier Portal ---- */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
                      <Store className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="bg-teal-500/20 text-teal-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-teal-500/30">
                      Pro / Business
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Supplier Portal</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Your contractors, connected. Give them a focused job view without exposing your
                    portfolio data.
                  </p>
                </div>
              </div>
            </div>

            {/* Mock portal */}
            <div className="px-6 py-5 space-y-3">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
                My Active Jobs
              </div>
              {supplierJobs.map((job) => (
                <div
                  key={job.title}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{job.title}</div>
                    <div className="text-xs text-white/50 mt-0.5">{job.address}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${job.statusColor}`}>
                    {job.status}
                  </span>
                </div>
              ))}

              {/* Action row */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg py-2 text-xs text-white/70 transition-colors">
                  <Upload className="h-3 w-3" /> Upload invoice
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg py-2 text-xs text-white/70 transition-colors">
                  <FileText className="h-3 w-3" /> Update status
                </button>
              </div>
            </div>

            {/* Feature list */}
            <div className="px-6 pb-5 space-y-2">
              {[
                "Contractor-facing job dashboard",
                "Invoice & document upload",
                "No access to portfolio data",
                "Invite & permission management",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-white/60">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* ---- Affiliate Portal ---- */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
                      <Share2 className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-500/30">
                      Business
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Affiliate Portal</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Earn 20% recurring commission for 12 months on every subscription you refer.
                  </p>
                </div>
              </div>
            </div>

            {/* Mock affiliate dashboard */}
            <div className="px-6 py-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <BarChart2 className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">142</div>
                  <div className="text-[10px] text-white/50 mt-0.5">Clicks</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-[10px] text-white/50 mt-0.5">Conversions</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-300">£284</div>
                  <div className="text-[10px] text-white/50 mt-0.5">/ month</div>
                </div>
              </div>

              {/* Referral link */}
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-xs text-white/50 font-mono truncate">
                  propvora.com/ref/jthomas-k9xq
                </span>
                <button className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors shrink-0">
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              </div>

              {/* Progress to payout */}
              <div className="mt-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/60">Pending payout</span>
                  <span className="text-xs font-semibold text-amber-300">£284 / £50 threshold</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: "100%" }} />
                </div>
                <div className="text-[10px] text-white/40 mt-1.5">Next payout: 1 Jul 2026</div>
              </div>
            </div>

            {/* Feature list */}
            <div className="px-6 pb-5 space-y-2">
              {[
                "20% recurring commission for 12 months",
                "Monthly payouts (£50 minimum)",
                "Real-time conversion tracking",
                "Promotional materials provided",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-white/60">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
