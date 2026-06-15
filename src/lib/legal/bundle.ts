// ============================================================
// Court bundle generator — assembles a chronological, paginated DRAFT bundle
// as a self-contained printable HTML document.
//
// REVIEW-ONLY: the output is watermarked DRAFT on every page and carries the
// legal disclaimer. It is a drafting aid to hand to a solicitor — it is NOT a
// filed bundle and the app never files it. No network, no DB — pure assembly
// from data the caller passes in.
// ============================================================

import type { PossessionCase, PossessionEvidence } from '@/app/(app)/app/legal/legal-data'
import type { ValiditySnapshot } from './validity'

export interface BundleInput {
  caseData: PossessionCase
  evidence: PossessionEvidence[]
  tenantName: string
  propertyName: string
  validity?: ValiditySnapshot | null
  preparedBy?: string
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function money(n: number | null | undefined): string {
  if (n == null) return '—'
  return `£${Number(n).toLocaleString('en-GB')}`
}

/** Build the chronological timeline rows from the case + evidence. */
function timelineRows(c: PossessionCase, evidence: PossessionEvidence[]) {
  const rows: { date: string | null; label: string }[] = [
    { date: c.created_at, label: 'Case opened (Propvora draft record)' },
    ...evidence.map((e) => ({ date: e.event_date, label: e.description })),
    { date: c.notice_served_date, label: 'Notice served (recorded by landlord)' },
    { date: c.notice_expiry_date, label: 'Notice expiry' },
    { date: c.court_applied_date, label: 'Court application (recorded by landlord)' },
    { date: c.hearing_date, label: 'Hearing date' },
  ].filter((r) => r.date)
  return rows.sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime())
}

/**
 * Produce the full bundle as an HTML string. Each major section is a print
 * page (CSS page-break). Pages are numbered and DRAFT-watermarked.
 */
