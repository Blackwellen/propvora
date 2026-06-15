import { headers } from "next/headers"
import { isExternalPortalEnabled } from "@/lib/portal/flags"
import {
  resolveShareToken,
  markShareViewed,
  type ShareGrant,
} from "@/lib/portal/share"
import {
  recordShareAudit,
  SHARE_AUDIT_ACTIONS,
} from "@/lib/portal/share-audit"
import {
  loadShareDocuments,
  loadShareInvoice,
  loadShareJob,
  loadShareUploads,
} from "@/lib/portal/share-data"
import { ShareNotice } from "./_components/ShareNotice"
import { ShareShell } from "./_components/ShareShell"
import { DocumentsView } from "./_components/DocumentsView"
import { InvoiceView } from "./_components/InvoiceView"
import { JobView } from "./_components/JobView"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// /p/[token] — the public recipient share portal. The token in the URL IS the
// credential: it is hashed, looked up, and the resulting grant scopes EVERY
// read. No Supabase auth, no session exchange. Fail closed to an honest notice.
export default async function ShareTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  if (!isExternalPortalEnabled()) {
    return (
      <ShareNotice
        icon="lock"
        tone="neutral"
        title="Secure share links are not available"
        message="This Propvora environment has not enabled external share links. Please contact the person who sent you this link."
      />
    )
  }

  const { token } = await params
  const h = await headers()
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null

  const outcome = await resolveShareToken(token)

  if (!outcome.ok) {
    // Audit the denied access (no token material), then show a generic notice.
    await recordShareAudit({
      workspaceId: null,
      action: SHARE_AUDIT_ACTIONS.DENIED,
      shareLinkId: null,
      metadata: { reason: outcome.reason },
      ip,
    })
    if (outcome.reason === "revoked") {
      return (
        <ShareNotice
          icon="ban"
          tone="danger"
          title="This link has been revoked"
          message="Access to this share was withdrawn by the sender. If you still need it, please ask them to send you a fresh link."
        />
      )
    }
    if (outcome.reason === "expired") {
      return (
        <ShareNotice
          icon="alert"
          tone="warning"
          title="This link has expired"
          message="Secure share links expire for your protection. Please ask the sender for a new link."
        />
      )
    }
    return (
      <ShareNotice
        icon="key"
        tone="neutral"
        title="This link isn't valid"
        message="The link may be incomplete or no longer exist. Please check you copied the full link, or ask the sender to resend it."
      />
    )
  }

  const grant = outcome.grant

  // Audit the successful access + bump view counters (best-effort).
  await Promise.all([
    recordShareAudit({
      workspaceId: grant.workspaceId,
      action: SHARE_AUDIT_ACTIONS.ACCESSED,
      shareLinkId: grant.id,
      resourceType: grant.resourceType,
      resourceId: grant.resourceIds[0] ?? grant.id,
      metadata: { capabilities: grant.capabilities },
      ip,
    }),
    markShareViewed(grant.id),
  ])

  return (
    <ShareShell grant={grant}>
      <ResourceBody grant={grant} ip={ip} />
    </ShareShell>
  )
}

async function ResourceBody({ grant, ip }: { grant: ShareGrant; ip: string | null }) {
  // Record which resource the recipient viewed.
  await recordShareAudit({
    workspaceId: grant.workspaceId,
    action: SHARE_AUDIT_ACTIONS.VIEWED,
    shareLinkId: grant.id,
    resourceType: grant.resourceType,
    resourceId: grant.resourceIds[0] ?? grant.id,
    ip,
  })

  if (grant.resourceType === "invoice") {
    const invoice = await loadShareInvoice(grant)
    return <InvoiceView grant={grant} invoice={invoice} />
  }

  if (grant.resourceType === "job" || grant.resourceType === "work_order") {
    const job = await loadShareJob(grant)
    return <JobView grant={grant} job={job} />
  }

  // document / documents (and any other) render the documents + upload view.
  const [documents, uploads] = await Promise.all([
    loadShareDocuments(grant),
    loadShareUploads(grant),
  ])
  return <DocumentsView grant={grant} documents={documents} uploads={uploads} />
}
