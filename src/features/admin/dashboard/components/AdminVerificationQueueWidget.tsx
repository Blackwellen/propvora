import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { AdminQueuePanel } from "@/components/admin/ui"

interface PendingVerif {
  workspaceId: string
  businessName: string | null
  workspaceName: string | null
  submittedAt: string | null
}

function shortDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"
}

interface Props {
  items: PendingVerif[]
}

export function AdminVerificationQueueWidget({ items }: Props) {
  return (
    <AdminQueuePanel title="Verification queue" icon={ShieldCheck} count={items.length} viewAllHref="/admin/supplier-verification">
      {items.length === 0 ? (
        <div className="text-center py-6">
          <ShieldCheck className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-[12px] text-slate-400">No pending verifications.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((v) => (
            <li key={v.workspaceId} className="flex items-center gap-3 py-1.5">
              <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-[#0B1B3F] truncate">{v.businessName ?? v.workspaceName ?? v.workspaceId.slice(0, 8)}</p>
                <p className="text-[11px] text-slate-400">{shortDate(v.submittedAt)}</p>
              </div>
              <Link href={`/admin/supplier-verification?workspace=${v.workspaceId}`} className="text-[12px] font-semibold text-[var(--brand)] hover:underline shrink-0">Review</Link>
            </li>
          ))}
        </ul>
      )}
    </AdminQueuePanel>
  )
}