export function buildCourtBundleHtml(input: BundleInput): string {
  const { caseData: c, evidence, tenantName, propertyName, validity, preparedBy } = input
  const generatedAt = new Date().toLocaleString('en-GB')
  const timeline = timelineRows(c, evidence)

  const evidenceIndex = evidence.length
    ? evidence
        .map(
          (e, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${esc(e.description)}</td>
          <td>${esc((e.evidence_type || 'other').replace(/_/g, ' '))}</td>
          <td>${esc(fmtDate(e.event_date))}</td>
          <td>${e.document_path ? 'Attached' : '—'}</td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="5" class="muted">No evidence recorded.</td></tr>`

  const timelineRowsHtml = timeline.length
    ? timeline
        .map(
          (r) => `
        <tr><td class="nowrap">${esc(fmtDate(r.date))}</td><td>${esc(r.label)}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="2" class="muted">No dated events recorded.</td></tr>`

  const validityRowsHtml =
    validity && validity.checks.length
      ? validity.checks
          .map(
            (chk) => `
        <tr>
          <td>${esc(chk.label)}</td>
          <td class="status-${chk.status}">${chk.status.toUpperCase()}</td>
          <td>${esc(chk.detail)}</td>
        </tr>`
          )
          .join('')
      : `<tr><td colspan="3" class="muted">No validity snapshot recorded for this draft.</td></tr>`

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<title>Draft Possession Bundle — ${esc(tenantName)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #0f172a; margin: 0; padding: 0; background: #f8fafc; }
  .page {
    background: #fff; width: 210mm; min-height: 297mm; margin: 12px auto; padding: 22mm 20mm;
    position: relative; box-shadow: 0 1px 4px rgba(15,23,42,.12);
  }
  .page::before {
    content: 'DRAFT — NOT FILED'; position: absolute; top: 46%; left: 50%;
    transform: translate(-50%, -50%) rotate(-32deg); font-size: 64px; font-weight: 800;
    color: rgba(220, 38, 38, .07); letter-spacing: 6px; pointer-events: none; white-space: nowrap;
  }
  .disclaimer {
    border: 1px solid #fbbf24; background: #fffbeb; color: #92400e; border-radius: 8px;
    padding: 12px 14px; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; margin-bottom: 18px;
  }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 0 0 12px; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
  .sub { font-family: Arial, sans-serif; color: #475569; font-size: 12px; margin: 0 0 18px; }
  table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; margin-bottom: 14px; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  th { background: #f1f5f9; font-weight: 700; }
  .kv td:first-child { width: 40%; color: #475569; font-weight: 600; }
  .muted { color: #94a3b8; font-style: italic; }
  .nowrap { white-space: nowrap; }
  .status-pass { color: #047857; font-weight: 700; }
  .status-warn { color: #b91c1c; font-weight: 700; }
  .status-unknown { color: #b45309; font-weight: 700; }
  .footer { position: absolute; bottom: 12mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between;
    font-family: Arial, sans-serif; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px; }
  @media print {
    body { background: #fff; }
    .page { box-shadow: none; margin: 0; page-break-after: always; }
    .no-print { display: none; }
  }
  .toolbar { text-align: center; padding: 12px; font-family: Arial, sans-serif; }
  .toolbar button { background: #2563EB; color: #fff; border: 0; border-radius: 8px; padding: 8px 18px; font-size: 13px; cursor: pointer; }
</style>
</head>
<body>
<div class="toolbar no-print"><button onclick="window.print()">Print / Save as PDF</button></div>

<!-- PAGE 1 — Cover + case details -->
<section class="page">
  <div class="disclaimer">
    <strong>Draft for review only — not legal advice.</strong> This bundle has been auto-assembled by Propvora from
    your records. It has not been filed with any court and its legal validity has not been verified. Verify every
    detail, ground and deadline with a qualified solicitor before serving or filing.
  </div>
  <h1>Draft Possession Bundle</h1>
  <p class="sub">Prepared for review${preparedBy ? ` by ${esc(preparedBy)}` : ''} · ${esc(generatedAt)}</p>
  <h2>1. Case Details</h2>
  <table class="kv">
    <tr><td>Respondent</td><td>${esc(tenantName)}</td></tr>
    <tr><td>Property</td><td>${esc(propertyName)}</td></tr>
    <tr><td>Notice route</td><td>${c.notice_type === 'section_21' ? 'Section 21 (no-fault)' : 'Section 8 (fault-based)'}</td></tr>
    <tr><td>Ground(s)</td><td>${esc(c.ground)}</td></tr>
    <tr><td>Rent arrears</td><td>${esc(money(c.arrears_amount))}${c.arrears_weeks != null ? ` (${esc(c.arrears_weeks)} weeks)` : ''}</td></tr>
    <tr><td>Status</td><td>${esc((c.status || '').replace(/_/g, ' '))}</td></tr>
    <tr><td>Notice served</td><td>${esc(fmtDate(c.notice_served_date))}</td></tr>
    <tr><td>Notice expiry</td><td>${esc(fmtDate(c.notice_expiry_date))}</td></tr>
    <tr><td>Court reference</td><td>${esc(c.court_reference || '—')}</td></tr>
    <tr><td>Hearing date</td><td>${esc(fmtDate(c.hearing_date))}</td></tr>
  </table>
  <div class="footer"><span>Draft possession bundle — Propvora</span><span>Page 1</span></div>
</section>

<!-- PAGE 2 — Validity checks -->
<section class="page">
  <h2>2. Pre-service Validity Checks (review snapshot)</h2>
  <p class="sub">A snapshot of prerequisite checks at the time this draft was prepared. A "PASS" is not a guarantee of
  validity — confirm with a solicitor.</p>
  <table>
    <thead><tr><th>Check</th><th>Status</th><th>Detail</th></tr></thead>
    <tbody>${validityRowsHtml}</tbody>
  </table>
  <div class="footer"><span>Draft possession bundle — Propvora</span><span>Page 2</span></div>
</section>

<!-- PAGE 3 — Chronology -->
<section class="page">
  <h2>3. Chronology</h2>
  <p class="sub">Events in date order, assembled from the case record and recorded evidence.</p>
  <table>
    <thead><tr><th style="width:30%">Date</th><th>Event</th></tr></thead>
    <tbody>${timelineRowsHtml}</tbody>
  </table>
  <div class="footer"><span>Draft possession bundle — Propvora</span><span>Page 3</span></div>
</section>

<!-- PAGE 4 — Evidence index -->
<section class="page">
  <h2>4. Evidence Index</h2>
  <p class="sub">${evidence.length} item${evidence.length === 1 ? '' : 's'} recorded against this case.</p>
  <table>
    <thead><tr><th style="width:6%">#</th><th>Description</th><th>Type</th><th>Date</th><th>Document</th></tr></thead>
    <tbody>${evidenceIndex}</tbody>
  </table>
  <div class="footer"><span>Draft possession bundle — Propvora</span><span>Page 4</span></div>
</section>

<!-- PAGE 5 — Notice draft + service log -->
<section class="page">
  <h2>5. Notice Draft &amp; Service Log</h2>
  <p class="sub">Review-only draft summary. Propvora never serves or files — the service log below records what the
  landlord did offline.</p>
  <table class="kv">
    <tr><td>Notice route</td><td>${c.notice_type === 'section_21' ? 'Section 21 (no-fault)' : 'Section 8 (fault-based)'}</td></tr>
    <tr><td>Ground(s) relied on</td><td>${esc(c.ground)}</td></tr>
    <tr><td>Indicative notice period</td><td>${c.notice_period_days != null ? `${esc(c.notice_period_days)} days (verify)` : '—'}</td></tr>
    <tr><td>Service method (logged)</td><td>${esc(c.service_method || '—')}</td></tr>
    <tr><td>Served to (logged)</td><td>${esc(c.service_recipient || '—')}</td></tr>
    <tr><td>Date served (logged)</td><td>${esc(fmtDate(c.notice_served_date))}</td></tr>
    <tr><td>Notice expiry</td><td>${esc(fmtDate(c.notice_expiry_date))}</td></tr>
  </table>
  <p class="sub" style="margin-top:18px">Notes: ${esc(c.notes || '—')}</p>
  <div class="footer"><span>Draft possession bundle — Propvora</span><span>Page 5</span></div>
</section>
</body>
</html>`
}

/** Open the assembled bundle in a new tab for print / save-as-PDF. */
export function openCourtBundle(input: BundleInput): boolean {
  const html = buildCourtBundleHtml(input)
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.open()
  w.document.write(html)
  w.document.close()
  return true
}
