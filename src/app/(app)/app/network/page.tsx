import { getNetworkAccess, loadPartnerNetwork } from "@/components/network/server"
import { PartnerNetworkClient } from "@/components/network/PartnerNetworkClient"

/* ──────────────────────────────────────────────────────────────────────────
   PARTNER NETWORK — overview (server component).

   Cross-cutting view: resolves the active workspace server-side, recomputes the
   cached partner graph (best-effort, tolerant of cold modules), then lists the
   workspace's OWN partners grouped by type. RLS + explicit scoping guarantee a
   workspace only ever sees relationships it owns — no cross-workspace leakage.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function NetworkPage() {
  const access = await getNetworkAccess()
  const data =
    access.canView && access.workspaceId
      ? await loadPartnerNetwork(access.workspaceId)
      : { ready: true, groups: [], summary: emptySummary() }

  return <PartnerNetworkClient canView={access.canView} data={data} />
}

function emptySummary() {
  return {
    totalPartners: 0,
    suppliers: 0,
    operators: 0,
    customers: 0,
    marketplaceCounterparties: 0,
    activeCount: 0,
    pendingCount: 0,
    totalInteractions: 0,
  }
}
