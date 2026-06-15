import Image from "next/image"
import { ShieldCheck, Clock } from "lucide-react"
import type { ShareGrant } from "@/lib/portal/share"

const CAP_LABELS: Record<string, string> = {
  view: "View",
  download: "Download",
  upload: "Upload",
  sign: "Sign",
  comment: "Comment",
}

function expiryLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (!Number.isFinite(ms) || ms <= 0) return "expired"
  const days = Math.floor(ms / 86400_000)
  if (days >= 1) return `in ${days} day${days === 1 ? "" : "s"}`
  const hours = Math.max(1, Math.floor(ms / 3_600_000))
  return `in ${hours} hour${hours === 1 ? "" : "s"}`
}

// Mobile-first, premium chrome for the recipient share surface. No app nav, no
// workspace switcher — just the brand, the grant context, and the resource.
export function ShareShell({
  grant,
  children,
}: {
  grant: ShareGrant
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6FAFF]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="relative h-5 w-[110px]">
            <Image src="/propvora-logo-dark.png" alt="Propvora" fill className="object-contain object-left" priority />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure link
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-6 space-y-5">
          {/* Grant context card */}
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Shared with {grant.recipientLabel || "you"} by {grant.workspaceName}
            </p>
            <h1 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
              {grant.title || defaultTitle(grant.resourceType)}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {grant.capabilities.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-[11px] font-semibold"
                >
                  {CAP_LABELS[c] ?? c}
                </span>
              ))}
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-500 px-2.5 py-0.5 text-[11px] font-medium">
                <Clock className="w-3 h-3" />
                Expires {expiryLabel(grant.expiresAt)}
              </span>
            </div>
          </section>

          {children}
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-xs text-slate-400">
          This is a private, access-controlled link. Do not forward it.
        </p>
        <p className="text-[11px] text-slate-400 mt-1">Secured by Propvora</p>
      </footer>
    </div>
  )
}

function defaultTitle(t: string): string {
  switch (t) {
    case "invoice":
      return "Invoice"
    case "job":
    case "work_order":
      return "Job details"
    case "document":
    case "documents":
      return "Shared documents"
    default:
      return "Shared with you"
  }
}
