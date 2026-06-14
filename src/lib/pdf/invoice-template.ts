/**
 * Enterprise-grade branded invoice / bill HTML template (rendered to PDF).
 * Pure string template — no external assets so it renders deterministically in
 * headless Chromium. Brand colours + wordmark are baked in.
 */

export interface InvoiceLine {
  description: string
  quantity?: number
  unitPrice?: number
  amount: number
}

export interface InvoicePdfData {
  docType?: "INVOICE" | "BILL" | "STATEMENT"
  number: string
  status?: string
  issueDate?: string | null
  dueDate?: string | null
  currency?: string
  from: { name: string; lines?: string[]; email?: string | null; phone?: string | null }
  billTo: { name: string; lines?: string[]; email?: string | null }
  reference?: string | null
  propertyLabel?: string | null
  items: InvoiceLine[]
  subtotal: number
  taxLabel?: string
  taxAmount?: number
  total: number
  paid?: number
  balance?: number
  notes?: string | null
  terms?: string | null
  brand?: { primary?: string; accent?: string; navy?: string; name?: string }
}

const DEFAULT_BRAND = {
  primary: "#2563EB",
  accent: "#0EA5E9",
  navy: "#071B4D",
  name: "Propvora",
}

function money(n: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)
}

function fmtDate(d?: string | null): string {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  )
}

const STATUS_COLOUR: Record<string, string> = {
  paid: "#059669", reconciled: "#059669",
  sent: "#2563EB", viewed: "#2563EB", due: "#D97706",
  overdue: "#DC2626", disputed: "#DC2626",
  part_paid: "#D97706", partially_paid: "#D97706",
  draft: "#64748B", scheduled: "#7C3AED", planned: "#7C3AED",
  cancelled: "#94A3B8",
}

