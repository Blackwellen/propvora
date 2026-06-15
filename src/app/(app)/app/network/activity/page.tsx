import { getNetworkAccess, loadActivityFeed } from "@/components/network/server"
import { ActivityFeedClient } from "@/components/network/ActivityFeedClient"

/* ──────────────────────────────────────────────────────────────────────────
   UNIFIED CROSS-MODULE ACTIVITY (server component).

   Merges REAL recorded events the workspace is a party to from marketplace,
   bookings, supplier quotes/jobs, payouts, disputes, identity/KYC and risk into
   a single time-ordered feed. Strictly own-workspace scoped (explicit filters +
   RLS). Each module is queried tolerantly — a cold module contributes nothing.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function NetworkActivityPage() {
  const access = await getNetworkAccess()
  const data =
    access.canView && access.workspaceId
      ? await loadActivityFeed(access.workspaceId)
      : { ready: true, items: [], availableModules: [] }

  return <ActivityFeedClient canView={access.canView} data={data} />
}
