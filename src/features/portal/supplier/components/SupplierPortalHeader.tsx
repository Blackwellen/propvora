import Link from "next/link"
import { Briefcase, FileText, Upload, MessageSquare } from "lucide-react"

interface SupplierPortalHeaderProps {
  base: string
  workspaceName: string
  displayName: string
}

const NAV_LINKS = [
  { label: "Jobs", segment: "jobs", icon: Briefcase },
  { label: "Invoices", segment: "invoices", icon: FileText },
  { label: "Documents", segment: "documents", icon: Upload },
  { label: "Messages", segment: "messages", icon: MessageSquare },
] as const

export function SupplierPortalHeader({
  base,
  workspaceName,
  displayName,
}: SupplierPortalHeaderProps) {
  return (
    <header className="border-b border-[#EEF3FB] bg-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-[#071B4D]">{workspaceName}</span>
          <span className="text-xs text-slate-400">Supplier portal</span>
        </div>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ label, segment, icon: Icon }) => (
            <Link
              key={segment}
              href={`${base}/${segment}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-[#F4F8FF] hover:text-[var(--brand)] transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">
            {displayName
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{displayName}</span>
        </div>
      </div>
    </header>
  )
}
