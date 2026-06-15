import {
  Building2,
  Wrench,
  BarChart3,
  Users,
  Wallet,
  CalendarDays,
  Brain,
  Store,
  Share2,
  ShieldCheck,
  Zap,
} from "lucide-react"

const navLinks = [
  { id: "operating-profiles", label: "Planning Engine" },
  { id: "ai-copilot", label: "AI Copilot" },
  { id: "compliance", label: "Compliance" },
  { id: "accounting", label: "Accounting" },
  { id: "teams", label: "Teams" },
  { id: "portals", label: "Portals" },
  { id: "work-management", label: "Work Hub" },
  { id: "scheduling", label: "Scheduling" },
  { id: "contacts", label: "Contacts" },
  { id: "supplier-marketplace", label: "Marketplace" },
]

const featureBoxes = [
  { icon: BarChart3, label: "Planning Engine", color: "bg-violet-500" },
  { icon: Brain, label: "AI Copilot", color: "bg-indigo-500" },
  { icon: ShieldCheck, label: "Compliance", color: "bg-emerald-500" },
  { icon: Wallet, label: "Accounting", color: "bg-sky-500" },
  { icon: Users, label: "Teams", color: "bg-orange-500" },
  { icon: Store, label: "Supplier Portal", color: "bg-teal-500" },
  { icon: Share2, label: "Affiliate Portal", color: "bg-amber-500" },
  { icon: Wrench, label: "Work Hub", color: "bg-rose-500" },
  { icon: CalendarDays, label: "Scheduling", color: "bg-blue-500" },
  { icon: Building2, label: "Contacts CRM", color: "bg-pink-500" },
]

export default function FeaturesHero() {
  return (
    <section
      className="pt-32 pb-20 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #06122F 0%, #0d1f4e 60%, #1d4ed8 100%)" }}
    >
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-white/20">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              Full platform overview
            </div>

            <h1 className="text-[34px] sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1]">
              Everything you need to run a serious property operation
            </h1>

            <p className="text-xl text-white/70 max-w-xl mb-10 leading-relaxed">
              Nine powerful modules. One connected workspace. Built for operators who mean business.
            </p>

            {/* Pill navigation */}
            <div className="flex flex-wrap gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white/75 hover:text-white text-sm rounded-full border border-white/20 transition-all duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Right: 5×2 icon grid */}
          <div className="hidden lg:grid grid-cols-5 grid-rows-2 gap-3">
            {featureBoxes.map((box) => {
              const Icon = box.icon
              return (
                <div
                  key={box.label}
                  className={`${box.color} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 aspect-square shadow-lg`}
                >
                  <Icon className="h-7 w-7 text-white" />
                  <span className="text-white text-[10px] font-semibold text-center leading-tight">
                    {box.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
