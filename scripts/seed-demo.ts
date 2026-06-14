/**
 * Propvora — Demo Data Seed Script
 *
 * Seeds a fully-populated demo workspace with realistic UK property
 * management data. All rows carry is_demo = true.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/seed-demo.ts
 *
 * Required env vars (set in .env.local or export before running):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * The script will:
 *   1. Create a demo workspace (no real auth user required)
 *   2. Seed 3 properties, 6 units, 3 tenancies, 5 tasks, 3 jobs,
 *      4 invoices, 2 compliance certificates, contacts, and more.
 *   3. Print a summary of every inserted row count.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local from the project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') })
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

// ---------------------------------------------------------------------------
// Supabase admin client (bypasses RLS)
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '[seed-demo] ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.\n' +
    'Copy .env.example to .env.local and fill in your Supabase credentials.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helper: insert rows and return them, throwing on error
// ---------------------------------------------------------------------------

async function insert<T extends object>(
  table: string,
  rows: T[]
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .insert(rows as any)
    .select()

  if (error) {
    throw new Error(`[seed-demo] Insert into ${table} failed: ${error.message}`)
  }
  return (data ?? []) as T[]
}

async function insertOne<T extends object>(
  table: string,
  row: T
): Promise<T> {
  const results = await insert<T>(table, [row])
  return results[0]
}

// ---------------------------------------------------------------------------
// Main seeder
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('[seed-demo] Starting Propvora demo data seed...\n')

  const counts: Record<string, number> = {}

  // =========================================================================
  // 1. DEMO WORKSPACE
  // =========================================================================
  // We insert directly into workspaces without a real auth user.
  // owner_id is set to a deterministic nil-ish UUID so the FK doesn't break.
  // If your schema requires a real profiles row, create one first.

  const DEMO_OWNER_ID = '00000000-0000-0000-0000-000000000001'

  // Upsert a placeholder profile so the FK on workspaces.owner_id is satisfied.
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert(
      {
        id: DEMO_OWNER_ID,
        email: 'demo@propvora.com',
        full_name: 'Demo Account',
        role: 'user',
        onboarding_completed: true,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )

  if (profileErr) {
    console.warn(`[seed-demo] Could not upsert demo profile (may already exist): ${profileErr.message}`)
  }

  const workspace = await insertOne('workspaces', {
    name: 'Propvora Demo Portfolio',
    slug: `demo-portfolio-${Date.now()}`,
    owner_id: DEMO_OWNER_ID,
    plan: 'pro',
    plan_status: 'active',
    demo_data_loaded: true,
    demo_data_variant: 'full',
    settings: {},
  } as any)

  const workspaceId: string = (workspace as any).id
  counts['workspaces'] = 1
  console.log(`[seed-demo] Workspace created: ${workspaceId}`)

  const userId = DEMO_OWNER_ID

  // =========================================================================
  // 2. CONTACTS
  // =========================================================================

  const contactRows = [
    // Landlords
    { workspace_id: workspaceId, contact_type: 'landlord', full_name: 'Gerald Ashworth', email: 'g.ashworth@email.co.uk', phone: '07711 234567', address_line1: '14 Maple Grove', city: 'Birmingham', postcode: 'B15 2TH', notes: 'Prefers email. 3 properties with us.', tags: ['portfolio', 'long-term'], status: 'active', is_demo: true, created_by: userId },
    { workspace_id: workspaceId, contact_type: 'landlord', full_name: 'Patricia Okafor', email: 'p.okafor@propmail.co.uk', phone: '07833 456789', company_name: 'Okafor Properties Ltd', address_line1: '7 Elmwood Close', city: 'Wolverhampton', postcode: 'WV3 7RB', notes: 'Portfolio landlord. R2R arrangement.', tags: ['vip', 'portfolio'], status: 'active', is_demo: true, created_by: userId },
    // Tenants
    { workspace_id: workspaceId, contact_type: 'tenant', full_name: 'James Thornton', email: 'j.thornton@gmail.com', phone: '07900 111222', address_line1: 'Room 1, 42 Sycamore Road', city: 'Birmingham', postcode: 'B12 0PQ', notes: 'Long-term tenant. Always pays on time.', tags: ['reliable'], status: 'active', is_demo: true, created_by: userId },
    { workspace_id: workspaceId, contact_type: 'tenant', full_name: 'Amara Mensah', email: 'amara.mensah@outlook.com', phone: '07900 333444', address_line1: 'Room 2, 42 Sycamore Road', city: 'Birmingham', postcode: 'B12 0PQ', notes: null, tags: [], status: 'active', is_demo: true, created_by: userId },
    { workspace_id: workspaceId, contact_type: 'tenant', full_name: 'Sophie Clarke', email: 's.clarke@gmail.com', phone: '07911 777888', address_line1: 'Flat 2, 88 Hawthorn Street', city: 'Birmingham', postcode: 'B6 4EF', notes: 'Working professional. 12-month AST.', tags: [], status: 'active', is_demo: true, created_by: userId },
    { workspace_id: workspaceId, contact_type: 'tenant', full_name: 'Kwame Asante', email: 'k.asante@btinternet.com', phone: '07922 999000', address_line1: 'Room 4, 22 Birchfield Lane', city: 'Wolverhampton', postcode: 'WV2 1AB', notes: null, tags: [], status: 'active', is_demo: true, created_by: userId },
    // Suppliers
    { workspace_id: workspaceId, contact_type: 'supplier', full_name: 'Dave Patel', email: 'dave@dpm-maintenance.co.uk', phone: '07700 100200', company_name: 'DPM Maintenance Ltd', address_line1: '3 Industrial Way', city: 'Birmingham', postcode: 'B8 2RT', notes: 'Trusted maintenance contractor. Quick turnaround.', tags: ['preferred', 'plumbing', 'general'], status: 'active', is_demo: true, created_by: userId },
    { workspace_id: workspaceId, contact_type: 'supplier', full_name: 'Rajesh Kapoor', email: 'r.kapoor@bwelectric.co.uk', phone: '07700 500600', company_name: 'BW Electrical Services', address_line1: '17 Commerce Park', city: 'Walsall', postcode: 'WS1 3RD', notes: 'Certified electrician. Good portfolio rates.', tags: ['electrical', 'NICEIC'], status: 'active', is_demo: true, created_by: userId },
  ]

  const contacts = await insert('contacts', contactRows)
  counts['contacts'] = contacts.length

  const byName = (name: string) => (contacts as any[]).find((c) => c.full_name === name)
  const landlord1 = byName('Gerald Ashworth')
  const landlord2 = byName('Patricia Okafor')
  const tenant1   = byName('James Thornton')
  const tenant2   = byName('Amara Mensah')
  const tenant3   = byName('Sophie Clarke')
  const tenant4   = byName('Kwame Asante')
  const supplier1 = byName('Dave Patel')
  const supplier2 = byName('Rajesh Kapoor')

  // =========================================================================
  // 3. PROPERTIES (3)
  // =========================================================================

  // Future deadline dates (ISO date) so the calendar surfaces real legal deadlines.
  const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

  const propertyRows = [
    {
      workspace_id: workspaceId,
      name: '42 Sycamore Road',
      address_line1: '42 Sycamore Road',
      city: 'Birmingham',
      county: 'West Midlands',
      postcode: 'B12 0PQ',
      country: 'GB',
      property_type: 'hmo',
      operation_profile: 'hmo',
      status: 'active',
      bedrooms: 5,
      bathrooms: 2,
      floor_area_sqm: 148,
      target_rent: 2750,
      hmo_licence_expiry: inDays(95),
      epc_expiry: inDays(280),
      notes: '5-bed HMO. R2R with Gerald Ashworth. Fully licenced.',
      is_demo: true,
      created_by: userId,
    },
    {
      workspace_id: workspaceId,
      name: '88 Hawthorn Street',
      address_line1: '88 Hawthorn Street',
      city: 'Birmingham',
      county: 'West Midlands',
      postcode: 'B6 4EF',
      country: 'GB',
      property_type: 'flat',
      operation_profile: 'rent_to_rent',
      status: 'active',
      bedrooms: 2,
      bathrooms: 1,
      floor_area_sqm: 68,
      target_rent: 1050,
      epc_expiry: inDays(45),
      notes: 'Ground-floor flat. Good transport links.',
      is_demo: true,
      created_by: userId,
    },
    {
      workspace_id: workspaceId,
      name: '22 Birchfield Lane',
      address_line1: '22 Birchfield Lane',
      city: 'Wolverhampton',
      county: 'West Midlands',
      postcode: 'WV2 1AB',
      country: 'GB',
      property_type: 'hmo',
      operation_profile: 'hmo',
      status: 'active',
      bedrooms: 4,
      bathrooms: 2,
      floor_area_sqm: 120,
      target_rent: 2200,
      hmo_licence_expiry: inDays(160),
      epc_expiry: inDays(210),
      notes: '4-bed HMO. R2R with Patricia Okafor.',
      is_demo: true,
      created_by: userId,
    },
  ]

  const properties = await insert('properties', propertyRows)
  counts['properties'] = properties.length

  const prop1 = (properties as any[]).find((p) => p.name === '42 Sycamore Road')
  const prop2 = (properties as any[]).find((p) => p.name === '88 Hawthorn Street')
  const prop3 = (properties as any[]).find((p) => p.name === '22 Birchfield Lane')

  // =========================================================================
  // 4. PROPERTY UNITS (6)
  // =========================================================================

  const unitRows = [
    // 42 Sycamore Road — 3 rooms
    { workspace_id: workspaceId, property_id: prop1.id, unit_name: 'Room 1', unit_type: 'room', floor: 0, bedrooms: 1, bathrooms: 0, target_rent: 550, status: 'occupied', is_demo: true },
    { workspace_id: workspaceId, property_id: prop1.id, unit_name: 'Room 2', unit_type: 'room', floor: 0, bedrooms: 1, bathrooms: 0, target_rent: 500, status: 'occupied', is_demo: true },
    { workspace_id: workspaceId, property_id: prop1.id, unit_name: 'Room 3 (En-suite)', unit_type: 'room', floor: 1, bedrooms: 1, bathrooms: 1, target_rent: 600, status: 'occupied', is_demo: true },
    // 88 Hawthorn Street — 1 flat
    { workspace_id: workspaceId, property_id: prop2.id, unit_name: 'Flat 2', unit_type: 'flat', floor: 0, bedrooms: 2, bathrooms: 1, target_rent: 1050, status: 'occupied', is_demo: true },
    // 22 Birchfield Lane — 2 rooms
    { workspace_id: workspaceId, property_id: prop3.id, unit_name: 'Room 1', unit_type: 'room', floor: 0, bedrooms: 1, bathrooms: 0, target_rent: 525, status: 'occupied', is_demo: true },
    { workspace_id: workspaceId, property_id: prop3.id, unit_name: 'Room 2', unit_type: 'room', floor: 1, bedrooms: 1, bathrooms: 0, target_rent: 550, status: 'occupied', is_demo: true },
  ]

  const units = await insert('property_units', unitRows)
  counts['property_units'] = units.length

  const unit1 = (units as any[]).find((u) => u.property_id === prop1.id && u.unit_name === 'Room 1')
  const unit2 = (units as any[]).find((u) => u.property_id === prop1.id && u.unit_name === 'Room 2')
  const unit3 = (units as any[]).find((u) => u.property_id === prop1.id && u.unit_name === 'Room 3 (En-suite)')
  const unit4 = (units as any[]).find((u) => u.property_id === prop2.id)
  const unit5 = (units as any[]).find((u) => u.property_id === prop3.id && u.unit_name === 'Room 1')
  const unit6 = (units as any[]).find((u) => u.property_id === prop3.id && u.unit_name === 'Room 2')

  // =========================================================================
  // 5. TENANCIES (3)
  // =========================================================================

  const tenancyRows = [
    {
      workspace_id: workspaceId,
      property_id: prop1.id,
      unit_id: unit1.id,
      tenant_contact_id: tenant1.id,
      start_date: monthsAgo(14),
      end_date: daysFromNow(120),
      rent_amount: 550,
      deposit_amount: 550,
      deposit_held_by: 'scheme',
      deposit_scheme: 'DPS',
      rent_frequency: 'monthly',
      status: 'active',
      tenancy_type: 'hmo_room',
      reference: 'AST-001',
      is_demo: true,
    },
    {
      workspace_id: workspaceId,
      property_id: prop2.id,
      unit_id: unit4.id,
      tenant_contact_id: tenant3.id,
      start_date: monthsAgo(10),
      end_date: daysFromNow(60),
      rent_amount: 1050,
      deposit_amount: 1050,
      deposit_held_by: 'scheme',
      deposit_scheme: 'MyDeposits',
      rent_frequency: 'monthly',
      status: 'active',
      tenancy_type: 'ast',
      reference: 'AST-004',
      is_demo: true,
    },
    {
      workspace_id: workspaceId,
      property_id: prop3.id,
      unit_id: unit5.id,
      tenant_contact_id: tenant4.id,
      start_date: monthsAgo(5),
      end_date: daysFromNow(210),
      rent_amount: 525,
      deposit_amount: 525,
      deposit_held_by: 'scheme',
      deposit_scheme: 'DPS',
      rent_frequency: 'monthly',
      status: 'active',
      tenancy_type: 'hmo_room',
      reference: 'AST-005',
      is_demo: true,
    },
  ]

  const tenancies = await insert('tenancies', tenancyRows)
  counts['tenancies'] = tenancies.length

  // =========================================================================
  // 5b. RENT SCHEDULES (rent payments — surfaced on the calendar as Money)
  // =========================================================================
  const rentScheduleRows = (tenancies as any[]).flatMap((tn) => {
    const amt = Number(tn.rent_amount ?? 0)
    return [
      { workspace_id: workspaceId, tenancy_id: tn.id, due_date: inDays(-30), amount_due: amt, amount_paid: amt, status: 'paid' },
      { workspace_id: workspaceId, tenancy_id: tn.id, due_date: inDays(2),   amount_due: amt, amount_paid: 0,   status: 'due' },
      { workspace_id: workspaceId, tenancy_id: tn.id, due_date: inDays(32),  amount_due: amt, amount_paid: 0,   status: 'due' },
    ]
  })
  const rentSchedules = await insert('rent_schedules', rentScheduleRows)
  counts['rent_schedules'] = rentSchedules.length

  // =========================================================================
  // 5c. PPM PLANS (planned preventive maintenance — surfaced as Work)
  // =========================================================================
  const ppmRows = [
    { workspace_id: workspaceId, name: 'Annual gas safety check', category: 'gas', status: 'active', frequency: 'annual', property_id: prop1.id, next_due_date: inDays(40), is_demo: true, created_by: userId },
    { workspace_id: workspaceId, name: 'Communal area deep clean', category: 'cleaning', status: 'active', frequency: 'quarterly', property_id: prop1.id, next_due_date: inDays(12), is_demo: true, created_by: userId },
    { workspace_id: workspaceId, name: 'Boiler service', category: 'heating', status: 'active', frequency: 'annual', property_id: prop3.id, next_due_date: inDays(70), is_demo: true, created_by: userId },
  ]
  const ppmPlans = await insert('ppm_plans', ppmRows)
  counts['ppm_plans'] = ppmPlans.length

  // =========================================================================
  // 6. TASKS (5)
  // =========================================================================

  const taskRows = [
    {
      workspace_id: workspaceId,
      title: 'Arrange HMO licence renewal — 42 Sycamore Road',
      description: 'HMO licence expires in 90 days. Submit renewal to Birmingham City Council.',
      status: 'in_progress',
      priority: 'urgent',
      category: 'Compliance',
      property_id: prop1.id,
      due_date: daysFromNow(45),
      is_demo: true,
      created_by: userId,
    },
    {
      workspace_id: workspaceId,
      title: 'Gas Safety Certificate — 42 Sycamore Road',
      description: 'Annual GSC due. Book with Dave Patel.',
      status: 'todo',
      priority: 'high',
      category: 'Compliance',
      property_id: prop1.id,
      due_date: daysFromNow(21),
      contact_id: supplier1.id,
      is_demo: true,
      created_by: userId,
    },
    {
      workspace_id: workspaceId,
      title: 'Book end-of-tenancy inspection — 88 Hawthorn Street',
      description: 'Sophie Clarke\'s tenancy ends in 60 days. Book check-out inspection.',
      status: 'todo',
      priority: 'medium',
      category: 'Lettings',
      property_id: prop2.id,
      contact_id: tenant3.id,
      due_date: daysFromNow(30),
      is_demo: true,
      created_by: userId,
    },
    {
      workspace_id: workspaceId,
      title: 'EICR certificate — 22 Birchfield Lane',
      description: 'EICR due before end of year. Get quote from Rajesh Kapoor.',
      status: 'todo',
      priority: 'high',
      category: 'Compliance',
      property_id: prop3.id,
      contact_id: supplier2.id,
      due_date: daysFromNow(90),
      estimated_cost: 280,
      is_demo: true,
      created_by: userId,
    },
    {
      workspace_id: workspaceId,
      title: 'Reply to Patricia Okafor re: rent review',
      description: 'Patricia has requested a rent review discussion for 22 Birchfield Lane.',
      status: 'todo',
      priority: 'medium',
      category: 'Landlord Relations',
      property_id: prop3.id,
      contact_id: landlord2.id,
      due_date: daysFromNow(7),
      is_demo: true,
      created_by: userId,
    },
  ]

  const tasks = await insert('tasks', taskRows)
  counts['tasks'] = tasks.length

  // =========================================================================
  // 7. JOBS (3)
  // =========================================================================

  const jobRows = [
    {
      workspace_id: workspaceId,
      title: 'Replace broken shower — Room 3, 42 Sycamore Road',
      description: 'Electric shower unit failed. Needs full replacement.',
      status: 'complete',
      priority: 'urgent',
      category: 'Plumbing',
      property_id: prop1.id,
      supplier_contact_id: supplier1.id,
      scheduled_date: daysAgo(14),
      completed_date: daysAgo(12),
      quoted_amount: 380,
      approved_amount: 380,
      invoiced_amount: 380,
      reference: 'JOB-001',
      notes: 'Replaced with Triton T80z. Works confirmed by tenant.',
      is_demo: true,
      created_by: userId,
    },
    {
      workspace_id: workspaceId,
      title: 'Boiler service — 22 Birchfield Lane',
      description: 'Annual boiler service and gas safety check combined visit.',
      status: 'scheduled',
      priority: 'high',
      category: 'Plumbing',
      property_id: prop3.id,
      supplier_contact_id: supplier1.id,
      scheduled_date: daysFromNow(7),
      quoted_amount: 180,
      approved_amount: 180,
      reference: 'JOB-004',
      is_demo: true,
      created_by: userId,
    },
    {
      workspace_id: workspaceId,
      title: 'Electrical safety check — 88 Hawthorn Street',
      description: 'Pre-re-let EICR check. NICEIC sign-off required.',
      status: 'quote_received',
      priority: 'high',
      category: 'Electrical',
      property_id: prop2.id,
      supplier_contact_id: supplier2.id,
      quoted_amount: 350,
      reference: 'JOB-007',
      is_demo: true,
      created_by: userId,
    },
  ]

  const jobs = await insert('jobs', jobRows)
  counts['jobs'] = jobs.length

  const job1 = (jobs as any[])[0]

  // =========================================================================
  // 8. INVOICES (4)
  // =========================================================================

  const invoiceRows = [
    {
      workspace_id: workspaceId,
      invoice_number: 'INV-2026-001',
      contact_id: supplier1.id,
      property_id: prop1.id,
      invoice_type: 'supplier',
      issue_date: daysAgo(10),
      due_date: daysFromNow(20),
      subtotal: 380,
      tax_amount: 0,
      total: 380,
      currency: 'GBP',
      status: 'approved',
      notes: 'Shower replacement — Room 3, 42 Sycamore Road',
      is_demo: true,
      created_by: userId,
    },
    {
      workspace_id: workspaceId,
      invoice_number: 'INV-2026-002',
      contact_id: supplier1.id,
      property_id: prop3.id,
      invoice_type: 'supplier',
      issue_date: daysAgo(3),
      due_date: daysFromNow(27),
      subtotal: 180,
      tax_amount: 36,
      total: 216,
      currency: 'GBP',
      status: 'sent',
      notes: 'Annual boiler service — 22 Birchfield Lane',
      is_demo: true,
      created_by: userId,
    },
    {
      workspace_id: workspaceId,
      invoice_number: 'INV-2026-003',
      contact_id: landlord1.id,
      property_id: prop1.id,
      invoice_type: 'outbound',
      issue_date: daysAgo(30),
      due_date: daysAgo(15),
      subtotal: 1600,
      tax_amount: 0,
      total: 1600,
      currency: 'GBP',
      status: 'paid',
      paid_at: new Date(Date.now() - 14 * 86_400_000).toISOString(),
      paid_amount: 1600,
      notes: 'Rent collection — net of management costs',
      is_demo: true,
      created_by: userId,
    },
    {
      workspace_id: workspaceId,
      invoice_number: 'INV-2026-004',
      contact_id: landlord2.id,
      property_id: prop3.id,
      invoice_type: 'outbound',
      issue_date: daysAgo(5),
      due_date: daysFromNow(25),
      subtotal: 1100,
      tax_amount: 0,
      total: 1100,
      currency: 'GBP',
      status: 'overdue',
      notes: 'Monthly landlord rent — 22 Birchfield Lane',
      is_demo: true,
      created_by: userId,
    },
  ]

  const invoices = await insert('invoices', invoiceRows)
  counts['invoices'] = invoices.length

  // =========================================================================
  // 9. COMPLIANCE CERTIFICATES (2)
  // =========================================================================
  // Uses compliance_certificates from 013_compliance_level2.sql
  // (the earlier migration without workspace_id FK constraints on units).

  const certRows = [
    {
      workspace_id: workspaceId,
      certificate_type: 'gas_safety',
      property_id: prop1.id,
      issuer_name: 'DPM Maintenance Ltd',
      supplier_contact_id: supplier1.id,
      status: 'valid',
      issue_date: monthsAgo(11),
      expiry_date: daysFromNow(30),
      reference_number: 'GSC-SYC-2025',
      risk_level: 'low',
      notes: 'Annual gas safety certificate. Due for renewal.',
      created_by: userId,
      is_demo: true,
    } as any,
    {
      workspace_id: workspaceId,
      certificate_type: 'eicr',
      property_id: prop3.id,
      issuer_name: 'BW Electrical Services',
      supplier_contact_id: supplier2.id,
      status: 'valid',
      issue_date: monthsAgo(22),
      expiry_date: daysFromNow(338),
      reference_number: 'EICR-BFL-2024',
      risk_level: 'low',
      notes: 'Electrical installation condition report. Next due in ~12 months.',
      created_by: userId,
      is_demo: true,
    } as any,
  ]

  let certs: any[] = []
  try {
    certs = await insert('compliance_certificates', certRows)
    counts['compliance_certificates'] = certs.length
  } catch (err: any) {
    // Compliance module migrations may not be applied in all environments — warn but don't abort.
    console.warn(`[seed-demo] Skipping compliance_certificates: ${err.message}`)
    counts['compliance_certificates'] = 0
  }

  // =========================================================================
  // 10. MARK WORKSPACE SEEDED
  // =========================================================================

  await supabase
    .from('workspaces')
    .update({ demo_data_loaded: true, demo_data_variant: 'full' })
    .eq('id', workspaceId)

  // =========================================================================
  // Summary
  // =========================================================================

  console.log('\n[seed-demo] ✓ Seed complete!\n')
  console.log('Workspace ID :', workspaceId)
  console.log('Workspace    : Propvora Demo Portfolio\n')
  console.log('Row counts:')
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(30)} ${count}`)
  }
  console.log('\n[seed-demo] Use this workspace ID in the app or Supabase dashboard to inspect demo data.')
}

main().catch((err) => {
  console.error('[seed-demo] Fatal error:', err)
  process.exit(1)
})
