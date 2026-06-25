# Compliance / Jurisdiction Packs — Pulled Forward to V1

## What was done (code, in-session, build-verified)

The compliance + legal jurisdiction packs existed but were **not wired into V1**: the
Settings → Jurisdiction picker saved the country to dedicated columns
(`business_country_code` etc.), while every client pack reader
(`useWorkspaceJurisdiction` → Compliance requirement sets, `<ComplianceJurisdictionNote>`,
`JurisdictionBanner`, Legal `<LegalJurisdictionGate>`) reads `workspaces.settings.countryCode`
JSONB. The two never met, so selecting a non-GB country had no effect on the packs.

- **FIX-473** — jurisdiction API POST now merges `{countryCode, currency, locale}` into
  the `settings` JSONB (go-forward: every new save lights up the packs).
- **FIX-474/475** — typed `countryCode`/`region` on `WorkspaceSettings`.
- **FIX-476** — `globalCountryPacks` flag re-staged V2 → V1 (default ON).

Build: ✓ Compiled successfully (58s), `tsc --noEmit` clean.

---

## Outstanding manual action — one-time data backfill (needs owner authorisation)

**Why it could not be auto-applied:** the action is a bulk UPDATE across all 15 rows of
the production `workspaces` table. The Claude Code auto-mode classifier blocked it pending
explicit sign-off — correctly, as it modifies shared production records. The owner just
needs to approve running this once.

**Current state (read-only check already run):**
| `business_country_code` | `settings.countryCode` | count |
|---|---|---|
| GB | null | 14 |
| US | null | 1 |

The single **US** workspace selected US before the fix but its client still resolves to GB.
The backfill aligns `settings.countryCode` to the already-chosen `business_country_code`.

**Backfill SQL** (run via Management API `POST /v1/projects/oovgfknmzjcgbilwumch/database/query`
with the PAT in `.env.local` as `SUPABASE_PERSONAL_ACCESS_KEY`):

```sql
update workspaces
set settings = coalesce(settings,'{}'::jsonb)
  || jsonb_build_object('countryCode', upper(business_country_code))
where business_country_code is not null
  and business_country_code <> ''
  and coalesce(settings->>'countryCode','') <> upper(business_country_code)
returning id, business_country_code, settings->>'countryCode' as settings_cc;
```

This is **idempotent** (only touches rows where the two diverge) and **safe** (the 14 GB
rows just gain `countryCode:'GB'`, which is already their effective value). After running it,
the US workspace's Legal section will correctly show the jurisdiction panel (US is not a
reviewed legal jurisdiction) and Compliance will show the US requirement set + research-only
disclaimer.

> Tell me "run the jurisdiction backfill" and I will execute it via PAT.

---

## Note on `multiCountryPortfolio` (deliberately left V2)

Per-property country/currency/jurisdiction **within a single workspace** is a separate,
larger capability (`multiCountryPortfolio`) that is not built. It remains V2. The packs
pulled forward to V1 are **workspace-level** — one jurisdiction per workspace, which is the
correct V1 scope.
