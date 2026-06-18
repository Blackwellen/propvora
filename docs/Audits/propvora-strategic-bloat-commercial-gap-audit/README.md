# Propvora — Strategic, Bloat, Commercial & Gap Audit

A senior‑level audit of Propvora answering one question:

> **Is Propvora best positioned as a focused UK property‑ops SaaS, a broader
> property operating system, a multi‑sided platform, or a staged platform where
> the SaaS wedge launches first and marketplace/consumer/supplier layers release
> later?**

**Verdict (full reasoning in `_shared-strategic-brief.md` and `20`):**
**Staged property operating system (Model 2).** Launch a paid **UK property‑
operations + compliance SaaS wedge** for operators; keep the marketplace /
consumer / independent‑supplier layers **in code behind the existing master
feature flags** and release them in stages. The architecture already supports this
(`src/lib/flags/registry.ts`). Protect the **compliance/legal** and **planning**
USP; cut the **full in‑app accounting GL**, the **Zapier‑clone automation canvas**,
**settings sprawl**, **calendar route duplication**, and the **supplier workspace
mirroring** of the operator app.

## Read order
1. `_shared-strategic-brief.md` — canonical spine (verdict, layer model, USP, route targets, infra facts). **Read first.**
2. `00-executive-summary.md` — one‑page founder summary.
3. `20-final-recommendation.md` + `19-founder-decision-lock.md` — the decisions to lock.

## Documents
| # | File | Purpose |
|---|------|---------|
| — | `_shared-strategic-brief.md` | Canonical spine all docs conform to |
| 00 | `00-executive-summary.md` | Executive summary for the founder |
| 01 | `01-route-inventory.md` | Every route classified (keep/merge/cut/defer/flag) |
| 02 | `02-product-strategy-saas-vs-platform.md` | SaaS vs OS vs platform; the 3 models scored |
| 03 | `03-consumer-and-buyer-analysis.md` | 18 buyer groups: JTBD, WTP, V1/V1.5/V2 fit |
| 04 | `04-commercial-analysis-and-pricing.md` | Pricing, packaging, monetisation, GTM, first‑100 |
| 05 | `05-competitor-research.md` | UK proptech / marketplace / accounting competitor map |
| 06 | `06-gap-analysis.md` | Cross‑cutting gaps w/ severity + acceptance criteria |
| 07 | `07-bloat-analysis-keep-merge-cut.md` | Ruthless scored bloat decisions |
| 08 | `08-workspace-by-workspace-audit.md` | 40 surfaces audited section by section |
| 09 | `09-usp-protection-matrix.md` | What must never be cut |
| 10 | `10-navigation-and-route-redesign.md` | V1/V1.5/V2 nav + clean settings + redirects |
| 11 | `11-mobile-pwa-strategy.md` | Per‑surface mobile/PWA classification |
| 12 | `12-supabase-schema-rls-wiring-audit.md` | 433‑table schema, RLS, wiring status |
| 13 | `13-admin-platform-admin-audit.md` | Platform admin control‑plane audit |
| 14 | `14-portals-audit.md` | Tenant/landlord/supplier/customer portals |
| 15 | `15-marketplace-and-platform-bets.md` | Layer‑D bets + liquidity/GTM gating |
| 16 | `16-release-readiness-and-risk-register.md` | Beta/paid‑launch gates + risk register |
| 17 | `17-deprecation-and-feature-flag-plan.md` | Safe flag/hide/merge/redirect/delete sequence |
| 18 | `18-implementation-roadmap.md` | Prioritised V1→V2 roadmap |
| 19 | `19-founder-decision-lock.md` | The explicit decisions to sign off |
| 20 | `20-final-recommendation.md` | Final positioning, wedge, modules, route targets |

## Status
Audit pack authored 2026‑06‑18. Supersedes ad‑hoc strategy notes. Existing docs
(`_coverage matrix.md`, `Release-Readiness-Takslist.md`, `docs/README.md`) updated
to link here. Competitor pricing marked `[VERIFY]` where not confirmed live.
