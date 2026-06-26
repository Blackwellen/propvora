import { Download, CreditCard } from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getTenantPayments, getTenantTenancies } from "@/lib/portal/data"
import { createAdminClient } from "@/lib/supabase/admin"
import { PortalPageHeader, PortalButtonLink } from "@/components/portals/portal-ui"
import PortalPaymentsClient, { type LedgerRow } from "@/components/portals/PortalPaymentsClient"
import type { BankDetails } from "@/components/portals/TenantPaymentModal"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function computeNextDue(startDate: string | null | undefined): string | null {
  if (!startDate) return null
  const start = new Date(startDate); if (Number.isNaN(start.getTime())) return null
  const day = start.getDate(); const now = new Date()
  let due = new Date(now.getFullYear(), now.getMonth(), day)
  if (due.getTime() < now.setHours(0, 0, 0, 0)) due = new Date(now.getFullYear(), now.getMonth() + 1, day)
  return due.toISOString()
}

async function getWorkspaceBankDetails(workspaceId: string, tenancyRef?: string | null): Promise<BankDetails | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("client_accounts")
      .select("bank_account_name, bank_sort_code, bank_account_number")
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (!data) return null
    const row = data as { bank_account_name: string | null; bank_sort_code: string | null; bank_account_number: string | null }
    return {
      accountName: row.bank_account_name,
      sortCode: row.bank_sort_code ? row.bank_sort_code.replace(/(\d{2})(\d{2})(\d{2})/, "$1-$2-$3") : null,
      accountNumber: row.bank_account_number,
      reference: tenancyRef ?? null,
    }
  } catch {
    return null
  }
}

export default async function TenantPaymentsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`
  const [payments, tenancies] = await Promise.all([getTenantPayments(session), getTenantTenancies(session)])
  const current = tenancies.find((t) => t.status === "active") ?? tenancies[0] ?? null
  const bankDetails = await getWorkspaceBankDetails(session.workspaceId, current?.reference ?? null)

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Payments" subtitle="Your rent ledger, receipts and payment history." backHref={base}
        actions={<PortalButtonLink href={`${base}/documents`} icon={Download}>Download statement</PortalButtonLink>}
      />
      <PortalPaymentsClient
        rows={payments as LedgerRow[]}
        base={base}
        rentPcm={current?.rent_amount ?? null}
        depositHeld={current?.deposit_amount ?? null}
        nextDue={computeNextDue(current?.start_date)}
        sessionId={session.id}
        bankDetails={bankDetails}
      />
    </div>
  )
}
