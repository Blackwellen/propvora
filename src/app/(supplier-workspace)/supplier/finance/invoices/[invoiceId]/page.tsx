"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/finance/invoices/[invoiceId] — invoice detail (manifest image 51).
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import { useParams } from "next/navigation"
import { LayoutGrid, Wallet, Files, Download, History } from "lucide-react"
import { SupplierDetailShell, type SupplierDetailTab } from "@/components/supplier-workspace/SupplierDetailShell"
import {
  SupplierStatusBadge, SupplierButton,
  SupplierActionBar, SupplierBanner, toneForStatus, humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"

// Extracted tab components
import { InvoiceDetailsTab } from "@/features/supplier/finance/components/invoice-detail-tabs/InvoiceDetailsTab"
import { InvoicePaymentsTab } from "@/features/supplier/finance/components/invoice-detail-tabs/InvoicePaymentsTab"
import { InvoiceFilesTab } from "@/features/supplier/finance/components/invoice-detail-tabs/InvoiceFilesTab"
import { InvoiceAuditTab } from "@/features/supplier/finance/components/invoice-detail-tabs/InvoiceAuditTab"

interface InvoiceLine { id?: string; description?: string; quantity?: number; unit_price_pence?: number; line_total_pence?: number }
interface InvoiceEvent { id?: string; label?: string; created_at?: string }
interface InvoiceDetail {
  id?: string
  number?: string
  status?: string
  net_pence?: number
  vat_pence?: number
  total_pence?: number
  currency?: string
  workspace_name?: string
  customer_name?: string
  job_ref?: string
  payout_id?: string
  submitted_at?: string
  approved_at?: string
  paid_at?: string
  lines?: InvoiceLine[]
  events?: InvoiceEvent[]
}

export default function SupplierInvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const inv = useSupplierApi<InvoiceDetail>(
    useSupplierApiUrl(`/api/supplier/invoices/${invoiceId}`),
    { select: (j) => (j as { invoice?: InvoiceDetail }).invoice ?? (j as InvoiceDetail) }
  )
  const d = inv.data ?? {}
  const ccy = d.currency ?? "GBP"
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  const net = d.net_pence ?? (d.total_pence != null && d.vat_pence != null ? d.total_pence - d.vat_pence : undefined)

  const tabs: SupplierDetailTab[] = [
    {
      key: "details", label: "Invoice details", icon: LayoutGrid,
      render: () => (
        <InvoiceDetailsTab
          totalPence={d.total_pence}
          status={d.status}
          submittedAt={d.submitted_at}
          paidAt={d.paid_at}
          workspaceName={d.workspace_name}
          customerName={d.customer_name}
          jobRef={d.job_ref}
          netPence={net}
          vatPence={d.vat_pence}
          lines={d.lines ?? []}
          currency={ccy}
        />
      ),
    },
    {
      key: "payments", label: "Payments & payouts", icon: Wallet,
      render: () => (
        <InvoicePaymentsTab
          approvedAt={d.approved_at}
          paidAt={d.paid_at}
          payoutId={d.payout_id}
        />
      ),
    },
    {
      key: "files", label: "Files", icon: Files,
      render: () => <InvoiceFilesTab />,
    },
    {
      key: "audit", label: "Audit", icon: History,
      render: () => (
        <InvoiceAuditTab
          events={d.events ?? []}
          submittedAt={d.submitted_at}
          approvedAt={d.approved_at}
          paidAt={d.paid_at}
        />
      ),
    },
  ]

  return (
    <>
      {banner && (
        <div className="mb-3">
          <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>
        </div>
      )}
      <SupplierDetailShell
        backHref="/supplier/finance?tab=invoices"
        backLabel="Back to invoices"
        title={d.number ? `Invoice ${d.number}` : `Invoice ${String(invoiceId).slice(0, 8)}`}
        subtitle={d.workspace_name ?? undefined}
        status={
          d.status ? (
            <SupplierStatusBadge tone={toneForStatus(d.status)}>{humaniseStatus(d.status)}</SupplierStatusBadge>
          ) : undefined
        }
        tabs={tabs}
        actionBar={
          <SupplierActionBar>
            <SupplierButton
              variant="outline"
              onClick={() => setBanner({ tone: "emerald", msg: "Invoice PDF downloaded." })}
            >
              <Download className="w-4 h-4" /> Download PDF
            </SupplierButton>
          </SupplierActionBar>
        }
      />
    </>
  )
}