export function renderInvoiceHtml(data: InvoicePdfData): string {
  const brand = { ...DEFAULT_BRAND, ...(data.brand ?? {}) }
  const cur = data.currency ?? "GBP"
  const docType = data.docType ?? "INVOICE"
  const statusKey = (data.status ?? "").toLowerCase()
  const statusColour = STATUS_COLOUR[statusKey] ?? "#64748B"
  const balance = data.balance ?? data.total - (data.paid ?? 0)
  const showTax = typeof data.taxAmount === "number" && data.taxAmount > 0

  const rows = data.items
    .map(
      (it, i) => `
      <tr style="border-bottom:1px solid #EEF2F7;">
        <td style="padding:13px 16px;color:#0F172A;font-size:12.5px;line-height:1.5;">
          <div style="font-weight:600;">${esc(it.description) || "Item"}</div>
        </td>
        <td style="padding:13px 12px;text-align:center;color:#475569;font-size:12.5px;">${
          it.quantity != null ? esc(it.quantity) : "1"
        }</td>
        <td style="padding:13px 12px;text-align:right;color:#475569;font-size:12.5px;">${
          it.unitPrice != null ? money(it.unitPrice, cur) : money(it.amount, cur)
        }</td>
        <td style="padding:13px 16px;text-align:right;color:#0F172A;font-size:12.5px;font-weight:700;">${money(
          it.amount,
          cur,
        )}</td>
      </tr>`,
    )
    .join("")

  const fromLines = (data.from.lines ?? []).filter(Boolean).map((l) => `<div>${esc(l)}</div>`).join("")
  const billLines = (data.billTo.lines ?? []).filter(Boolean).map((l) => `<div>${esc(l)}</div>`).join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:#0F172A; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body { width:210mm; min-height:297mm; position:relative; }
  .page { padding:0 0 120px; }
  .band {
    background: linear-gradient(120deg, ${brand.navy} 0%, #0B2A6B 48%, ${brand.primary} 100%);
    color:#fff; padding:38px 44px 34px; position:relative; overflow:hidden;
  }
  .band::after {
    content:""; position:absolute; right:-60px; top:-60px; width:240px; height:240px;
    background: radial-gradient(circle, rgba(14,165,233,0.45) 0%, transparent 65%);
  }
  .brandrow { display:flex; align-items:center; justify-content:space-between; position:relative; z-index:2; }
  .mark { display:flex; align-items:center; gap:12px; }
  .logo {
    width:42px; height:42px; border-radius:11px;
    background: linear-gradient(135deg, #fff 0%, #DCEBFF 100%);
    color:${brand.primary}; font-weight:800; font-size:23px; display:flex; align-items:center; justify-content:center;
    box-shadow: 0 6px 18px rgba(2,6,23,0.35);
  }
  .brandname { font-size:21px; font-weight:800; letter-spacing:-0.4px; }
  .brandsub { font-size:10.5px; color:rgba(255,255,255,0.72); margin-top:1px; letter-spacing:0.3px; }
  .doctype { text-align:right; }
  .doctype h1 { font-size:30px; font-weight:800; letter-spacing:3px; }
  .doctype .num { font-size:12.5px; color:rgba(255,255,255,0.82); margin-top:4px; font-weight:600; }
  .statuspill {
    display:inline-block; margin-top:10px; padding:5px 13px; border-radius:999px;
    background: rgba(255,255,255,0.16); color:#fff; font-size:11px; font-weight:700; letter-spacing:0.4px;
    text-transform:uppercase; border:1px solid rgba(255,255,255,0.28);
  }
  .body { padding:34px 44px 0; }
  .meta { display:flex; justify-content:space-between; gap:28px; margin-bottom:30px; }
  .party { flex:1; }
  .label { font-size:10px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:#94A3B8; margin-bottom:7px; }
  .party .name { font-size:14.5px; font-weight:700; color:#0F172A; margin-bottom:3px; }
  .party .lines { font-size:11.5px; color:#64748B; line-height:1.55; }
  .details { width:230px; flex-shrink:0; background:#F8FAFC; border:1px solid #EEF2F7; border-radius:14px; padding:16px 18px; }
  .drow { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; padding:6px 0; font-size:11.5px; }
  .drow + .drow { border-top:1px solid #EEF2F7; }
  .drow .k { color:#94A3B8; font-weight:600; white-space:nowrap; flex-shrink:0; }
  .drow .v { color:#0F172A; font-weight:700; text-align:right; line-height:1.4; }
  table.items { width:100%; border-collapse:collapse; margin-bottom:0; border:1px solid #EEF2F7; border-radius:14px; overflow:hidden; }
  table.items thead th {
    background:${brand.navy}; color:#fff; font-size:10px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase;
    padding:12px 16px; text-align:left;
  }
  table.items thead th.c { text-align:center; }
  table.items thead th.r { text-align:right; }
  table.items tbody tr:nth-child(even) { background:#FBFCFE; }
  .totals { display:flex; justify-content:flex-end; margin-top:22px; }
  .totalbox { width:290px; }
  .trow { display:flex; justify-content:space-between; padding:8px 16px; font-size:12.5px; }
  .trow .k { color:#64748B; }
  .trow .v { color:#0F172A; font-weight:600; }
  .grand {
    margin-top:8px; border-radius:12px; padding:14px 16px;
    background: linear-gradient(120deg, ${brand.primary} 0%, ${brand.accent} 100%); color:#fff;
    display:flex; justify-content:space-between; align-items:center;
  }
  .grand .k { font-size:11px; font-weight:700; letter-spacing:0.6px; text-transform:uppercase; opacity:0.92; }
  .grand .v { font-size:20px; font-weight:800; }
  .paidrow { display:flex; justify-content:space-between; padding:8px 16px; font-size:12.5px; }
  .paidrow .k { color:#64748B; }
  .paidrow .v { color:#059669; font-weight:700; }
  .balrow { display:flex; justify-content:space-between; padding:10px 16px; font-size:13.5px; border-top:2px solid #0F172A; margin-top:4px; }
  .balrow .k { color:#0F172A; font-weight:800; }
  .balrow .v { color:${balance > 0 ? "#DC2626" : "#059669"}; font-weight:800; }
  .notes { margin-top:30px; display:flex; gap:24px; }
  .notecard { flex:1; background:#F8FAFC; border:1px solid #EEF2F7; border-radius:12px; padding:15px 17px; }
  .notecard .label { margin-bottom:6px; }
  .notecard p { font-size:11.5px; color:#475569; line-height:1.6; }
  .footer {
    position:absolute; bottom:0; left:0; right:0; padding:18px 44px;
    border-top:1px solid #EEF2F7; display:flex; justify-content:space-between; align-items:center;
    font-size:10.5px; color:#94A3B8;
  }
  .footer strong { color:${brand.primary}; font-weight:700; }
</style>
</head>
<body>
  <div class="page">
    <div class="band">
      <div class="brandrow">
        <div class="mark">
          <div class="logo">P</div>
          <div>
            <div class="brandname">${esc(brand.name)}</div>
            <div class="brandsub">Property operations, automated</div>
          </div>
        </div>
        <div class="doctype">
          <h1>${esc(docType)}</h1>
          <div class="num">${esc(data.number)}</div>
          ${data.status ? `<div class="statuspill" style="background:${statusColour}33;border-color:${statusColour}66;">${esc(data.status.replace(/_/g, " "))}</div>` : ""}
        </div>
      </div>
    </div>

    <div class="body">
      <div class="meta">
        <div class="party">
          <div class="label">From</div>
          <div class="name">${esc(data.from.name)}</div>
          <div class="lines">${fromLines}${data.from.email ? `<div>${esc(data.from.email)}</div>` : ""}${data.from.phone ? `<div>${esc(data.from.phone)}</div>` : ""}</div>
        </div>
        <div class="party">
          <div class="label">Bill to</div>
          <div class="name">${esc(data.billTo.name)}</div>
          <div class="lines">${billLines}${data.billTo.email ? `<div>${esc(data.billTo.email)}</div>` : ""}</div>
        </div>
        <div class="details">
          <div class="drow"><span class="k">Issued</span><span class="v">${fmtDate(data.issueDate)}</span></div>
          <div class="drow"><span class="k">Due</span><span class="v">${fmtDate(data.dueDate)}</span></div>
          ${data.reference ? `<div class="drow"><span class="k">Reference</span><span class="v">${esc(data.reference)}</span></div>` : ""}
          ${data.propertyLabel ? `<div class="drow"><span class="k">Property</span><span class="v">${esc(data.propertyLabel)}</span></div>` : ""}
        </div>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th>Description</th>
            <th class="c">Qty</th>
            <th class="r">Unit price</th>
            <th class="r">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="totals">
        <div class="totalbox">
          <div class="trow"><span class="k">Subtotal</span><span class="v">${money(data.subtotal, cur)}</span></div>
          ${showTax ? `<div class="trow"><span class="k">${esc(data.taxLabel ?? "VAT")}</span><span class="v">${money(data.taxAmount!, cur)}</span></div>` : ""}
          <div class="grand"><span class="k">Total ${esc(cur)}</span><span class="v">${money(data.total, cur)}</span></div>
          ${typeof data.paid === "number" && data.paid > 0 ? `<div class="paidrow"><span class="k">Amount paid</span><span class="v">− ${money(data.paid, cur)}</span></div>` : ""}
          <div class="balrow"><span class="k">Balance due</span><span class="v">${money(balance, cur)}</span></div>
        </div>
      </div>

      ${
        data.notes || data.terms
          ? `<div class="notes">
              ${data.notes ? `<div class="notecard"><div class="label">Notes</div><p>${esc(data.notes)}</p></div>` : ""}
              ${data.terms ? `<div class="notecard"><div class="label">Payment terms</div><p>${esc(data.terms)}</p></div>` : ""}
            </div>`
          : ""
      }
    </div>

    <div class="footer">
      <div>${esc(data.from.name)} · ${esc(data.from.email ?? "")}</div>
      <div>Generated by <strong>${esc(brand.name)}</strong> · ${fmtDate(new Date().toISOString())}</div>
    </div>
  </div>
</body>
</html>`
}
