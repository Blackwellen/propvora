/**
 * Demo Data Seeder — Comprehensive V2
 * Populates realistic UK property management data across EVERY section and tab.
 * All records have demo: true and are scoped to the given workspaceId.
 *
 * IMPORTANT: Uses the admin/service-role client (server-side only).
 * Never call this from client-side code.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import schemaMap from './schema-map.json'

// Schema-aware sanitiser: the live DB diverges from the seeder's assumed shape,
// so we drop columns that don't exist and coerce/drop invalid enum values using
// the real schema (docs/final-wiring/live-schema.json → schema-map.json).
type TableSchema = { columns: string[]; enums: Record<string, string[]>; required?: string[] }
const SCHEMA = schemaMap as Record<string, TableSchema>

// Cross-enum value remaps where the seeder's vocabulary differs from the DB's.
const VALUE_REMAP: Record<string, string> = {
  vacant: 'void', under_works: 'off_market',
  rent_to_rent: 'r2r', serviced_accommodation: 'sa_lite', long_term_let: 'standard_rental',
  landlord: 'owner', applicant: 'tenant', maintenance: 'supplier', cleaning: 'supplier',
  legal: 'supplier', insurer: 'supplier',
  medium: 'normal', // task/job priority
  waiting: 'blocked', // task_status has no "waiting"
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitiseRow(table: string, row: any): any {
  const sch = SCHEMA[table]
  if (!sch || !row) return row
  const allowed = new Set(sch.columns)
  const required = new Set(sch.required ?? [])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = {}
  for (const [k, v] of Object.entries(row)) {
    if (!allowed.has(k)) continue // column doesn't exist on the live table
    const enumVals = sch.enums[k]
    if (enumVals && typeof v === 'string' && !enumVals.includes(v)) {
      const remapped = VALUE_REMAP[v]
      if (remapped && enumVals.includes(remapped)) out[k] = remapped
      // Required (NOT NULL, no default) enum → never drop to null: use first valid value
      else if (required.has(k)) out[k] = enumVals[0]
      // else invalid enum on a nullable/defaulted column → drop the key
      continue
    }
    out[k] = v
  }
  return out
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function monthsAgo(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString().split('T')[0]
}

function tsMonthsAgo(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString()
}

function tsDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function isoDateFromNow(daysOffset: number, hour = 9, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

// ─── Safe insert helper ───────────────────────────────────────────────────────

// Demo batch context — set at the start of each seed run so every demo row is
// stamped with a shared batch id + 30-day expiry for lifecycle/cleanup.
let _demoCtx: { batchId: string; expiresAt: string } | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeInsert(supabase: ReturnType<typeof createAdminClient>, table: string, rows: any[]): Promise<any[]> {
  if (!rows.length) return []
  // Stamp demo rows with batch id + expiry, then sanitise against the live schema.
  const ctx = _demoCtx
  const stamped = (ctx
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? rows.map((r: any) => (r && r.demo === true ? { ...r, demo_batch_id: ctx.batchId, demo_expires_at: ctx.expiresAt } : r))
    : rows
  ).map((r) => sanitiseRow(table, r))
  try {
    const { data, error } = await supabase.from(table as never).insert(stamped as never).select()
    if (error) {
      console.warn(`[seed] ${table} insert warning:`, error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.warn(`[seed] ${table} insert exception:`, err)
    return []
  }
}

// ─── Main seed function ───────────────────────────────────────────────────────

export async function seedDemoData(
  workspaceId: string,
  userId: string,
  _variant: string = 'full'
): Promise<void> {
  const supabase = createAdminClient()

  // New demo batch — every demo row gets this id + a 30-day expiry.
  const expires = new Date()
  expires.setDate(expires.getDate() + 30)
  _demoCtx = { batchId: crypto.randomUUID(), expiresAt: expires.toISOString() }

  // ============================================================
  // 1. CONTACTS (15 total)
  // ============================================================

  const contactRows = [
    // Landlords
    { workspace_id: workspaceId, type: 'owner', display_name: 'Gerald Ashworth', email: 'g.ashworth@email.co.uk', phone: '07711 234567', company: null, address_line1: '14 Maple Grove', city: 'Birmingham', postcode: 'B15 2TH', notes: 'Prefers contact by email. Has 3 properties with us.', tags: ['portfolio', 'long-term'], status: 'active', demo: true },
    { workspace_id: workspaceId, type: 'owner', display_name: 'Patricia Okafor', email: 'p.okafor@propmail.co.uk', phone: '07833 456789', company: 'Okafor Properties Ltd', address_line1: '7 Elmwood Close', city: 'Wolverhampton', postcode: 'WV3 7RB', notes: 'Portfolio landlord. Interested in expanding R2R arrangement.', tags: ['vip', 'portfolio'], status: 'active', demo: true },
    // Tenants
    { workspace_id: workspaceId, type: 'tenant', display_name: 'James Thornton', email: 'j.thornton@gmail.com', phone: '07900 111222', company: null, address_line1: 'Room 1, 42 Sycamore Road', city: 'Birmingham', postcode: 'B12 0PQ', notes: 'Long-term tenant. Always pays on time.', tags: ['reliable'], status: 'active', demo: true },
    { workspace_id: workspaceId, type: 'tenant', display_name: 'Amara Mensah', email: 'amara.mensah@outlook.com', phone: '07900 333444', company: null, address_line1: 'Room 2, 42 Sycamore Road', city: 'Birmingham', postcode: 'B12 0PQ', notes: null, tags: [], status: 'active', demo: true },
    { workspace_id: workspaceId, type: 'tenant', display_name: 'Oliver Shaw', email: 'o.shaw@hotmail.com', phone: '07900 555666', company: null, address_line1: 'Room 3, 42 Sycamore Road', city: 'Birmingham', postcode: 'B12 0PQ', notes: 'Student. AST ends April next year.', tags: ['student'], status: 'active', demo: true },
    { workspace_id: workspaceId, type: 'tenant', display_name: 'Sophie Clarke', email: 's.clarke@gmail.com', phone: '07911 777888', company: null, address_line1: 'Flat 2, 88 Hawthorn Street', city: 'Birmingham', postcode: 'B6 4EF', notes: 'Working professional. 12-month AST.', tags: [], status: 'active', demo: true },
    { workspace_id: workspaceId, type: 'tenant', display_name: 'Kwame Asante', email: 'k.asante@btinternet.com', phone: '07922 999000', company: null, address_line1: 'Room 4, 22 Birchfield Lane', city: 'Wolverhampton', postcode: 'WV2 1AB', notes: null, tags: [], status: 'active', demo: true },
    // Prospective tenant with arrears
    { workspace_id: workspaceId, type: 'tenant', display_name: 'Marcus Reid', email: 'm.reid@yahoo.co.uk', phone: '07544 123456', company: null, address_line1: '9 Park View', city: 'Coventry', postcode: 'CV1 4NB', notes: 'Interested in Chestnut Drive. Works at Coventry University.', tags: ['prospect'], status: 'active', demo: true },
    // Suppliers
    { workspace_id: workspaceId, type: 'supplier', display_name: 'Dave Patel', email: 'dave@dpm-maintenance.co.uk', phone: '07700 100200', company: 'DPM Maintenance Ltd', address_line1: '3 Industrial Way', city: 'Birmingham', postcode: 'B8 2RT', notes: 'Trusted maintenance contractor. Quick turnaround.', tags: ['preferred', 'plumbing', 'general'], status: 'active', demo: true },
    { workspace_id: workspaceId, type: 'supplier', display_name: 'Maria Santos', email: 'maria@cleanbright.co.uk', phone: '07700 300400', company: 'CleanBright Services', address_line1: '9 Station Road', city: 'Birmingham', postcode: 'B1 1AA', notes: 'Weekly cleans on all HMOs.', tags: ['regular'], status: 'active', demo: true },
    { workspace_id: workspaceId, type: 'supplier', display_name: 'Rajesh Kapoor', email: 'r.kapoor@bwelectric.co.uk', phone: '07700 500600', company: 'BW Electrical Services', address_line1: '17 Commerce Park', city: 'Walsall', postcode: 'WS1 3RD', notes: 'Certified electrician. Good rates for portfolio work.', tags: ['electrical', 'NICEIC'], status: 'active', demo: true },
    // Agent
    { workspace_id: workspaceId, type: 'agent', display_name: 'Sarah Whitfield', email: 's.whitfield@keystonelets.co.uk', phone: '0121 555 1234', company: 'Keystone Lettings', address_line1: '45 High Street', city: 'Birmingham', postcode: 'B4 7SL', notes: 'Good source of off-market properties.', tags: ['agent', 'source'], status: 'active', demo: true },
    // Accountant
    { workspace_id: workspaceId, type: 'accountant', display_name: 'Michael Brennan', email: 'm.brennan@brennanaccounting.co.uk', phone: '0121 888 4567', company: 'Brennan Accounting Services', address_line1: '12 Victoria Square', city: 'Birmingham', postcode: 'B2 4QB', notes: 'Handles all property tax returns.', tags: ['accountant', 'tax'], status: 'active', demo: true },
    // Legal
    { workspace_id: workspaceId, type: 'supplier', display_name: 'Priya Anand', email: 'p.anand@anandlaw.co.uk', phone: '0121 333 6789', company: 'Anand & Co Solicitors', address_line1: '3 Temple Row', city: 'Birmingham', postcode: 'B2 5AB', notes: 'Property solicitor. Handles all AST and R2R contracts.', tags: ['legal', 'contracts'], status: 'active', demo: true },
    // Insurer
    { workspace_id: workspaceId, type: 'supplier', display_name: 'Fiona Hartley', email: 'fiona@landlordinsure.co.uk', phone: '0800 123 9876', company: 'LandlordInsure UK', address_line1: 'PO Box 500', city: 'Manchester', postcode: 'M1 2HX', notes: 'Current provider for all HMO policies.', tags: ['insurance'], status: 'active', demo: true },
  ]

  const contacts = await safeInsert(supabase, 'contacts', contactRows)

  const landlord1 = contacts.find((c: { display_name: string }) => c.display_name === 'Gerald Ashworth')
  const landlord2 = contacts.find((c: { display_name: string }) => c.display_name === 'Patricia Okafor')
  const tenant1   = contacts.find((c: { display_name: string }) => c.display_name === 'James Thornton')
  const tenant2   = contacts.find((c: { display_name: string }) => c.display_name === 'Amara Mensah')
  const tenant3   = contacts.find((c: { display_name: string }) => c.display_name === 'Oliver Shaw')
  const tenant4   = contacts.find((c: { display_name: string }) => c.display_name === 'Sophie Clarke')
  const tenant5   = contacts.find((c: { display_name: string }) => c.display_name === 'Kwame Asante')
  const supplier1 = contacts.find((c: { display_name: string }) => c.display_name === 'Dave Patel')
  const supplier2 = contacts.find((c: { display_name: string }) => c.display_name === 'Maria Santos')
  const supplier3 = contacts.find((c: { display_name: string }) => c.display_name === 'Rajesh Kapoor')

  if (!landlord1 || !landlord2 || !tenant1 || !tenant2 || !tenant3 || !tenant4 || !tenant5 || !supplier1 || !supplier2 || !supplier3) {
    throw new Error('Contact seed failed — required contacts not returned')
  }

  // ============================================================
  // 2. PROPERTIES (5)
  // ============================================================

  const propertyRows = [
    { workspace_id: workspaceId, nickname: '42 Sycamore Road', template: 'hmo', address_line1: '42 Sycamore Road', city: 'Birmingham', county: 'West Midlands', postcode: 'B12 0PQ', country: 'GB', latitude: 52.4752, longitude: -1.8870, status: 'active', bedrooms: 5, bathrooms: 2, floor_area_sqm: 148, target_rent_pcm: 2750, notes: '5-bed HMO. R2R agreement with Gerald Ashworth. Fully licenced.', demo: true, created_by: userId },
    { workspace_id: workspaceId, nickname: '88 Hawthorn Street', template: 'r2r', address_line1: '88 Hawthorn Street', city: 'Birmingham', county: 'West Midlands', postcode: 'B6 4EF', country: 'GB', latitude: 52.5020, longitude: -1.8611, status: 'active', bedrooms: 2, bathrooms: 1, floor_area_sqm: 68, target_rent_pcm: 1050, notes: 'Ground-floor flat. Good transport links.', demo: true, created_by: userId },
    { workspace_id: workspaceId, nickname: '22 Birchfield Lane', template: 'hmo', address_line1: '22 Birchfield Lane', city: 'Wolverhampton', county: 'West Midlands', postcode: 'WV2 1AB', country: 'GB', latitude: 52.5844, longitude: -2.1198, status: 'active', bedrooms: 4, bathrooms: 2, floor_area_sqm: 120, target_rent_pcm: 2200, notes: '4-bed HMO. R2R with Patricia Okafor.', demo: true, created_by: userId },
    { workspace_id: workspaceId, nickname: '7 Redwood Avenue', template: 'sa_lite', address_line1: '7 Redwood Avenue', city: 'Birmingham', county: 'West Midlands', postcode: 'B16 9JR', country: 'GB', latitude: 52.4713, longitude: -1.9283, status: 'active', bedrooms: 3, bathrooms: 1, floor_area_sqm: 95, target_rent_pcm: 2600, notes: 'Serviced accommodation. Short-lets only. Near NEC.', demo: true, created_by: userId },
    { workspace_id: workspaceId, nickname: '15 Chestnut Drive', template: 'r2r', address_line1: '15 Chestnut Drive', city: 'Coventry', county: 'West Midlands', postcode: 'CV1 2WS', country: 'GB', latitude: 52.4068, longitude: -1.5197, status: 'vacant', bedrooms: 3, bathrooms: 1, floor_area_sqm: 88, target_rent_pcm: 950, notes: 'Recently vacated. Light refurb required before re-let.', demo: true, created_by: userId },
  ]

  const properties = await safeInsert(supabase, 'properties', propertyRows)

  const prop1 = properties.find((p: { nickname: string }) => p.nickname === '42 Sycamore Road')
  const prop2 = properties.find((p: { nickname: string }) => p.nickname === '88 Hawthorn Street')
  const prop3 = properties.find((p: { nickname: string }) => p.nickname === '22 Birchfield Lane')
  const prop4 = properties.find((p: { nickname: string }) => p.nickname === '7 Redwood Avenue')
  const prop5 = properties.find((p: { nickname: string }) => p.nickname === '15 Chestnut Drive')

  if (!prop1 || !prop2 || !prop3 || !prop4 || !prop5) {
    throw new Error('Property seed failed — required properties not returned')
  }

  // ============================================================
  // 3. PROPERTY UNITS (10)
  // ============================================================

  const unitRows = [
    // 42 Sycamore Road — 6 rooms (5-bed HMO + extra)
    { workspace_id: workspaceId, property_id: prop1.id, unit_name: 'Room 1', unit_type: 'room', floor: 0, bedrooms: 1, bathrooms: 0, target_rent: 550, status: 'occupied', demo: true },
    { workspace_id: workspaceId, property_id: prop1.id, unit_name: 'Room 2', unit_type: 'room', floor: 0, bedrooms: 1, bathrooms: 0, target_rent: 500, status: 'occupied', demo: true },
    { workspace_id: workspaceId, property_id: prop1.id, unit_name: 'Room 3', unit_type: 'room', floor: 1, bedrooms: 1, bathrooms: 0, target_rent: 550, status: 'occupied', demo: true },
    { workspace_id: workspaceId, property_id: prop1.id, unit_name: 'Room 4', unit_type: 'room', floor: 1, bedrooms: 1, bathrooms: 0, target_rent: 575, status: 'vacant', demo: true },
    { workspace_id: workspaceId, property_id: prop1.id, unit_name: 'Room 5 (En-suite)', unit_type: 'room', floor: 1, bedrooms: 1, bathrooms: 1, target_rent: 600, status: 'occupied', demo: true },
    { workspace_id: workspaceId, property_id: prop1.id, unit_name: 'Room 6 (Ground)', unit_type: 'room', floor: 0, bedrooms: 1, bathrooms: 0, target_rent: 525, status: 'occupied', demo: true },
    // 88 Hawthorn Street — 2 flats
    { workspace_id: workspaceId, property_id: prop2.id, unit_name: 'Flat 1', unit_type: 'flat', floor: 0, bedrooms: 2, bathrooms: 1, target_rent: 1050, status: 'occupied', demo: true },
    { workspace_id: workspaceId, property_id: prop2.id, unit_name: 'Flat 2', unit_type: 'flat', floor: 1, bedrooms: 1, bathrooms: 1, target_rent: 875, status: 'vacant', demo: true },
    // 22 Birchfield Lane — 2 rooms
    { workspace_id: workspaceId, property_id: prop3.id, unit_name: 'Room 1', unit_type: 'room', floor: 0, bedrooms: 1, bathrooms: 0, target_rent: 525, status: 'occupied', demo: true },
    { workspace_id: workspaceId, property_id: prop3.id, unit_name: 'Room 2 (En-suite)', unit_type: 'room', floor: 1, bedrooms: 1, bathrooms: 1, target_rent: 600, status: 'occupied', demo: true },
  ]

  await safeInsert(supabase, 'property_units', unitRows)

  // ============================================================
  // 4. TENANCIES (6)
  // ============================================================

  const tenancyRows = [
    { workspace_id: workspaceId, property_id: prop1.id, primary_contact_id: tenant1.id, start_date: monthsAgo(14), end_date: daysFromNow(120), rent_amount: 550, deposit_amount: 550, deposit_scheme: 'DPS', rent_period: 'monthly', status: 'active', demo: true },
    { workspace_id: workspaceId, property_id: prop1.id, primary_contact_id: tenant2.id, start_date: monthsAgo(8), end_date: daysFromNow(240), rent_amount: 500, deposit_amount: 500, deposit_scheme: 'DPS', rent_period: 'monthly', status: 'active', demo: true },
    { workspace_id: workspaceId, property_id: prop1.id, primary_contact_id: tenant3.id, start_date: monthsAgo(6), end_date: daysFromNow(180), rent_amount: 550, deposit_amount: 550, deposit_scheme: 'TDS', rent_period: 'monthly', status: 'active', demo: true },
    { workspace_id: workspaceId, property_id: prop2.id, primary_contact_id: tenant4.id, start_date: monthsAgo(10), end_date: daysFromNow(60), rent_amount: 1050, deposit_amount: 1050, deposit_scheme: 'MyDeposits', rent_period: 'monthly', status: 'active', demo: true },
    { workspace_id: workspaceId, property_id: prop3.id, primary_contact_id: tenant5.id, start_date: monthsAgo(5), end_date: daysFromNow(210), rent_amount: 525, deposit_amount: 525, deposit_scheme: 'DPS', rent_period: 'monthly', status: 'active', demo: true },
    // Expired tenancy
    { workspace_id: workspaceId, property_id: prop5.id, primary_contact_id: null, start_date: monthsAgo(14), end_date: monthsAgo(2), rent_amount: 925, deposit_amount: 925, deposit_scheme: 'DPS', rent_period: 'monthly', status: 'ended', notes: 'Tenant vacated. Deposit return pending.', demo: true },
  ]

  const tenancies = await safeInsert(supabase, 'tenancies', tenancyRows)
  const tenancy1 = tenancies[0]
  const tenancy4 = tenancies[3]
  const tenancy6 = tenancies[5]

  // ============================================================
  // 5. TASKS (20)
  // ============================================================

  await safeInsert(supabase, 'tasks', [
    { workspace_id: workspaceId, title: 'Chase Room 4 vacancy — advertise on Spare Room', description: 'Room 4 at Sycamore Road has been vacant for 2 weeks. List on SpareRoom and Gumtree.', status: 'todo', priority: 'high', kind: 'turnover', property_id: prop1.id, due_at: daysFromNow(3), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Arrange HMO licence renewal — 42 Sycamore Road', description: 'HMO licence expires in 90 days. Submit renewal application to Birmingham City Council.', status: 'in_progress', priority: 'urgent', kind: 'compliance', property_id: prop1.id, due_at: daysFromNow(45), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Gas Safety Certificate — 42 Sycamore Road', description: 'Annual GSC due. Book with Dave Patel.', status: 'todo', priority: 'high', kind: 'compliance', property_id: prop1.id, due_at: daysFromNow(21), assignee_contact_id: supplier1.id, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Gas Safety Certificate — 88 Hawthorn Street', description: 'Annual GSC due.', status: 'done', priority: 'high', kind: 'compliance', property_id: prop2.id, due_at: daysAgo(10), completed_at: tsDaysAgo(10), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Reply to Patricia Okafor re: rent review', description: 'Patricia has requested a rent review discussion for 22 Birchfield Lane.', status: 'todo', priority: 'medium', kind: 'general', property_id: prop3.id, assignee_contact_id: landlord2.id, due_at: daysFromNow(7), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Book end-of-tenancy inspection — 88 Hawthorn Street', description: "Sophie Clarke's tenancy ends in 60 days. Book check-out inspection.", status: 'todo', priority: 'medium', kind: 'turnover', property_id: prop2.id, assignee_contact_id: tenant4.id, due_at: daysFromNow(30), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Refurb plan for 15 Chestnut Drive', description: 'Prepare scope of works and budget for light refurb before re-let.', status: 'in_progress', priority: 'high', kind: 'maintenance', property_id: prop5.id, due_at: daysFromNow(14), estimated_cost: 2500, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Quarterly financial report', description: 'Compile Q2 income/expense report for accountant.', status: 'todo', priority: 'medium', kind: 'general', due_at: daysFromNow(20), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Review insurance renewal — all properties', description: 'Landlord insurance renewal in 45 days. Get comparison quotes.', status: 'todo', priority: 'medium', kind: 'compliance', due_at: daysFromNow(30), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'PAT testing — 42 Sycamore Road', description: 'Annual PAT test for all portable appliances in the HMO.', status: 'todo', priority: 'low', kind: 'compliance', property_id: prop1.id, assignee_contact_id: supplier3.id, due_at: daysFromNow(60), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Deep clean before new tenant — Room 4', description: 'Book Maria Santos for full deep clean of Room 4 before new tenancy.', status: 'todo', priority: 'medium', kind: 'maintenance', property_id: prop1.id, assignee_contact_id: supplier2.id, due_at: daysFromNow(5), estimated_cost: 120, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Send deposit prescribed information — AST-005', description: 'Ensure DPS prescribed information sent to Kwame within 30 days.', status: 'done', priority: 'urgent', kind: 'compliance', property_id: prop3.id, assignee_contact_id: tenant5.id, completed_at: tsDaysAgo(20), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Source new R2R deal — Wolverhampton', description: 'Speak with Sarah Whitfield about off-market 4+ bed in WV postcode.', status: 'waiting', priority: 'medium', kind: 'general', due_at: daysFromNow(14), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'EICR certificate — 22 Birchfield Lane', description: 'EICR due before end of year. Get quote from Rajesh.', status: 'todo', priority: 'high', kind: 'compliance', property_id: prop3.id, assignee_contact_id: supplier3.id, due_at: daysFromNow(90), estimated_cost: 280, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Update landlord statement — Gerald Ashworth', description: 'Send monthly rental statement and payment breakdown.', status: 'todo', priority: 'low', kind: 'general', assignee_contact_id: landlord1.id, due_at: daysFromNow(7), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Fire alarm test — 42 Sycamore Road', description: 'Monthly fire alarm test. Log result in compliance log.', status: 'done', priority: 'high', kind: 'compliance', property_id: prop1.id, completed_at: tsDaysAgo(5), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Fire alarm test — 22 Birchfield Lane', description: 'Monthly fire alarm test.', status: 'done', priority: 'high', kind: 'compliance', property_id: prop3.id, completed_at: tsDaysAgo(5), demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Check Chestnut Drive boiler', description: 'Boiler making noise reported by previous tenant. Assess before re-let.', status: 'blocked', priority: 'high', kind: 'maintenance', property_id: prop5.id, assignee_contact_id: supplier1.id, due_at: daysFromNow(7), estimated_cost: 150, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Viewings for 7 Redwood Avenue', description: 'Two enquiries from Airbnb for November weekend stays. Confirm availability.', status: 'in_progress', priority: 'medium', kind: 'turnover', property_id: prop4.id, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Negotiate R2R extension — 42 Sycamore Road', description: 'Current R2R contract expires in 6 months. Initiate renewal discussion with Gerald.', status: 'todo', priority: 'medium', kind: 'general', property_id: prop1.id, assignee_contact_id: landlord1.id, due_at: daysFromNow(60), demo: true, created_by: userId },
  ])

  // ============================================================
  // 6. JOBS (8)
  // ============================================================

  const jobs = await safeInsert(supabase, 'jobs', [
    { workspace_id: workspaceId, title: 'Replace broken shower — Room 3, 42 Sycamore Road', description: 'Electric shower unit failed. Needs full replacement.', status: 'complete', priority: 'urgent', category: 'Plumbing', property_id: prop1.id, supplier_contact_id: supplier1.id, scheduled_date: daysAgo(14), completed_date: daysAgo(12), quoted_amount: 380, approved_amount: 380, invoiced_amount: 380, reference: 'JOB-001', notes: 'Replaced with Triton T80z.', demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Repaint hallway and landing — 88 Hawthorn Street', description: 'Full repaint in Dulux White Cotton.', status: 'in_progress', priority: 'medium', category: 'Decoration', property_id: prop2.id, supplier_contact_id: supplier1.id, scheduled_date: daysAgo(3), quoted_amount: 650, approved_amount: 650, reference: 'JOB-002', demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Install smoke alarm — 15 Chestnut Drive', description: 'Interconnected smoke and CO alarms throughout.', status: 'approved', priority: 'high', category: 'Compliance', property_id: prop5.id, supplier_contact_id: supplier3.id, quoted_amount: 420, approved_amount: 420, reference: 'JOB-003', demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Boiler service — 22 Birchfield Lane', description: 'Annual boiler service and gas safety check combined visit.', status: 'scheduled', priority: 'high', category: 'Plumbing', property_id: prop3.id, supplier_contact_id: supplier1.id, scheduled_date: daysFromNow(7), quoted_amount: 180, approved_amount: 180, reference: 'JOB-004', demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Weekly clean — 42 Sycamore Road', description: 'Communal areas clean: kitchen, bathrooms, hallways.', status: 'complete', priority: 'low', category: 'Cleaning', property_id: prop1.id, supplier_contact_id: supplier2.id, scheduled_date: daysAgo(7), completed_date: daysAgo(7), quoted_amount: 80, approved_amount: 80, invoiced_amount: 80, reference: 'JOB-005', demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Fix leaking tap — kitchen, 22 Birchfield Lane', description: 'Tenant reported dripping mixer tap.', status: 'new', priority: 'medium', category: 'Plumbing', property_id: prop3.id, supplier_contact_id: supplier1.id, reference: 'JOB-006', demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Electrical check — 7 Redwood Avenue', description: 'Pre-SA operation electrical safety check. NICEIC sign-off required.', status: 'quote_received', priority: 'high', category: 'Electrical', property_id: prop4.id, supplier_contact_id: supplier3.id, quoted_amount: 350, reference: 'JOB-007', demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Full refurb — 15 Chestnut Drive', description: 'Kitchen refresh, bathroom reseal, redecoration throughout.', status: 'scoped', priority: 'high', category: 'Refurbishment', property_id: prop5.id, quoted_amount: 4800, reference: 'JOB-008', notes: 'Getting 3 quotes.', demo: true, created_by: userId },
  ])

  const job1 = jobs.find((j: { reference: string }) => j.reference === 'JOB-001')
  const job2 = jobs.find((j: { reference: string }) => j.reference === 'JOB-002')
  const job5 = jobs.find((j: { reference: string }) => j.reference === 'JOB-005')

  // ============================================================
  // 7. SUPPLIER JOBS (5)
  // ============================================================
  // Base table (not a view). NOT NULL no-default: workspace_id, property_id,
  // supplier_contact_id, title. status enum = supplier_job_status
  // (draft|quoted|approved|scheduled|in_progress|completed|invoiced|paid|cancelled).
  void job1; void job2; void job5
  await safeInsert(supabase, 'supplier_jobs', [
    { workspace_id: workspaceId, property_id: prop1.id, supplier_contact_id: supplier1.id, title: 'Replace broken shower — Room 3', description: 'Electric shower unit failed. Full replacement.', status: 'completed', quoted_amount: 380, approved_amount: 380, invoice_amount: 380, scheduled_for: tsDaysAgo(14), completed_at: tsDaysAgo(12), notes: 'Replaced with Triton T80z. Signed off.', demo: true, created_by: userId },
    { workspace_id: workspaceId, property_id: prop2.id, supplier_contact_id: supplier1.id, title: 'Repaint hallway and landing', description: 'Full repaint in Dulux White Cotton.', status: 'in_progress', quoted_amount: 650, approved_amount: 650, scheduled_for: tsDaysAgo(3), notes: 'Started painting. Expect 2 more days.', demo: true, created_by: userId },
    { workspace_id: workspaceId, property_id: prop1.id, supplier_contact_id: supplier2.id, title: 'Weekly communal clean — 42 Sycamore Road', description: 'Kitchen, bathrooms, hallways.', status: 'completed', quoted_amount: 80, approved_amount: 80, invoice_amount: 80, scheduled_for: tsDaysAgo(7), completed_at: tsDaysAgo(7), notes: 'Clean completed and confirmed.', demo: true, created_by: userId },
    { workspace_id: workspaceId, property_id: prop3.id, supplier_contact_id: supplier1.id, title: 'Boiler service — 22 Birchfield Lane', description: 'Annual boiler service + gas safety check.', status: 'scheduled', quoted_amount: 180, approved_amount: 180, scheduled_for: isoDateFromNow(7, 9), demo: true, created_by: userId },
    { workspace_id: workspaceId, property_id: prop4.id, supplier_contact_id: supplier3.id, title: 'Electrical safety check — 7 Redwood Avenue', description: 'Pre-SA NICEIC electrical safety check.', status: 'quoted', quoted_amount: 350, demo: true, created_by: userId },
  ])

  // ============================================================
  // 8. SUPPLIER INVOICES (3)
  // ============================================================

  await safeInsert(supabase, 'supplier_invoices', [
    { workspace_id: workspaceId, contact_id: supplier1.id, invoice_number: 'SINV-001', amount: 380, currency: 'GBP', status: 'paid', submitted_at: tsDaysAgo(12), approved_at: tsDaysAgo(10), paid_at: tsDaysAgo(9), notes: 'Shower replacement JOB-001', demo: true },
    { workspace_id: workspaceId, contact_id: supplier2.id, invoice_number: 'SINV-002', amount: 80, currency: 'GBP', status: 'paid', submitted_at: tsDaysAgo(7), approved_at: tsDaysAgo(6), paid_at: tsDaysAgo(5), notes: 'Weekly clean JOB-005', demo: true },
    { workspace_id: workspaceId, contact_id: supplier1.id, invoice_number: 'SINV-003', amount: 650, currency: 'GBP', status: 'reviewing', submitted_at: tsDaysAgo(2), notes: 'Redecoration JOB-002 — job in progress', demo: true },
  ])

  // ============================================================
  // 9. PPM SCHEDULES (4)
  // ============================================================

  await safeInsert(supabase, 'ppm_schedules', [
    { workspace_id: workspaceId, property_id: prop1.id, title: 'Annual Gas Safety Inspection', description: 'Gas Safety Record must be renewed annually.', category: 'Gas Safety', frequency_type: 'annual', frequency_value: 1, last_completed_date: daysAgo(355), next_due_date: daysFromNow(10), assigned_supplier_id: supplier1.id, estimated_cost: 90, auto_create_job: true, days_before_due_to_create: 21, is_active: true, created_by: userId },
    { workspace_id: workspaceId, property_id: prop3.id, title: 'EICR Electrical Inspection', description: 'Electrical Installation Condition Report — required every 5 years for HMOs.', category: 'Electrical', frequency_type: 'custom', frequency_value: 60, last_completed_date: monthsAgo(54), next_due_date: daysFromNow(30), assigned_supplier_id: supplier3.id, estimated_cost: 280, auto_create_job: true, days_before_due_to_create: 30, is_active: true, created_by: userId },
    { workspace_id: workspaceId, property_id: prop1.id, title: 'Monthly Fire Alarm Test', description: 'Test all fire alarms and log results.', category: 'Fire Safety', frequency_type: 'monthly', frequency_value: 1, last_completed_date: daysAgo(5), next_due_date: daysFromNow(25), estimated_cost: 0, auto_create_job: false, days_before_due_to_create: 3, is_active: true, created_by: userId },
    { workspace_id: workspaceId, property_id: prop2.id, title: 'EPC Renewal', description: 'Energy Performance Certificate renewal — valid 10 years.', category: 'EPC', frequency_type: 'custom', frequency_value: 120, last_completed_date: monthsAgo(90), next_due_date: daysFromNow(300), estimated_cost: 120, auto_create_job: true, days_before_due_to_create: 90, is_active: true, created_by: userId },
  ])

  // ============================================================
  // 10. PLANNING SETS (3)
  // ============================================================

  const ps1Res = await safeInsert(supabase, 'planning_sets', [{
    workspace_id: workspaceId, title: '3-bed R2R — 62 Poplar Street, Birmingham', operation_profile: 'rent_to_rent', status: 'active', address: '62 Poplar Street, Birmingham', postcode: 'B19 3DX', gross_monthly_income: 1400, gross_annual_income: 16800, total_monthly_expenses: 1100, net_monthly_income: 300, net_annual_income: 3600, gross_yield: 0, net_yield: 0, roi: 0.36, upfront_cash_required: 3200, breakeven_month: 11, risk_score: 28, notes: 'Strong deal. Landlord motivated. Agreed 3-year R2R at £950/month.', demo: true, created_by: userId,
  }])
  const ps1 = ps1Res[0]

  const ps2Res = await safeInsert(supabase, 'planning_sets', [{
    workspace_id: workspaceId, title: '5-bed HMO — 18 Ash Close, Wolverhampton', operation_profile: 'hmo', status: 'draft', address: '18 Ash Close, Wolverhampton', postcode: 'WV4 5PL', gross_monthly_income: 2875, gross_annual_income: 34500, total_monthly_expenses: 2050, net_monthly_income: 825, net_annual_income: 9900, gross_yield: 0, net_yield: 0, roi: 0.55, upfront_cash_required: 6500, breakeven_month: 8, risk_score: 35, notes: 'Potential 5-bed HMO R2R. Needs HMO licence check.', demo: true, created_by: userId,
  }])
  const ps2 = ps2Res[0]

  const ps3Res = await safeInsert(supabase, 'planning_sets', [{
    workspace_id: workspaceId, title: 'SA Feasibility — 7 Redwood Avenue', operation_profile: 'serviced_accommodation', status: 'active', property_id: prop4.id, address: '7 Redwood Avenue, Birmingham', postcode: 'B16 9JR', gross_monthly_income: 2600, gross_annual_income: 31200, total_monthly_expenses: 1700, net_monthly_income: 900, net_annual_income: 10800, gross_yield: 0, net_yield: 0, roi: 0.72, upfront_cash_required: 5500, breakeven_month: 6, risk_score: 42, notes: 'Near NEC Birmingham. Good short-let demand.', demo: true, created_by: userId,
  }])
  const ps3 = ps3Res[0]

  if (ps1) {
    await safeInsert(supabase, 'planning_assumptions', [{ planning_set_id: ps1.id, landlord_monthly_rent: 950, contract_length_months: 36, break_clause_months: 12, rent_review_months: 12, void_allowance_pct: 0.05, management_fee_pct: 0, occupancy_rate_pct: 0.95 }])
    await safeInsert(supabase, 'planning_income_lines', [{ planning_set_id: ps1.id, label: 'Monthly rent (AST)', monthly_amount: 1400, sort_order: 0 }])
    await safeInsert(supabase, 'planning_expense_lines', [
      { planning_set_id: ps1.id, label: 'Landlord rent', monthly_amount: 950, category: 'Rent', sort_order: 0 },
      { planning_set_id: ps1.id, label: 'Council tax', monthly_amount: 65, category: 'Bills', sort_order: 1 },
      { planning_set_id: ps1.id, label: 'Gas & electricity', monthly_amount: 60, category: 'Bills', sort_order: 2 },
      { planning_set_id: ps1.id, label: 'Broadband', monthly_amount: 25, category: 'Bills', sort_order: 3 },
    ])
    await safeInsert(supabase, 'planning_upfront_costs', [
      { planning_set_id: ps1.id, label: 'Decoration & furnishing', amount: 2000, category: 'Setup', sort_order: 0 },
      { planning_set_id: ps1.id, label: 'Landlord rent advance (1 month)', amount: 950, category: 'Deposit', sort_order: 1 },
      { planning_set_id: ps1.id, label: 'Legal fees', amount: 250, category: 'Legal', sort_order: 2 },
    ])
    // Planning scenarios for ps1
    await safeInsert(supabase, 'planning_scenarios', [
      { planning_set_id: ps1.id, workspace_id: workspaceId, label: 'Best Case', scenario_type: 'best', net_monthly_income: 450, occupancy_rate_pct: 1.0, notes: '100% occupancy, above-market rents achieved.', demo: true },
      { planning_set_id: ps1.id, workspace_id: workspaceId, label: 'Base Case', scenario_type: 'base', net_monthly_income: 300, occupancy_rate_pct: 0.95, notes: 'Normal operations, 95% occupancy.', demo: true },
      { planning_set_id: ps1.id, workspace_id: workspaceId, label: 'Worst Case', scenario_type: 'worst', net_monthly_income: 50, occupancy_rate_pct: 0.70, notes: 'High voids, below-target rents.', demo: true },
    ]).catch(() => { /* planning_scenarios table may not exist, skip gracefully */ })
  }

  if (ps2) {
    await safeInsert(supabase, 'planning_assumptions', [{ planning_set_id: ps2.id, landlord_monthly_rent: 1100, contract_length_months: 36, break_clause_months: 12, void_allowance_pct: 0.08, management_fee_pct: 0, occupancy_rate_pct: 0.92 }])
    await safeInsert(supabase, 'planning_room_lines', [
      { planning_set_id: ps2.id, room_label: 'Room 1', room_type: 'room', monthly_rent: 550, bills_included: true, sort_order: 0 },
      { planning_set_id: ps2.id, room_label: 'Room 2', room_type: 'room', monthly_rent: 550, bills_included: true, sort_order: 1 },
      { planning_set_id: ps2.id, room_label: 'Room 3', room_type: 'room', monthly_rent: 575, bills_included: true, sort_order: 2 },
      { planning_set_id: ps2.id, room_label: 'Room 4', room_type: 'room', monthly_rent: 575, bills_included: true, sort_order: 3 },
      { planning_set_id: ps2.id, room_label: 'Room 5 (En-suite)', room_type: 'room', monthly_rent: 625, bills_included: true, sort_order: 4 },
    ])
    await safeInsert(supabase, 'planning_bill_lines', [
      { planning_set_id: ps2.id, label: 'Gas & electricity', monthly_amount: 220, provider: 'Eon', sort_order: 0 },
      { planning_set_id: ps2.id, label: 'Water rates', monthly_amount: 60, provider: 'Severn Trent', sort_order: 1 },
      { planning_set_id: ps2.id, label: 'Council tax', monthly_amount: 120, sort_order: 2 },
      { planning_set_id: ps2.id, label: 'Broadband', monthly_amount: 35, provider: 'Virgin Media', sort_order: 3 },
    ])
    await safeInsert(supabase, 'planning_expense_lines', [
      { planning_set_id: ps2.id, label: 'Landlord rent', monthly_amount: 1100, category: 'Rent', sort_order: 0 },
      { planning_set_id: ps2.id, label: 'Weekly cleaning', monthly_amount: 120, category: 'Maintenance', sort_order: 1 },
      { planning_set_id: ps2.id, label: 'Repairs & maintenance allowance', monthly_amount: 150, category: 'Maintenance', sort_order: 2 },
      { planning_set_id: ps2.id, label: 'HMO licence fee (monthly equivalent)', monthly_amount: 25, category: 'Compliance', sort_order: 3 },
    ])
    await safeInsert(supabase, 'planning_upfront_costs', [
      { planning_set_id: ps2.id, label: 'Furnishing (5 rooms)', amount: 3500, category: 'Setup', sort_order: 0 },
      { planning_set_id: ps2.id, label: 'Landlord advance (2 months)', amount: 2200, category: 'Deposit', sort_order: 1 },
      { planning_set_id: ps2.id, label: 'HMO licence application', amount: 800, category: 'Compliance', sort_order: 2 },
    ])
  }

  if (ps3) {
    await safeInsert(supabase, 'planning_assumptions', [{ planning_set_id: ps3.id, landlord_monthly_rent: 850, contract_length_months: 24, break_clause_months: 6, void_allowance_pct: 0.15, management_fee_pct: 0.15, occupancy_rate_pct: 0.75, average_daily_rate: 95 }])
    await safeInsert(supabase, 'planning_income_lines', [
      { planning_set_id: ps3.id, label: 'Short-let revenue (avg 75% occ × £95/night)', monthly_amount: 2150, source: 'Airbnb / Booking.com', sort_order: 0 },
      { planning_set_id: ps3.id, label: 'Cleaning fees collected', monthly_amount: 450, sort_order: 1 },
    ])
    await safeInsert(supabase, 'planning_expense_lines', [
      { planning_set_id: ps3.id, label: 'Landlord rent', monthly_amount: 850, category: 'Rent', sort_order: 0 },
      { planning_set_id: ps3.id, label: 'Platform fees (Airbnb 3%)', monthly_amount: 65, category: 'Platform', sort_order: 1 },
      { planning_set_id: ps3.id, label: 'Cleaning per turnover', monthly_amount: 320, category: 'Cleaning', sort_order: 2 },
      { planning_set_id: ps3.id, label: 'Utilities & bills', monthly_amount: 180, category: 'Bills', sort_order: 3 },
      { planning_set_id: ps3.id, label: 'Linen & consumables', monthly_amount: 80, category: 'Operations', sort_order: 4 },
      { planning_set_id: ps3.id, label: 'Insurance (SA specific)', monthly_amount: 55, category: 'Insurance', sort_order: 5 },
      { planning_set_id: ps3.id, label: 'Maintenance allowance', monthly_amount: 100, category: 'Maintenance', sort_order: 6 },
      { planning_set_id: ps3.id, label: 'Channel management software', monthly_amount: 50, category: 'Software', sort_order: 7 },
    ])
    await safeInsert(supabase, 'planning_upfront_costs', [
      { planning_set_id: ps3.id, label: 'High-spec furnishing', amount: 3500, category: 'Setup', sort_order: 0 },
      { planning_set_id: ps3.id, label: 'Photography & listing setup', amount: 350, category: 'Marketing', sort_order: 1 },
      { planning_set_id: ps3.id, label: 'Landlord advance (1 month)', amount: 850, category: 'Deposit', sort_order: 2 },
      { planning_set_id: ps3.id, label: 'Bedding & linen pack', amount: 800, category: 'Setup', sort_order: 3 },
    ])
  }

  // ============================================================
  // 11. INCOME RECORDS — 12 months of data (24+ rows)
  // ============================================================

  const incomeRows = []
  for (let m = 11; m >= 0; m--) {
    const d = new Date()
    d.setMonth(d.getMonth() - m)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const monthLabel = d.toLocaleString('en-GB', { month: 'long', year: 'numeric' })
    const isLate = m === 3

    // Prop 1 — 3+ occupied rooms
    incomeRows.push({ workspace_id: workspaceId, property_id: prop1.id, category: 'rent', description: `Room 1 rent — ${monthLabel}`, amount: 550, currency: 'GBP', date: dateStr, status: 'received', reference: `R1-${dateStr}`, demo: true, created_by: userId })
    incomeRows.push({ workspace_id: workspaceId, property_id: prop1.id, category: 'rent', description: `Room 2 rent — ${monthLabel}`, amount: 500, currency: 'GBP', date: dateStr, status: m === 0 ? 'expected' : 'received', reference: `R2-${dateStr}`, demo: true, created_by: userId })
    incomeRows.push({ workspace_id: workspaceId, property_id: prop1.id, category: 'rent', description: `Room 3 rent — ${monthLabel}`, amount: 550, currency: 'GBP', date: dateStr, status: isLate ? 'late' : m === 0 ? 'expected' : 'received', reference: `R3-${dateStr}`, demo: true, created_by: userId })
    // Prop 2 (started 10 months ago)
    if (m < 10) {
      incomeRows.push({ workspace_id: workspaceId, property_id: prop2.id, category: 'rent', description: `88 Hawthorn Street rent — ${monthLabel}`, amount: 1050, currency: 'GBP', date: dateStr, status: m === 0 ? 'expected' : 'received', reference: `H88-${dateStr}`, demo: true, created_by: userId })
    }
    // Prop 3 (started 5 months ago)
    if (m < 5) {
      incomeRows.push({ workspace_id: workspaceId, property_id: prop3.id, category: 'rent', description: `22 Birchfield rent — ${monthLabel}`, amount: 2200, currency: 'GBP', date: dateStr, status: m === 0 ? 'expected' : 'received', reference: `BF22-${dateStr}`, demo: true, created_by: userId })
    }
  }
  // SA income
  incomeRows.push({ workspace_id: workspaceId, property_id: prop4.id, category: 'short_let', description: 'Airbnb income — October', amount: 2340, currency: 'GBP', date: monthsAgo(1), status: 'received', reference: 'AIR-OCT', demo: true, created_by: userId })
  incomeRows.push({ workspace_id: workspaceId, property_id: prop4.id, category: 'short_let', description: 'Booking.com income — October', amount: 680, currency: 'GBP', date: monthsAgo(1), status: 'received', reference: 'BDC-OCT', demo: true, created_by: userId })
  incomeRows.push({ workspace_id: workspaceId, property_id: prop4.id, category: 'short_let', description: 'Airbnb income — November', amount: 1980, currency: 'GBP', date: daysAgo(15), status: 'received', reference: 'AIR-NOV', demo: true, created_by: userId })

  await safeInsert(supabase, 'income_records', incomeRows)

  // ============================================================
  // 12. EXPENSE RECORDS (18+ rows)
  // ============================================================

  const expenseRows = []
  for (let m = 11; m >= 0; m--) {
    const d = new Date()
    d.setMonth(d.getMonth() - m)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-05`
    expenseRows.push({ workspace_id: workspaceId, property_id: prop1.id, category: 'rent_paid', description: 'Landlord rent — 42 Sycamore Road', amount: 1450, currency: 'GBP', date: dateStr, status: 'paid', reference: `LP-SYC-${dateStr}`, demo: true, created_by: userId })
    if (m < 10) {
      expenseRows.push({ workspace_id: workspaceId, property_id: prop2.id, category: 'rent_paid', description: 'Landlord rent — 88 Hawthorn Street', amount: 700, currency: 'GBP', date: dateStr, status: 'paid', reference: `LP-HAW-${dateStr}`, demo: true, created_by: userId })
    }
    if (m < 5) {
      expenseRows.push({ workspace_id: workspaceId, property_id: prop3.id, category: 'rent_paid', description: 'Landlord rent — 22 Birchfield Lane', amount: 1100, currency: 'GBP', date: dateStr, status: 'paid', reference: `LP-BFL-${dateStr}`, demo: true, created_by: userId })
    }
  }
  // One-off expenses
  expenseRows.push({ workspace_id: workspaceId, property_id: prop1.id, category: 'maintenance', description: 'Shower replacement — Room 3', amount: 380, currency: 'GBP', date: daysAgo(12), status: 'paid', reference: 'EXP-JOB001', demo: true, created_by: userId })
  expenseRows.push({ workspace_id: workspaceId, property_id: prop1.id, category: 'cleaning', description: 'Weekly communal clean', amount: 80, currency: 'GBP', date: daysAgo(7), status: 'paid', reference: 'EXP-CLEAN-001', demo: true, created_by: userId })
  expenseRows.push({ workspace_id: workspaceId, property_id: prop1.id, category: 'utilities', description: 'Gas & electricity — 42 Sycamore Road', amount: 210, currency: 'GBP', date: daysAgo(30), status: 'paid', reference: 'UTIL-OCT-SYC', demo: true, created_by: userId })
  expenseRows.push({ workspace_id: workspaceId, property_id: prop3.id, category: 'utilities', description: 'Gas & electricity — 22 Birchfield Lane', amount: 185, currency: 'GBP', date: daysAgo(30), status: 'paid', reference: 'UTIL-OCT-BFL', demo: true, created_by: userId })
  expenseRows.push({ workspace_id: workspaceId, property_id: prop4.id, category: 'platform_fee', description: 'Airbnb platform fees — October', amount: 72, currency: 'GBP', date: daysAgo(30), status: 'paid', reference: 'AIR-FEE-OCT', demo: true, created_by: userId })
  expenseRows.push({ workspace_id: workspaceId, category: 'insurance', description: 'Annual HMO insurance — all properties', amount: 1840, currency: 'GBP', date: monthsAgo(6), status: 'paid', reference: 'INS-ANNUAL', demo: true, created_by: userId })

  await safeInsert(supabase, 'expense_records', expenseRows)

  // ============================================================
  // 13. MONEY_INCOME — 12 months (24 rows for money module charts)
  // ============================================================

  const moneyIncomeRows = []
  for (let m = 11; m >= 0; m--) {
    const d = new Date()
    d.setMonth(d.getMonth() - m)
    const expectedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const receivedDate = m === 0 ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-04`
    const monthLabel = d.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

    moneyIncomeRows.push({ workspace_id: workspaceId, property_id: prop1.id, description: `HMO Room Rents — ${monthLabel}`, income_type: 'rent', expected_date: expectedDate, received_date: receivedDate, amount: 1600 + (Math.floor(m * 13) % 100), currency: 'GBP', status: m === 0 ? 'expected' : 'received', reference: `MI-SYC-${expectedDate}` })
    moneyIncomeRows.push({ workspace_id: workspaceId, property_id: m < 10 ? prop2.id : prop4.id, description: m < 10 ? `Hawthorn Street rent — ${monthLabel}` : `SA Short-let Revenue — ${monthLabel}`, income_type: m < 10 ? 'rent' : 'short_let', expected_date: expectedDate, received_date: receivedDate, amount: m < 10 ? 1050 : (1200 + (m * 40)), currency: 'GBP', status: m === 0 ? 'expected' : 'received', reference: `MI-P2P4-${expectedDate}` })
  }

  await safeInsert(supabase, 'money_income', moneyIncomeRows)

  // ============================================================
  // 14. MONEY_EXPENSES — 18 rows
  // ============================================================

  const moneyExpenseRows = []
  const expenseCategories = ['maintenance', 'insurance', 'mortgage', 'agency_fees', 'utilities', 'cleaning']
  const expenseAmounts: Record<string, number> = { maintenance: 380, insurance: 153, mortgage: 1200, agency_fees: 220, utilities: 195, cleaning: 80 }

  for (let m = 11; m >= 0; m--) {
    const d = new Date()
    d.setMonth(d.getMonth() - m)
    const paidDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-15`
    const category = expenseCategories[m % expenseCategories.length]
    const amount = expenseAmounts[category] ?? 200
    moneyExpenseRows.push({ workspace_id: workspaceId, property_id: [prop1.id, prop2.id, prop3.id][m % 3], description: `${category.replace('_', ' ')} — month ${12 - m}`, expense_type: category, cost_behaviour: 'fixed', amount, currency: 'GBP', paid_date: paidDate, status: 'paid', notes: null })
    if (m % 2 === 0) {
      moneyExpenseRows.push({ workspace_id: workspaceId, property_id: prop4.id, description: `SA operations — month ${12 - m}`, expense_type: 'cleaning', cost_behaviour: 'variable', amount: 280, currency: 'GBP', paid_date: paidDate, status: 'paid', notes: 'Turnaround cleans' })
    }
  }

  await safeInsert(supabase, 'money_expenses', moneyExpenseRows)

  // ============================================================
  // 15. MONEY_INVOICES (8) + MONEY_INVOICE_LINES
  // ============================================================

  const moneyInvoices = await safeInsert(supabase, 'money_invoices', [
    { workspace_id: workspaceId, invoice_number: 'MINV-001', recipient_contact_id: tenant1.id, property_id: prop1.id, invoice_type: 'rent', issue_date: daysAgo(30), due_date: daysAgo(28), subtotal: 550, tax_amount: 0, total_amount: 550, amount_paid: 550, status: 'paid', notes: 'Room 1 rent — month 1' },
    { workspace_id: workspaceId, invoice_number: 'MINV-002', recipient_contact_id: tenant2.id, property_id: prop1.id, invoice_type: 'rent', issue_date: daysAgo(30), due_date: daysAgo(28), subtotal: 500, tax_amount: 0, total_amount: 500, amount_paid: 500, status: 'paid', notes: 'Room 2 rent — month 1' },
    { workspace_id: workspaceId, invoice_number: 'MINV-003', recipient_contact_id: tenant3.id, property_id: prop1.id, invoice_type: 'rent', issue_date: daysAgo(5), due_date: daysFromNow(0), subtotal: 550, tax_amount: 0, total_amount: 550, amount_paid: 0, status: 'due_soon', notes: 'Room 3 rent — current month' },
    { workspace_id: workspaceId, invoice_number: 'MINV-004', recipient_contact_id: tenant4.id, property_id: prop2.id, invoice_type: 'rent', issue_date: daysAgo(45), due_date: daysAgo(42), subtotal: 1050, tax_amount: 0, total_amount: 1050, amount_paid: 0, status: 'overdue', notes: 'Hawthorn Street rent — OVERDUE' },
    { workspace_id: workspaceId, invoice_number: 'MINV-005', recipient_contact_id: landlord1.id, property_id: prop1.id, invoice_type: 'management_fee', issue_date: daysAgo(15), due_date: daysAgo(5), subtotal: 1600, tax_amount: 0, total_amount: 1600, amount_paid: 1600, status: 'paid', notes: 'Net rent remittance — October' },
    { workspace_id: workspaceId, invoice_number: 'MINV-006', recipient_contact_id: supplier1.id, property_id: prop1.id, invoice_type: 'maintenance', issue_date: daysAgo(12), due_date: daysFromNow(18), subtotal: 380, tax_amount: 0, total_amount: 380, amount_paid: 380, status: 'paid', notes: 'Shower replacement JOB-001' },
    { workspace_id: workspaceId, invoice_number: 'MINV-007', recipient_contact_id: supplier3.id, property_id: prop5.id, invoice_type: 'maintenance', issue_date: daysAgo(1), due_date: daysFromNow(29), subtotal: 420, tax_amount: 84, total_amount: 504, amount_paid: 0, status: 'draft', notes: 'Smoke alarm installation' },
    { workspace_id: workspaceId, invoice_number: 'MINV-008', recipient_contact_id: tenant5.id, property_id: prop3.id, invoice_type: 'rent', issue_date: daysAgo(5), due_date: daysFromNow(2), subtotal: 525, tax_amount: 0, total_amount: 525, amount_paid: 0, status: 'sent', notes: 'Birchfield Lane Room rent — current month' },
  ])

  // Invoice lines for first 3 invoices
  for (const inv of moneyInvoices.slice(0, 3)) {
    await safeInsert(supabase, 'money_invoice_lines', [
      { workspace_id: workspaceId, invoice_id: inv.id, description: 'Monthly room rent', quantity: 1, unit_price: inv.subtotal, tax_rate: 0 },
    ])
  }

  // ============================================================
  // 16. MONEY_BILLS (6)
  // ============================================================

  await safeInsert(supabase, 'money_bills', [
    { workspace_id: workspaceId, property_id: prop1.id, supplier_id: null, bill_number: 'MBILL-001', bill_type: 'utility', issue_date: daysAgo(28), due_date: daysAgo(7), amount: 210, currency: 'GBP', approval_status: 'approved', payment_status: 'paid', paid_at: tsDaysAgo(7), notes: 'Electricity — 42 Sycamore Road Oct', created_by: userId },
    { workspace_id: workspaceId, property_id: prop3.id, supplier_id: null, bill_number: 'MBILL-002', bill_type: 'utility', issue_date: daysAgo(28), due_date: daysFromNow(3), amount: 185, currency: 'GBP', approval_status: 'approved', payment_status: 'unpaid', notes: 'Gas & electric — 22 Birchfield Oct', created_by: userId },
    { workspace_id: workspaceId, property_id: prop1.id, bill_number: 'MBILL-003', bill_type: 'council_tax', issue_date: daysAgo(60), due_date: daysAgo(30), amount: 120, currency: 'GBP', approval_status: 'approved', payment_status: 'paid', paid_at: tsDaysAgo(30), notes: 'Council tax 42 Sycamore — quarter', created_by: userId },
    { workspace_id: workspaceId, property_id: prop4.id, bill_number: 'MBILL-004', bill_type: 'invoice', issue_date: daysAgo(5), due_date: daysFromNow(25), amount: 280, currency: 'GBP', approval_status: 'awaiting_review', payment_status: 'unpaid', notes: 'SA turnaround cleans October', created_by: userId },
    { workspace_id: workspaceId, bill_number: 'MBILL-005', bill_type: 'invoice', issue_date: monthsAgo(6), due_date: new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString().split('T')[0], amount: 1840, currency: 'GBP', approval_status: 'approved', payment_status: 'paid', paid_at: tsMonthsAgo(5), notes: 'Annual HMO insurance — all properties', created_by: userId },
    { workspace_id: workspaceId, property_id: prop2.id, bill_number: 'MBILL-006', bill_type: 'utility', issue_date: daysAgo(15), due_date: daysFromNow(15), amount: 95, currency: 'GBP', approval_status: 'awaiting_review', payment_status: 'unpaid', notes: 'Broadband & water — Hawthorn Street', created_by: userId },
  ])

  // ============================================================
  // 17. MONEY_DEPOSITS (5)
  // ============================================================

  await safeInsert(supabase, 'money_deposits', [
    { workspace_id: workspaceId, tenant_contact_id: tenant1.id, property_id: prop1.id, tenancy_id: tenancy1?.id ?? null, amount: 550, currency: 'GBP', received_date: monthsAgo(14), protection_scheme: 'DPS', protection_reference: 'DPS-2024-001', protected_date: monthsAgo(14), prescribed_info_served_at: monthsAgo(14), status: 'protected', notes: 'Protected within 30 days.', created_by: userId },
    { workspace_id: workspaceId, tenant_contact_id: tenant2.id, property_id: prop1.id, amount: 500, currency: 'GBP', received_date: monthsAgo(8), protection_scheme: 'DPS', protection_reference: 'DPS-2024-002', protected_date: monthsAgo(8), prescribed_info_served_at: monthsAgo(8), status: 'protected', created_by: userId },
    { workspace_id: workspaceId, tenant_contact_id: tenant4.id, property_id: prop2.id, tenancy_id: tenancy4?.id ?? null, amount: 1050, currency: 'GBP', received_date: monthsAgo(10), protection_scheme: 'MyDeposits', protection_reference: 'MD-2024-003', protected_date: monthsAgo(10), prescribed_info_served_at: monthsAgo(10), status: 'return_due', return_due_date: daysFromNow(30), notes: 'Tenancy ending soon — prepare deposit return.', created_by: userId },
    { workspace_id: workspaceId, tenant_contact_id: tenant5.id, property_id: prop3.id, amount: 525, currency: 'GBP', received_date: monthsAgo(5), protection_scheme: 'DPS', protection_reference: 'DPS-2024-004', protected_date: monthsAgo(5), prescribed_info_served_at: monthsAgo(5), status: 'protected', created_by: userId },
    { workspace_id: workspaceId, property_id: prop5.id, tenancy_id: tenancy6?.id ?? null, amount: 925, currency: 'GBP', received_date: monthsAgo(14), protection_scheme: 'DPS', protection_reference: 'DPS-2023-999', protected_date: monthsAgo(14), status: 'return_due', return_due_date: daysAgo(14), notes: 'Previous tenant vacated. Deposit return overdue.', created_by: userId },
  ])

  // ============================================================
  // 18. MONEY_ARREARS_CASES (2)
  // ============================================================

  const moneyInvOverdue = moneyInvoices.find((i: { invoice_number: string }) => i.invoice_number === 'MINV-004')
  await safeInsert(supabase, 'money_arrears_cases', [
    { workspace_id: workspaceId, contact_id: tenant4.id, property_id: prop2.id, invoice_id: moneyInvOverdue?.id ?? null, amount_outstanding: 1050, days_overdue: 45, severity: 'high', status: 'chasing', last_chased_at: tsDaysAgo(7), next_chase_at: isoDateFromNow(3), notes: 'Tenant Sophie Clarke has not paid October rent. Called twice.', created_by: userId },
    { workspace_id: workspaceId, contact_id: tenant3.id, property_id: prop1.id, amount_outstanding: 275, days_overdue: 18, severity: 'medium', status: 'open', notes: 'Oliver Shaw — partial payment only received last month. Balance outstanding.', created_by: userId },
  ])

  // ============================================================
  // 19. MONEY_TRANSACTIONS — 30 bank transactions
  // ============================================================
  // Base table (not a view). NOT NULL no-default: workspace_id, direction,
  // category, amount, occurred_on. Enums: direction = money_direction (in|out),
  // category = money_category (rent|maintenance|cleaning|utility_recharge|
  // insurance|management_fee|...). amount is always positive; direction signs it.

  const txnProps = [prop1.id, prop2.id, prop3.id, prop4.id, prop1.id]
  const txnIncome = [
    { category: 'rent', amount: 550, description: 'ROOM RENT SYCAMORE' },
    { category: 'rent', amount: 1050, description: 'HAWTHORN ST RENT' },
    { category: 'rent', amount: 2200, description: 'BIRCHFIELD LANE RENT' },
    { category: 'rent', amount: 2340, description: 'AIRBNB PAYOUT' },
    { category: 'rent', amount: 500, description: 'SA BOOKING INCOME' },
  ]
  const txnExpense = [
    { category: 'maintenance', amount: 380, description: 'DPM MAINTENANCE LTD' },
    { category: 'cleaning', amount: 80, description: 'CLEANBRIGHT SERVICES' },
    { category: 'utility_recharge', amount: 210, description: 'GAS/ELECTRIC UTILITA' },
    { category: 'maintenance', amount: 650, description: 'BW ELECTRICAL' },
    { category: 'insurance', amount: 185, description: 'LANDLORDINSURE UK' },
  ]

  const transactionRows = []
  for (let i = 0; i < 30; i++) {
    const isIncome = i % 3 !== 2
    const spec = isIncome ? txnIncome[i % 5] : txnExpense[i % 5]
    transactionRows.push({
      workspace_id: workspaceId,
      direction: isIncome ? 'in' : 'out',
      category: spec.category,
      amount: spec.amount,
      currency: 'GBP',
      occurred_on: daysAgo(i * 4),
      property_id: txnProps[i % 5],
      description: spec.description,
      reference: `BANK-${String(i + 1).padStart(3, '0')}`,
      reconciled: i < 20,
      reconciled_at: i < 20 ? tsDaysAgo(i * 4) : null,
      demo: true,
      created_by: userId,
    })
  }

  await safeInsert(supabase, 'money_transactions', transactionRows)

  // ============================================================
  // 20. INVOICES (legacy table — 8 rows)
  // ============================================================

  await safeInsert(supabase, 'invoices', [
    { workspace_id: workspaceId, invoice_number: 'INV-2024-001', contact_id: supplier1.id, property_id: prop1.id, invoice_type: 'supplier', issue_date: daysAgo(10), due_date: daysFromNow(20), subtotal: 380, tax_amount: 0, total: 380, currency: 'GBP', status: 'approved', notes: 'Shower replacement Room 3', demo: true, created_by: userId },
    { workspace_id: workspaceId, invoice_number: 'INV-2024-002', contact_id: supplier2.id, property_id: prop1.id, invoice_type: 'supplier', issue_date: daysAgo(7), due_date: daysFromNow(7), subtotal: 80, tax_amount: 0, total: 80, currency: 'GBP', status: 'paid', paid_at: tsDaysAgo(3), paid_amount: 80, notes: 'Weekly clean 42 Sycamore Road', demo: true, created_by: userId },
    { workspace_id: workspaceId, invoice_number: 'INV-2024-003', contact_id: supplier1.id, property_id: prop2.id, invoice_type: 'supplier', issue_date: daysAgo(2), due_date: daysFromNow(28), subtotal: 650, tax_amount: 0, total: 650, currency: 'GBP', status: 'sent', notes: 'Hallway redecoration', demo: true, created_by: userId },
    { workspace_id: workspaceId, invoice_number: 'INV-2024-004', contact_id: landlord1.id, property_id: prop1.id, invoice_type: 'outbound', issue_date: daysAgo(30), due_date: daysAgo(15), subtotal: 1600, tax_amount: 0, total: 1600, currency: 'GBP', status: 'paid', paid_at: tsDaysAgo(14), paid_amount: 1600, notes: 'Rent collection October', demo: true, created_by: userId },
    { workspace_id: workspaceId, invoice_number: 'INV-2024-005', contact_id: supplier3.id, property_id: prop5.id, invoice_type: 'supplier', issue_date: daysAgo(1), due_date: daysFromNow(29), subtotal: 420, tax_amount: 84, total: 504, currency: 'GBP', status: 'draft', notes: 'Smoke alarm installation quote', demo: true, created_by: userId },
    { workspace_id: workspaceId, invoice_number: 'INV-2024-006', contact_id: contacts.find((c: { full_name: string }) => c.full_name === 'Michael Brennan')?.id ?? null, invoice_type: 'supplier', issue_date: monthsAgo(3), due_date: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0], subtotal: 350, tax_amount: 70, total: 420, currency: 'GBP', status: 'paid', paid_at: tsMonthsAgo(2), paid_amount: 420, notes: 'Quarterly accountancy fee', demo: true, created_by: userId },
    { workspace_id: workspaceId, invoice_number: 'INV-2024-007', contact_id: landlord2.id, property_id: prop3.id, invoice_type: 'outbound', issue_date: daysAgo(5), due_date: daysFromNow(25), subtotal: 1100, tax_amount: 0, total: 1100, currency: 'GBP', status: 'overdue', notes: 'Monthly landlord rent — 22 Birchfield Lane', demo: true, created_by: userId },
    { workspace_id: workspaceId, invoice_number: 'INV-2024-008', contact_id: supplier3.id, property_id: prop4.id, invoice_type: 'supplier', issue_date: daysAgo(3), due_date: daysFromNow(27), subtotal: 350, tax_amount: 70, total: 420, currency: 'GBP', status: 'due', notes: 'NICEIC electrical safety check', demo: true, created_by: userId },
  ])

  // ============================================================
  // 21. CHART OF ACCOUNTS (5)
  // ============================================================

  await safeInsert(supabase, 'chart_of_accounts', [
    { workspace_id: workspaceId, account_code: '4000', account_name: 'Rental Income', account_type: 'income', currency: 'GBP', is_system: false, is_active: true },
    { workspace_id: workspaceId, account_code: '6100', account_name: 'Maintenance Expenses', account_type: 'expense', currency: 'GBP', is_system: false, is_active: true },
    { workspace_id: workspaceId, account_code: '6200', account_name: 'Mortgage Payments', account_type: 'expense', currency: 'GBP', is_system: false, is_active: true },
    { workspace_id: workspaceId, account_code: '6300', account_name: 'Insurance Premiums', account_type: 'expense', currency: 'GBP', is_system: false, is_active: true },
    { workspace_id: workspaceId, account_code: '6400', account_name: 'Agent & Management Fees', account_type: 'expense', currency: 'GBP', is_system: false, is_active: true },
  ])

  // ============================================================
  // 22. CLIENT ACCOUNTS (2)
  // ============================================================

  await safeInsert(supabase, 'client_accounts', [
    { workspace_id: workspaceId, contact_id: landlord1.id, account_name: 'Gerald Ashworth Client Account', bank_account_name: 'Propvora Client', bank_sort_code: '40-12-34', bank_account_number: '12345678', current_balance: 1600.00, trust_balance: 1600.00, management_fee_pct: 12.5, auto_disburse: true, disburse_day: 25, is_active: true },
    { workspace_id: workspaceId, contact_id: landlord2.id, account_name: 'Patricia Okafor Client Account', bank_account_name: 'Propvora Client', bank_sort_code: '40-12-34', bank_account_number: '87654321', current_balance: 2200.00, trust_balance: 2200.00, management_fee_pct: 10.0, auto_disburse: false, disburse_day: 28, is_active: true },
  ])

  // ============================================================
  // 23. CALENDAR EVENTS (12)
  // ============================================================

  const now = new Date()
  await safeInsert(supabase, 'calendar_events', [
    { workspace_id: workspaceId, title: 'HMO licence renewal deadline', event_type: 'planning_deadline', start_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 45, 9, 0).toISOString(), all_day: true, property_id: prop1.id, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Gas safety check — 42 Sycamore Road', event_type: 'job_scheduled', start_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21, 10, 0).toISOString(), end_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21, 12, 0).toISOString(), property_id: prop1.id, contact_id: supplier1.id, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Boiler service — 22 Birchfield Lane', event_type: 'job_scheduled', start_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 9, 0).toISOString(), end_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 11, 0).toISOString(), property_id: prop3.id, contact_id: supplier1.id, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Sophie Clarke tenancy ends', event_type: 'tenancy_end', start_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60, 9, 0).toISOString(), all_day: true, property_id: prop2.id, contact_id: tenant4.id, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Monthly rent due — all properties', event_type: 'rent_due', start_at: new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0).toISOString(), all_day: true, property_id: prop1.id, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Invoice INV-2024-001 due', event_type: 'invoice_due', start_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 20, 9, 0).toISOString(), all_day: true, contact_id: supplier1.id, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Call Patricia Okafor re rent review', event_type: 'contact_followup', start_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 14, 0).toISOString(), end_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 14, 30).toISOString(), contact_id: landlord2.id, property_id: prop3.id, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Viewing — prospective tenant Room 4', event_type: 'viewing', start_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 18, 0).toISOString(), end_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 18, 30).toISOString(), property_id: prop1.id, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Property inspection — 15 Chestnut Drive', event_type: 'inspection', start_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10, 10, 0).toISOString(), end_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10, 11, 0).toISOString(), property_id: prop5.id, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Fire alarm test — all properties', event_type: 'custom', start_at: new Date(now.getFullYear(), now.getMonth() + 1, 5, 9, 0).toISOString(), all_day: true, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'Quarterly review — Michael Brennan', event_type: 'contact_followup', start_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 20, 15, 0).toISOString(), end_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 20, 16, 0).toISOString(), contact_id: contacts.find((c: { full_name: string }) => c.full_name === 'Michael Brennan')?.id ?? null, demo: true, created_by: userId },
    { workspace_id: workspaceId, title: 'R2R deal meeting — Sarah Whitfield', event_type: 'contact_followup', start_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 11, 0).toISOString(), end_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 12, 0).toISOString(), contact_id: contacts.find((c: { full_name: string }) => c.full_name === 'Sarah Whitfield')?.id ?? null, demo: true, created_by: userId },
  ])

  // ============================================================
  // 24. COMPLIANCE CERTIFICATES (6)
  // ============================================================

  await safeInsert(supabase, 'compliance_certificates', [
    { workspace_id: workspaceId, certificate_type: 'EPC', property_id: prop1.id, issuer_name: 'EPC Assessors Ltd', status: 'valid', issue_date: monthsAgo(24), expiry_date: daysFromNow(360), reference_number: 'EPC-BHM-001', risk_level: 'low', notes: 'EPC Rating C. Valid for 10 years.', created_by: userId },
    { workspace_id: workspaceId, certificate_type: 'EPC', property_id: prop2.id, issuer_name: 'EnviroCheck Ltd', status: 'expiring_soon', issue_date: monthsAgo(116), expiry_date: daysFromNow(45), reference_number: 'EPC-BHM-002', risk_level: 'medium', notes: 'EPC Rating D. Due for renewal.', created_by: userId },
    { workspace_id: workspaceId, certificate_type: 'Gas Safety Certificate', property_id: prop1.id, supplier_contact_id: supplier1.id, issuer_name: 'DPM Maintenance Ltd', status: 'valid', issue_date: daysAgo(10), expiry_date: daysFromNow(355), reference_number: 'GSC-SYC-001', risk_level: 'low', created_by: userId },
    { workspace_id: workspaceId, certificate_type: 'Gas Safety Certificate', property_id: prop3.id, supplier_contact_id: supplier1.id, issuer_name: 'DPM Maintenance Ltd', status: 'expiring_soon', issue_date: monthsAgo(11), expiry_date: daysFromNow(30), reference_number: 'GSC-BFL-001', risk_level: 'medium', notes: 'Book renewal urgently.', created_by: userId },
    { workspace_id: workspaceId, certificate_type: 'EICR', property_id: prop2.id, supplier_contact_id: supplier3.id, issuer_name: 'BW Electrical Services', status: 'valid', issue_date: monthsAgo(18), expiry_date: daysFromNow(720), reference_number: 'EICR-HAW-001', risk_level: 'low', created_by: userId },
    { workspace_id: workspaceId, certificate_type: 'Fire Safety Certificate', property_id: prop1.id, issuer_name: 'Birmingham Fire Safety', status: 'expired', issue_date: monthsAgo(14), expiry_date: daysAgo(30), reference_number: 'FSC-SYC-001', risk_level: 'high', notes: 'URGENT: Certificate expired. Renew immediately.', created_by: userId },
  ])

  // ============================================================
  // 25. COMPLIANCE INSPECTIONS (4)
  // ============================================================

  await safeInsert(supabase, 'compliance_inspections', [
    { workspace_id: workspaceId, inspection_type: 'routine', property_id: prop1.id, inspector_name: 'Internal check', status: 'completed', scheduled_at: tsDaysAgo(30), completed_at: tsDaysAgo(30), outcome: 'satisfactory', risk_level: 'low', notes: 'All rooms checked. No issues found.', created_by: userId },
    { workspace_id: workspaceId, inspection_type: 'routine', property_id: prop3.id, inspector_name: 'Internal check', status: 'completed', scheduled_at: tsDaysAgo(14), completed_at: tsDaysAgo(14), outcome: 'satisfactory', risk_level: 'low', notes: 'All rooms checked. Minor damp noted in Room 2 — monitoring.', created_by: userId },
    { workspace_id: workspaceId, inspection_type: 'checkout', property_id: prop2.id, inspector_name: 'TBC', status: 'scheduled', scheduled_at: isoDateFromNow(25, 10), risk_level: 'needs_data', notes: 'Check-out inspection for Sophie Clarke.', created_by: userId },
    { workspace_id: workspaceId, inspection_type: 'pre_tenancy', property_id: prop5.id, inspector_name: 'Internal check', status: 'scheduled', scheduled_at: isoDateFromNow(10, 10), risk_level: 'needs_data', notes: 'Pre-tenancy inspection before re-letting Chestnut Drive.', created_by: userId },
  ])

  // ============================================================
  // 26. DOCUMENTS (5)
  // ============================================================

  await safeInsert(supabase, 'documents', [
    { workspace_id: workspaceId, name: 'AST — James Thornton (Room 1)', category: 'tenancy_agreement', property_id: prop1.id, contact_id: tenant1.id, file_url: null, file_path: null, mime_type: 'application/pdf', demo: true, uploaded_by: userId },
    { workspace_id: workspaceId, name: 'AST — Sophie Clarke (88 Hawthorn Street)', category: 'tenancy_agreement', property_id: prop2.id, contact_id: tenant4.id, file_url: null, file_path: null, mime_type: 'application/pdf', demo: true, uploaded_by: userId },
    { workspace_id: workspaceId, name: 'Right to Rent Check — Amara Mensah', category: 'right_to_rent', property_id: prop1.id, contact_id: tenant2.id, file_url: null, file_path: null, mime_type: 'application/pdf', demo: true, uploaded_by: userId },
    { workspace_id: workspaceId, name: 'Passport Copy — Oliver Shaw', category: 'id_document', contact_id: tenant3.id, file_url: null, file_path: null, mime_type: 'image/jpeg', demo: true, uploaded_by: userId },
    { workspace_id: workspaceId, name: 'Gas Safety Record — 42 Sycamore Road', category: 'compliance_certificate', property_id: prop1.id, file_url: null, file_path: null, mime_type: 'application/pdf', demo: true, uploaded_by: userId },
  ])

  // ============================================================
  // 27. PROPERTY VIEWINGS (4) — via leasing module
  // ============================================================

  // Create a vacancy first
  const vacancies = await safeInsert(supabase, 'property_vacancies', [
    { workspace_id: workspaceId, property_id: prop1.id, title: 'Room 4 — En-Suite Double, Birmingham B12', description: 'Spacious double room with en-suite, all bills included. Near city centre.', asking_rent: 575, deposit_amount: 575, available_from: daysAgo(14), bedrooms: 1, bathrooms: 0, furnished: 'furnished', status: 'active' },
  ])
  const vacancy1 = vacancies[0]

  // Prospects
  const prospects = await safeInsert(supabase, 'prospects', [
    { workspace_id: workspaceId, vacancy_id: vacancy1?.id ?? null, first_name: 'Liam', last_name: 'O\'Brien', email: 'liam.obrien@gmail.com', phone: '07888 001122', source: 'SpareRoom', move_in_date: daysFromNow(14), budget_min: 500, budget_max: 600, status: 'viewing_scheduled' },
    { workspace_id: workspaceId, vacancy_id: vacancy1?.id ?? null, first_name: 'Fatima', last_name: 'Al-Hassan', email: 'f.alhassan@outlook.com', phone: '07888 334455', source: 'Rightmove', move_in_date: daysFromNow(21), budget_min: 550, budget_max: 620, status: 'viewing_done' },
    { workspace_id: workspaceId, vacancy_id: vacancy1?.id ?? null, first_name: 'Tom', last_name: 'Bradley', email: 't.bradley@yahoo.co.uk', phone: '07888 556677', source: 'SpareRoom', move_in_date: daysFromNow(10), budget_min: 525, budget_max: 575, status: 'new' },
  ])

  // Viewings
  if (prospects.length >= 2) {
    await safeInsert(supabase, 'viewings', [
      { workspace_id: workspaceId, vacancy_id: vacancy1?.id ?? null, prospect_id: prospects[0].id, scheduled_at: isoDateFromNow(4, 18), duration_minutes: 30, status: 'scheduled' },
      { workspace_id: workspaceId, vacancy_id: vacancy1?.id ?? null, prospect_id: prospects[1].id, scheduled_at: isoDateFromNow(-3, 11), duration_minutes: 30, status: 'completed', feedback: 'Loved the room. Wants to proceed.', outcome: 'interested' },
      { workspace_id: workspaceId, vacancy_id: vacancy1?.id ?? null, prospect_id: prospects[1].id, scheduled_at: isoDateFromNow(-10, 14), duration_minutes: 30, status: 'no_show', outcome: null },
      { workspace_id: workspaceId, vacancy_id: vacancy1?.id ?? null, prospect_id: prospects[0].id, scheduled_at: isoDateFromNow(11, 18, 30), duration_minutes: 30, status: 'scheduled' },
    ])
  }

  // ============================================================
  // 28. TENANCY AGREEMENT (for /sign page)
  // ============================================================

  const agreementToken = crypto.randomUUID()
  const agreements = await safeInsert(supabase, 'tenancy_agreements', [{
    workspace_id: workspaceId,
    tenancy_id: tenancy1?.id ?? null,
    title: 'Assured Shorthold Tenancy Agreement — Room 1, 42 Sycamore Road',
    status: 'sent',
    document_html: `<h1>Assured Shorthold Tenancy Agreement</h1><p>This agreement is between <strong>Propvora Ltd</strong> (Landlord) and <strong>James Thornton</strong> (Tenant) for Room 1, 42 Sycamore Road, Birmingham B12 0PQ.</p><p>Monthly rent: £550. Deposit: £550 (protected with DPS). Tenancy start date: ${monthsAgo(14)}. Initial term: 12 months.</p><h2>Terms</h2><ul><li>Rent is due on the 1st of each month.</li><li>No smoking on the premises.</li><li>Tenant is responsible for keeping their room clean and tidy.</li><li>24 hours notice required for landlord access (except emergency).</li></ul>`,
    signing_deadline: isoDateFromNow(14),
    created_by: userId,
  }])

  if (agreements[0]) {
    await safeInsert(supabase, 'agreement_signatories', [{
      workspace_id: workspaceId,
      agreement_id: agreements[0].id,
      contact_id: tenant1.id,
      email: 'j.thornton@gmail.com',
      name: 'James Thornton',
      role: 'tenant',
      signing_token: agreementToken,
      signing_order: 1,
    }])
  }

  // ============================================================
  // 29. POSSESSION CASES / LEGAL MATTERS (2)
  // ============================================================

  await safeInsert(supabase, 'possession_cases', [
    { workspace_id: workspaceId, tenancy_id: tenancy4?.id ?? (tenancies[3]?.id ?? tenancies[0]?.id), property_id: prop2.id, contact_id: tenant4.id, ground: 'Ground 8 — At least 8 weeks rent arrears (Section 8)', arrears_amount: 1050, arrears_weeks: 4.3, status: 'gathering_evidence', notes: 'Sophie Clarke has not paid rent for 6+ weeks. Gathering evidence for Section 8 notice.', created_by: userId },
    { workspace_id: workspaceId, tenancy_id: tenancy1?.id ?? tenancies[0]?.id, property_id: prop1.id, contact_id: tenant3.id, ground: 'Section 21 — No Fault Possession', arrears_amount: 275, arrears_weeks: 0.5, status: 'notice_draft', notice_served_date: null, notice_expiry_date: daysFromNow(62), notes: 'Oliver Shaw — persistent late payment. Preparing Section 21 as contingency.', created_by: userId },
  ])

  // ============================================================
  // 30. NOTIFICATIONS (8)
  // ============================================================

  await safeInsert(supabase, 'notifications', [
    { workspace_id: workspaceId, user_id: userId, title: 'Rent overdue — Sophie Clarke', body: 'Rent for 88 Hawthorn Street is 45 days overdue (£1,050). Immediate action required.', type: 'warning', resource_type: 'tenancy', resource_id: tenancy4?.id ?? null, read_at: null },
    { workspace_id: workspaceId, user_id: userId, title: 'Certificate expiring soon — Gas Safety (22 Birchfield)', body: 'Gas Safety Certificate at 22 Birchfield Lane expires in 30 days. Book inspection with Dave Patel.', type: 'warning', resource_type: 'compliance_certificate', read_at: null },
    { workspace_id: workspaceId, user_id: userId, title: 'Fire Safety Certificate expired — 42 Sycamore Road', body: 'The Fire Safety Certificate at 42 Sycamore Road expired 30 days ago. Urgent renewal required.', type: 'error', resource_type: 'compliance_certificate', read_at: null },
    { workspace_id: workspaceId, user_id: userId, title: 'New viewing request — Room 4 Sycamore Road', body: 'Liam O\'Brien has requested a viewing of Room 4. Confirm the appointment.', type: 'task', read_at: tsDaysAgo(1) },
    { workspace_id: workspaceId, user_id: userId, title: 'Invoice paid — INV-2024-002', body: 'CleanBright Services invoice (£80) has been marked as paid.', type: 'success', resource_type: 'invoice', read_at: tsDaysAgo(3) },
    { workspace_id: workspaceId, user_id: userId, title: 'HMO licence renewal — 45 days remaining', body: 'The HMO licence for 42 Sycamore Road expires in 45 days. Submit renewal to Birmingham City Council.', type: 'warning', resource_type: 'property', resource_id: prop1.id, read_at: null },
    { workspace_id: workspaceId, user_id: userId, title: 'Deposit return due — 15 Chestnut Drive', body: 'Deposit for the ended tenancy at 15 Chestnut Drive is overdue for return (14 days past move-out).', type: 'warning', read_at: null },
    { workspace_id: workspaceId, user_id: userId, title: 'AI insight: Room 4 vacancy costing £575/month', body: 'Propvora AI detected that Room 4 has been vacant for 14 days, representing £287.50 in missed income so far.', type: 'ai', read_at: tsDaysAgo(2) },
  ])

  // ============================================================
  // 31. CONVERSATIONS & MESSAGES
  // ============================================================

  const conv1Res = await safeInsert(supabase, 'conversations', [{
    workspace_id: workspaceId, contact_id: tenant1.id, subject: 'Room 1 maintenance request', last_message_at: tsDaysAgo(2), unread_count: 1, demo: true,
  }])

  if (conv1Res[0]) {
    await safeInsert(supabase, 'messages', [
      { conversation_id: conv1Res[0].id, workspace_id: workspaceId, sender_type: 'contact', body: 'Hi, the shower pressure in Room 1 has been quite low for the past few days. Could someone take a look?', demo: true, created_at: tsDaysAgo(5) },
      { conversation_id: conv1Res[0].id, workspace_id: workspaceId, sender_id: userId, sender_type: 'user', body: "Hi James, thanks for letting me know. I'll get Dave Patel booked in to take a look this week.", demo: true, created_at: tsDaysAgo(4) },
      { conversation_id: conv1Res[0].id, workspace_id: workspaceId, sender_type: 'contact', body: 'Great, thank you! Morning works best for me.', demo: true, created_at: tsDaysAgo(2) },
    ])
  }

  const conv2Res = await safeInsert(supabase, 'conversations', [{
    workspace_id: workspaceId, contact_id: landlord1.id, subject: 'R2R contract renewal — 42 Sycamore Road', last_message_at: tsDaysAgo(7), unread_count: 0, demo: true,
  }])

  if (conv2Res[0]) {
    await safeInsert(supabase, 'messages', [
      { conversation_id: conv2Res[0].id, workspace_id: workspaceId, sender_id: userId, sender_type: 'user', body: "Hi Gerald, I'd like to start the conversation about renewing our R2R arrangement on 42 Sycamore Road. Would you be open to a 3-year extension?", demo: true, created_at: tsDaysAgo(10) },
      { conversation_id: conv2Res[0].id, workspace_id: workspaceId, sender_type: 'contact', body: "Yes, absolutely. I've been happy with the arrangement. Could we meet for coffee next week? I'd want a small rent increase of £50/month.", demo: true, created_at: tsDaysAgo(8) },
      { conversation_id: conv2Res[0].id, workspace_id: workspaceId, sender_id: userId, sender_type: 'user', body: "That sounds reasonable. I can do Tuesday or Wednesday afternoon. What suits you?", demo: true, created_at: tsDaysAgo(7) },
    ])
  }

  // ============================================================
  // 32. AI CHAT THREAD
  // ============================================================

  const aiThreadRes = await safeInsert(supabase, 'ai_chat_threads', [{
    workspace_id: workspaceId, user_id: userId, title: 'Portfolio performance review', context_route: '/app/dashboard',
  }])

  if (aiThreadRes[0]) {
    await safeInsert(supabase, 'ai_chat_messages', [
      { thread_id: aiThreadRes[0].id, workspace_id: workspaceId, role: 'user', content: 'How is my portfolio performing this month? What are the key numbers I should focus on?' },
      { thread_id: aiThreadRes[0].id, workspace_id: workspaceId, role: 'assistant', content: "Based on your portfolio data, here's a summary of this month's performance:\n\n**Income:** Your total collected rent across active properties is approximately £4,850 this month. The 42 Sycamore Road HMO is generating £1,600 from 3 occupied rooms, with Room 4 currently vacant — filling that room would add £575/month.\n\n**Key focus areas:**\n1. **Room 4 vacancy** at Sycamore Road is your biggest quick win — advertise immediately.\n2. **Invoice INV-2024-007** (£1,100 to Patricia Okafor) is overdue — chase this today.\n3. **Sophie Clarke's tenancy** ends in 60 days — start re-let activity now to avoid void.\n\n**Upcoming compliance:** HMO licence renewal for 42 Sycamore Road is due in 45 days. This should be your top priority this week." },
      { thread_id: aiThreadRes[0].id, workspace_id: workspaceId, role: 'user', content: "What's my total exposure if all my properties went vacant at the same time?" },
      { thread_id: aiThreadRes[0].id, workspace_id: workspaceId, role: 'assistant', content: "In a worst-case full vacancy scenario, your monthly landlord rent obligations across active R2R properties would be approximately **£3,250/month**.\n\nMost of your R2R contracts include a break clause, so if a property proved unviable, you'd have an exit mechanism — though I'd recommend reviewing those terms with your solicitor.\n\n**My recommendation:** Maintain a cash reserve of at least 3 months' landlord rents (~£9,750) as a contingency buffer." },
    ])
  }

  // ============================================================
  // 33. AFFILIATE DATA
  // ============================================================

  const affiliateRes = await safeInsert(supabase, 'affiliates', [{
    user_id: userId, code: 'PROPVORA-DEMO', status: 'active', commission_rate: 0.20, payout_email: 'jamahlthomas1996@gmail.com', notes: 'Demo affiliate account', approved_at: tsMonthsAgo(3),
  }])

  if (affiliateRes[0]) {
    const affiliateId = affiliateRes[0].id
    const referrals = await safeInsert(supabase, 'affiliate_referrals', [
      { affiliate_id: affiliateId, referred_user_id: null, workspace_id: null, status: 'converted', converted_at: tsMonthsAgo(2) },
      { affiliate_id: affiliateId, referred_user_id: null, workspace_id: null, status: 'trial' },
      { affiliate_id: affiliateId, referred_user_id: null, workspace_id: null, status: 'signed_up' },
    ])

    if (referrals.length >= 2) {
      await safeInsert(supabase, 'affiliate_commissions', [
        { affiliate_id: affiliateId, referral_id: referrals[0].id, amount: 120, currency: 'GBP', period_start: monthsAgo(3), period_end: monthsAgo(2), status: 'paid', approved_at: tsMonthsAgo(2), paid_at: tsMonthsAgo(1) },
        { affiliate_id: affiliateId, referral_id: referrals[1].id, amount: 50, currency: 'GBP', period_start: monthsAgo(1), period_end: daysAgo(1), status: 'approved', approved_at: tsDaysAgo(5) },
      ])
    }
  }

  // ============================================================
  // 34. ACTIVITY LOGS (15)
  // ============================================================

  await safeInsert(supabase, 'activity_logs', [
    { workspace_id: workspaceId, user_id: userId, action: 'property_created', description: 'Added 42 Sycamore Road to the portfolio', resource_type: 'property', resource_id: prop1.id, demo: true, created_at: tsDaysAgo(30) },
    { workspace_id: workspaceId, user_id: userId, action: 'property_created', description: 'Added 88 Hawthorn Street to the portfolio', resource_type: 'property', resource_id: prop2.id, demo: true, created_at: tsDaysAgo(29) },
    { workspace_id: workspaceId, user_id: userId, action: 'tenancy_started', description: 'James Thornton tenancy started at Room 1, 42 Sycamore Road', resource_type: 'tenancy', resource_id: tenancies[0]?.id ?? null, demo: true, created_at: tsDaysAgo(28) },
    { workspace_id: workspaceId, user_id: userId, action: 'contact_created', description: 'Added Gerald Ashworth as a landlord contact', resource_type: 'contact', resource_id: landlord1.id, demo: true, created_at: tsDaysAgo(27) },
    { workspace_id: workspaceId, user_id: userId, action: 'job_created', description: 'Raised JOB-001: Shower replacement Room 3', resource_type: 'job', resource_id: job1?.id ?? null, demo: true, created_at: tsDaysAgo(25) },
    { workspace_id: workspaceId, user_id: userId, action: 'job_completed', description: 'JOB-001 completed: Shower replaced in Room 3', resource_type: 'job', resource_id: job1?.id ?? null, demo: true, created_at: tsDaysAgo(22) },
    { workspace_id: workspaceId, user_id: userId, action: 'invoice_sent', description: 'INV-2024-003 sent to Dave Patel for hallway redecoration', resource_type: 'invoice', demo: true, created_at: tsDaysAgo(20) },
    { workspace_id: workspaceId, user_id: userId, action: 'certificate_uploaded', description: 'Gas Safety Certificate uploaded for 42 Sycamore Road', resource_type: 'document', resource_id: prop1.id, demo: true, created_at: tsDaysAgo(18) },
    { workspace_id: workspaceId, user_id: userId, action: 'tenancy_started', description: 'Kwame Asante tenancy started at 22 Birchfield Lane', resource_type: 'tenancy', resource_id: tenancies[4]?.id ?? null, demo: true, created_at: tsDaysAgo(15) },
    { workspace_id: workspaceId, user_id: userId, action: 'task_completed', description: 'Completed: Send deposit prescribed information — AST-005', resource_type: 'task', demo: true, created_at: tsDaysAgo(14) },
    { workspace_id: workspaceId, user_id: userId, action: 'property_created', description: 'Added 15 Chestnut Drive — vacant, refurb required', resource_type: 'property', resource_id: prop5.id, demo: true, created_at: tsDaysAgo(12) },
    { workspace_id: workspaceId, user_id: userId, action: 'planning_set_created', description: 'Created deal analysis: SA Feasibility — 7 Redwood Avenue', resource_type: 'planning_set', resource_id: ps3?.id ?? null, demo: true, created_at: tsDaysAgo(10) },
    { workspace_id: workspaceId, user_id: userId, action: 'member_invited', description: 'Invited team member to workspace', resource_type: 'workspace_member', demo: true, created_at: tsDaysAgo(8) },
    { workspace_id: workspaceId, user_id: userId, action: 'invoice_paid', description: 'INV-2024-002 marked as paid — CleanBright Services', resource_type: 'invoice', demo: true, created_at: tsDaysAgo(5) },
    { workspace_id: workspaceId, user_id: userId, action: 'compliance_alert', description: 'Fire Safety Certificate at 42 Sycamore Road has expired', resource_type: 'compliance_certificate', resource_id: prop1.id, demo: true, created_at: tsDaysAgo(2) },
  ])

  // ============================================================
  // 35. MARK WORKSPACE AS SEEDED
  // ============================================================

  await supabase
    .from('workspaces')
    .update({ demo_data_loaded: true, demo_data_variant: _variant })
    .eq('id', workspaceId)
}
