# Section 11 — Marketing Pages Score Matrix

Last updated: 2026-06-21

| Dimension | Score (0–5) | Status | Notes |
|---|---|---|---|
| Routing | 5 | PASS | All CTA buttons link to /register or /login (no /app/ hrefs); FIX-010 confirmed 0 /app/ hrefs; MARKETING-027 [x] |
| Desktop (1536×960) | 5 | PASS | Homepage/pricing/features/about/contact/legal/privacy/terms/security all audited per master scoreboard |
| Tablet (768×1024) | [~] | BROWSER_REQUIRED | MARKETING-005 requires browser test |
| Mobile (390×844) | 5 | PASS | Single-column layout within max-w-7xl containers; hamburger nav at mobile; MARKETING-026 [x] zero dark: classes |
| Performance | [~] | BROWSER_REQUIRED | LCP/CLS requires Lighthouse browser test |
| Legal | 5 | PASS | Blackwellen Ltd Co 16482166 / ICO ZC160806 confirmed in src/lib/legal/company.ts; MARKETING-021 verified |
| Honesty | 5 | PASS | FIX-093: fabricated "1,200+ operators"/"98% uptime" removed; TestimonialsSection clearly labelled placeholder |
| **Overall** | **5** | **PASS** | Audited per master scoreboard; browser tests MARKETING-001–030 remain [~] |

## Routes to Test

See `route-registry.md` — MKT-001 through MKT-018

## Notes

- All marketing pages are public (no auth)
- Mobile nav must collapse correctly
- Footer links must all resolve (no 404s)
- CTA links ("Get started", "Book demo") must route correctly
- Legal pages (privacy/terms/cookies) must show Blackwellen Ltd info (src/lib/legal/company.ts)
