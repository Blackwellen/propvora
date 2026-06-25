# Portals — Portal Types V1 Scope Decision

**Section:** Portals
**Parent route:** `/property-manager/portals`
**Date:** 2026-06-24
**Decision owner:** Founder (jamahlthomas1996@gmail.com)

---

## Decision

The original section checklist asked to build **seven** full portal experiences
(Landlord, Supplier, Tenant, Applicant, Accountant, Solicitor, Generic) each to
the depth of the Landlord portal. **This was rejected.**

V1 ships only the **three** portal types that have a real, dedicated recipient
experience:

| Profile | Tier | Recipient experience |
|---|---|---|
| Landlord / Owner | **v1** | `/portal/[sessionId]/landlord/*` (full) |
| Supplier / Contractor | **v1** | `/portal/[sessionId]/supplier/*` (full) |
| Tenant / Occupier | **v1** | `/portal/[sessionId]/tenant/*` (full) |
| Applicant | extended | none — gated off |
| Accountant | extended | none — gated off |
| Solicitor | extended | none — gated off |
| Generic | extended | none — gated off |

### Why the extras are NOT built

The recipient portal engine (`PortalType` in `src/lib/portal/session.ts`) only
understands `supplier | landlord | tenant`. `coercePortalType()` already collapses
every other value into one of those three. The four extended profiles therefore
had **no dedicated experience** — granting "Solicitor" routed the recipient into
the generic **supplier** portal, which is misleading. They were profile-picker
entries with no product behind them = release bloat.

Per the V1 bloat rule, the four extended profiles are **feature-flagged off** rather
than built. They can be re-enabled (with real experiences) in V1.5+ by flipping
the flag.

---

## Implementation

**Flag:** `NEXT_PUBLIC_PORTALS_EXTENDED_PROFILES_ENABLED` (default **OFF**;
honoured on server + client; revealed by `NEXT_PUBLIC_QA_ALL_FLAGS`).
Helper: `isExtendedPortalProfilesEnabled()` in `src/lib/portal/flags.ts`.

Profiles are tagged `tier: "v1" | "extended"` in
`src/lib/portals/config.ts`; `isExtendedPortalProfile(key)` + `V1_PORTAL_PROFILE_KEYS`
are the single source of truth.

Gated in **three** places (UI suppression + server enforcement, per the Feature
Flag Gate Rule):

1. **Grant wizard** — `src/components/portals/GrantPortalAccessModal.tsx`:
   profile dropdown filtered to `tier === "v1"` when flag off.
2. **Profiles screen** — `src/hooks/usePortals.ts` (`usePortalProfiles`):
   both the built-in fallback and any `portal_profiles` config rows are filtered
   through the gate, so `/property-manager/portals/profiles` shows only the 3.
3. **Grant API (defence in depth)** — `src/app/api/portals/grant/route.ts`:
   returns `403` if `body.profile` is an extended profile while the flag is off,
   so a flagged-off profile cannot be granted via a direct API call.

### Files changed

- `src/lib/portals/config.ts` — added `tier` to `PortalProfileTemplate`, tagged
  all 7 profiles, added `V1_PORTAL_PROFILE_KEYS` + `isExtendedPortalProfile()`.
- `src/lib/portal/flags.ts` — added `isExtendedPortalProfilesEnabled()`.
- `src/components/portals/GrantPortalAccessModal.tsx` — gated dropdown.
- `src/hooks/usePortals.ts` — gated `usePortalProfiles` fallback + DB rows.
- `src/app/api/portals/grant/route.ts` — server-side 403 for gated profiles.
- `.env.local` — documented `NEXT_PUBLIC_PORTALS_EXTENDED_PROFILES_ENABLED=false`.

---

## Flag dual-state test

| State | Grant wizard profiles | Profiles screen | API grant of `solicitor` |
|---|---|---|---|
| **OFF** (V1 default) | Landlord, Supplier, Tenant | 3 cards | `403 not available` |
| **ON** (QA / V1.5) | all 7 | 7 cards | allowed (routes to supplier view) |

`NEXT_PUBLIC_QA_ALL_FLAGS` also forces the ON state for QA.

## Tests

- `npx tsc --noEmit` — **pass** (exit 0).

## Cross-section effects

None. The 3 V1 recipient experiences (landlord/supplier/tenant) are unchanged;
the engine already only supported those three. This change only removes the
misleading extended profile pickers from the PM-side grant surface.

---

## Release decision

**Ready for release** — V1 portal scope is Landlord, Supplier, Tenant. The four
extended profiles are feature-flagged off (`NEXT_PUBLIC_PORTALS_EXTENDED_PROFILES_ENABLED`)
and will be built with real experiences before being enabled in V1.5+.
