# Propvora Seed Data

This directory contains seed SQL files for development and demo environments.
These are NOT migrations — they contain data only, not structural changes.

---

## Files

### `supplier_demo.sql`

Full supplier demo dataset for development and demo environments.

**Contents:**
- 10 supplier workspace profiles (mix of sole traders and limited companies, UK-realistic)
- 10 trade types: plumber, electrician, general builder, roofer, decorator, gas engineer, locksmith, cleaning, pest control, gardener
- Supplier services for each workspace (pricing models, rates, callout fees)
- 30 supplier jobs (mix of active, completed, disputed, invoiced)
- 20 supplier quotes/requests (new, quoted, won, lost)
- 15 supplier invoices (draft, sent, paid, overdue)
- 10 supplier directory listings with realistic ratings and review counts

All inserts use `ON CONFLICT DO NOTHING` — safe to run multiple times.
All amounts are in pence (bigint) matching the live schema.
Resolves workspace/property FK anchors via subqueries — if no operator workspace exists, the seed exits silently.

**How to run:**

```bash
psql $DATABASE_URL -f supabase/seed/supplier_demo.sql
```

Or via the Supabase CLI:

```bash
supabase db reset --linked
# (reset applies migrations then runs supabase/seed.sql if present)
```

Or directly with the node apply script if you have one:

```bash
node scripts/_apply_migration.mjs supabase/seed/supplier_demo.sql
```

### `accounting_seed.sql`

Accounting / chart of accounts seed data (pre-existing). See file for details.

---

## Customer seed data

There is intentionally no customer seed file. Customer data (bookings, enquiries,
saved listings) is generated through:

1. The `seed_full_demo_workspace()` PostgreSQL function for customer-type workspaces
   (called from onboarding or Settings > Demo data)
2. Real user interaction in the demo environment

This is a product decision: customer data depends on live marketplace listings
existing first and should not be hardcoded.

---

## How to reset supplier demo data

To start fresh:

```sql
-- In psql or Supabase SQL editor:

-- 1. Remove supplier workspace self-listings from directory
DELETE FROM supplier_directory
WHERE name IN (
  'Dave Marsh Plumbing', 'NW Electrical Solutions', 'Hartley General Builders',
  'Peak Roofing Services', 'Colour & Craft Decorators', 'Safeheat Gas Services',
  'City Locksmith Services', 'Pristine Property Cleaning', 'Midlands Pest Control',
  'Green Edge Garden Services'
) AND metadata->>'demo_batch_id' IS NULL;

-- 2. Remove demo supplier workspaces (cascades to profiles, services, etc.)
DELETE FROM workspaces WHERE slug IN (
  'dave-marsh-plumbing-demo',
  'nw-electrical-solutions-demo',
  'hartley-builders-demo',
  'peak-roofing-services-demo',
  'colour-craft-decorators-demo',
  'safeheat-gas-services-demo',
  'city-locksmith-services-demo',
  'pristine-cleaning-demo',
  'midlands-pest-control-demo',
  'green-edge-garden-demo'
);

-- 3. Remove demo jobs (match by title prefix)
DELETE FROM supplier_jobs
WHERE workspace_id = (SELECT id FROM workspaces WHERE type = 'operator' ORDER BY created_at LIMIT 1)
  AND title IN (
    'Fix leaking radiator in rear bedroom',
    'Replace kitchen sink waste trap',
    -- (add remaining titles as needed)
    'EICR — 42 Sycamore Road (5-bed HMO)'
  );
```

Then re-run `supplier_demo.sql` to reseed.
