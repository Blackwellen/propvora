/**
 * Dev-only: mint a portal session for each portal type (tenant / landlord /
 * supplier), bound to a REAL contact + real records discovered in your data,
 * then serve a one-click entry URL for each.
 *
 * Binding (matches src/lib/portal/data.ts scoping):
 *   - tenant   → a contact that is tenancies.primary_contact_id (or tenant_contact_id)
 *   - landlord → a contact linked to properties via contact_portal_access /
 *                contact_links (property ids frozen into the session scope)
 *   - supplier → a contact that is jobs.supplier_contact_id
 * If an ideal linkage isn't found, it falls back to the best available contact
 * and reports what it bound to (some lists may be empty).
 *
 * It writes rows to `portal_sessions` using the service-role key from
 * .env.local, then starts a tiny local server that sets the signed portal
 * cookie and redirects you in. Cookies are scoped by host (not port), so a
 * cookie set here on `localhost` is sent to your dev server on `localhost:3000`.
 *
 * Run:  node scripts/mint-portal-links.mjs
 * Requires the dev server up on http://localhost:3000 with
 * NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED=true. Sessions last 8h; re-run to refresh.
 */
import { createClient } from "@supabase/supabase-js"
import { createHash, createHmac, randomBytes } from "node:crypto"
import { readFileSync } from "node:fs"
import http from "node:http"

const APP = process.env.APP_URL || "http://localhost:3000"

function envVal(key) {
  for (const f of [".env.local", ".env"]) {
    try {
      const m = readFileSync(f, "utf8").match(new RegExp("^" + key + "=(.*)$", "m"))
      if (m) return m[1].trim()
    } catch { /* ignore */ }
  }
  return process.env[key]
}

const SUPABASE_URL = envVal("NEXT_PUBLIC_SUPABASE_URL")
const SERVICE_KEY = envVal("SUPABASE_SERVICE_ROLE_KEY")
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const explicit = envVal("PORTAL_SESSION_SECRET")
const SECRET = explicit && explicit.length >= 16 ? explicit : `portal:${SERVICE_KEY}`
const sha256 = (s) => createHash("sha256").update(s).digest("hex")
const signCookie = (token) => `${token}.${createHmac("sha256", SECRET).update(token).digest("base64url")}`

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

async function safe(promise) { try { const r = await promise; return r.error ? { data: null } : r } catch { return { data: null } } }
async function contactName(workspaceId, id) {
  if (!id) return "(no contact)"
  const { data } = await safe(sb.from("contacts").select("display_name, company").eq("workspace_id", workspaceId).eq("id", id).maybeSingle())
  return data?.company || data?.display_name || id
}

// ---- pick the workspace with the most real data ----------------------------
const { data: wss } = await safe(sb.from("workspaces").select("id, name, type"))
if (!wss?.length) { console.error("No workspaces found. Register + sign in once to create one."); process.exit(1) }
let workspace = wss[0]
let best = -1
for (const w of wss) {
  const [{ data: p }, { data: t }, { data: j }] = await Promise.all([
    safe(sb.from("properties").select("id").eq("workspace_id", w.id).limit(50)),
    safe(sb.from("tenancies").select("id").eq("workspace_id", w.id).limit(50)),
    safe(sb.from("jobs").select("id").eq("workspace_id", w.id).limit(50)),
  ])
  const score = (p?.length || 0) + (t?.length || 0) + (j?.length || 0)
  if (score > best) { best = score; workspace = w }
}
const ws = workspace.id
console.log(`\nWorkspace: ${workspace.name ?? ws} (${ws}) — data score ${best}\n`)

// ---- discover a real binding per portal type -------------------------------
async function discoverTenant() {
  let { data } = await safe(sb.from("tenancies").select("id, primary_contact_id, property_id, status").eq("workspace_id", ws).not("primary_contact_id", "is", null).order("status", { ascending: true }).limit(1))
  if (!data?.length) {
    const alt = await safe(sb.from("tenancies").select("id, tenant_contact_id, property_id").eq("workspace_id", ws).not("tenant_contact_id", "is", null).limit(1))
    if (alt.data?.length) data = alt.data.map((r) => ({ ...r, primary_contact_id: r.tenant_contact_id }))
  }
  if (!data?.length) return { contactId: null, scope: {}, note: "no tenancy with a primary contact — list will be empty" }
  const row = data[0]
  return { contactId: row.primary_contact_id, scope: { tenancyIds: [row.id] }, note: `tenancy ${row.id}` }
}

