# Propvora — Portal Guide

Propvora lets you bring external people — tenants, landlords/owners, suppliers,
applicants, accountants, solicitors — into scoped, read-limited views of just the records
they need, without giving them a workspace account. There are two distinct mechanisms:

1. **Account-based portals** — a named external contact signs in to a persistent portal
   (tenant / landlord / supplier) scoped to the records they own.
2. **Recipient share links** — a single magic-link URL (`/p/[token]`) that opens one
   invoice, job or document pack for a one-off recipient, with no account at all.

Both are **off by default** behind `NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED` and are enforced
by row-level security plus an explicit portal-session scope on the server.

---

## Granting access (from inside the workspace)

Use the **Portals** section (or the per-record *Share* action) to create a grant:

1. Pick a **profile** — Landlord/Owner, Supplier/Contractor, Tenant/Occupier, Applicant,
   Accountant, Solicitor or Generic. The profile decides the access type and what the
   recipient can see.
2. Pick a **purpose** — e.g. document exchange, invoice upload, quote submission, viewing,
   lease docs, supplier docs, legal docs — each with a sensible default expiry
   (7–90 days).
3. The grant mints a **magic-link token** (`POST /api/portals/grant`). The raw token is
   shown **once** and stored only as a hash; the recipient receives a link by email.

Grant status moves through *Created → Email sent → Opened → Active → Expired/Revoked/
Completed*, and you can **revoke** at any time.

---

## Tenant portal

A tenancy occupier signs in to:

- view tenancy documents and statements,
- raise and track maintenance requests,
- exchange messages with the workspace (via the shared, schema-correct messaging layer),
- see relevant compliance and payment information for their tenancy.

The portal user only ever sees rows tied to *their* tenancy/contact/property ids.

---

## Landlord / owner portal

For property owners whose properties you manage:

- owner-facing statements and financial documents,
- property updates and documents,
- secure document exchange.

Scoped to the owner's own properties and contacts.

---

## Supplier portal

For contractors and suppliers working jobs for the workspace:

- **Dashboard** — their jobs and invoices, with computed KPIs.
- **Jobs** — accept a job, move it to *In Progress*, and mark it *Complete* (each writes
  back to the workspace).
- **Invoices** — submit and track invoices against jobs.
- **Settings** — maintain their own contact details.

A supplier sees **no portfolio data** — only the jobs assigned to them. Supplier scoping
is enforced by per-supplier RLS and verified by `scripts/test/supplier-scope.mjs`.

---

## Recipient share links (`/p/[token]`)

For sending one thing to one person without an account:

- A share link targets a single **invoice**, **job** or **document pack** and renders a
  minimal, branded share shell (`ShareShell`, `InvoiceView`, `JobView`, `DocumentsView`).
- The recipient can view, and where the purpose allows, **upload evidence** (e.g. a
  contractor uploading an invoice or quote) which lands back in the workspace.
- Links carry an expiry, are rate-limited, and emit view/submission events for the
  audit trail. They can be revoked, after which the URL shows a neutral revoked/expired
  page.

---

## Security model

- **Verification** — opening a portal/recipient link calls `POST /api/portal/verify`,
  which resolves the token to its grant, **freezes the scope**, and issues an HttpOnly,
  signed session cookie. Responses are anti-enumeration neutral (a bad token reveals
  nothing).
- **File access** — portal files stream through `/api/portal/file`, which is fail-closed:
  it rejects path traversal (`..`) and any key whose workspace prefix is outside the
  session's scope.
- **Isolation** — every portal query runs under RLS scoped to the recipient's owned ids;
  no portal user can reach another workspace's, or another recipient's, data. This is
  asserted live by the IDOR sweep and supplier-scope suites.
- **Logout / revocation** — `POST /api/portal/logout` revokes the session and clears the
  cookie; grants and links can be revoked from the workspace at any time.

> All portal surfaces stay disabled until `NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED=true`,
> so the magic-link experience cannot be reached in production until the owner has
> verified it.