async function discoverLandlord() {
  for (const tbl of ["contact_portal_access", "contact_links"]) {
    const { data } = await safe(sb.from(tbl).select("contact_id, linked_id").eq("workspace_id", ws).eq("linked_type", "property").not("contact_id", "is", null).limit(200))
    if (data?.length) {
      const byContact = new Map()
      for (const r of data) { if (!byContact.has(r.contact_id)) byContact.set(r.contact_id, []); byContact.get(r.contact_id).push(r.linked_id) }
      let pick = null
      for (const [cid, ids] of byContact) if (!pick || ids.length > pick.ids.length) pick = { cid, ids }
      if (pick) return { contactId: pick.cid, scope: { propertyIds: pick.ids }, note: `${pick.ids.length} linked property(ies) via ${tbl}` }
    }
  }
  // Fallback: freeze the workspace's properties + bind any owner-ish contact.
  const { data: props } = await safe(sb.from("properties").select("id").eq("workspace_id", ws).limit(25))
  const ids = (props ?? []).map((p) => p.id)
  let contactId = null
  for (const f of [{ contact_type: "owner" }, { type: "owner" }, { contact_type: "landlord" }]) {
    const { data } = await safe(sb.from("contacts").select("id").eq("workspace_id", ws).match(f).limit(1))
    if (data?.length) { contactId = data[0].id; break }
  }
  if (!contactId) { const { data } = await safe(sb.from("contacts").select("id").eq("workspace_id", ws).limit(1)); contactId = data?.[0]?.id ?? null }
  return { contactId, scope: { propertyIds: ids }, note: `${ids.length} workspace property(ies) frozen (no explicit landlord link found)` }
}

async function discoverSupplier() {
  const { data } = await safe(sb.from("jobs").select("supplier_contact_id").eq("workspace_id", ws).not("supplier_contact_id", "is", null).limit(1))
  if (data?.length) return { contactId: data[0].supplier_contact_id, scope: {}, note: "bound to a supplier with assigned jobs" }
  for (const f of [{ contact_type: "supplier" }, { type: "supplier" }]) {
    const { data: c } = await safe(sb.from("contacts").select("id").eq("workspace_id", ws).match(f).limit(1))
    if (c?.length) return { contactId: c[0].id, scope: {}, note: "supplier contact (no jobs assigned yet — list may be empty)" }
  }
  const { data: any } = await safe(sb.from("contacts").select("id").eq("workspace_id", ws).limit(1))
  return { contactId: any?.[0]?.id ?? null, scope: {}, note: "no supplier contact found — list will be empty" }
}

const discovered = {
  tenant: await discoverTenant(),
  landlord: await discoverLandlord(),
  supplier: await discoverSupplier(),
}

// ---- mint a session per type -----------------------------------------------
const links = {}
for (const portalType of ["tenant", "landlord", "supplier"]) {
  const d = discovered[portalType]
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() // 7-day dev TTL (was 8h — kept expiring)
  const scope = { workspaceId: ws, contactId: d.contactId, portalType, permissions: {}, ...d.scope }
  const { data, error } = await safe(sb.from("portal_sessions").insert({
    workspace_id: ws, contact_id: d.contactId, portal_type: portalType, scope,
    session_token_hash: sha256(token), expires_at: expiresAt, revoked: false, last_seen_at: new Date().toISOString(),
  }).select("id").single())
  if (error || !data) { console.error(`  ${portalType}: mint failed`, error?.message); continue }
  links[portalType] = { cookie: signCookie(token), dest: `${APP}/portal/${data.id}/${portalType}` }
  const name = await contactName(ws, d.contactId)
  console.log(`  ${portalType.padEnd(9)} contact: ${name}  —  ${d.note}`)
}

if (!Object.keys(links).length) { console.error("\nNo sessions minted."); process.exit(1) }

// ---- tiny helper server: GET /go/:type sets the cookie then redirects -------
const server = http.createServer((req, res) => {
  const type = (req.url || "").replace("/go/", "").split("?")[0]
  const l = links[type]
  if (!l) { res.writeHead(404).end("unknown portal type"); return }
  res.writeHead(302, { "Set-Cookie": `pv_portal_session=${l.cookie}; Path=/; Max-Age=604800; SameSite=Lax`, Location: l.dest })
  res.end()
})
server.listen(0, () => {
  const port = server.address().port
  console.log("\nPortal entry links (open in your browser):\n")
  for (const t of ["tenant", "landlord", "supplier"]) if (links[t]) console.log(`  ${t.padEnd(9)} →  http://localhost:${port}/go/${t}`)
  console.log("\nLeave this script running while you open the links. Ctrl+C to stop.")
})
