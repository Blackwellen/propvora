# User Fixes Required — Automations Sub-Tabs

**Last updated:** 2026-06-26 (Session 5 — seeding + detail-page verification complete)  
**Section:** Automations (all sub-tabs)

---

## Open Manual Actions

### 1. Wire `/api/automations/webhooks` POST endpoint

The Webhooks "New endpoint" modal POSTs to `/api/automations/webhooks`.  
This API route does not yet exist — clicking "Save endpoint" will 404.

**Suggested implementation:**
```ts
// src/app/api/automations/webhooks/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("current_workspace_id").eq("id", user.id).maybeSingle()
  const workspaceId = profile?.current_workspace_id
  if (!workspaceId) return NextResponse.json({ ok: false, error: "No workspace" }, { status: 400 })

  const body = await req.json()
  const { name, url, environment, eventGroups } = body

  if (!name || !url || !url.startsWith("https://"))
    return NextResponse.json({ ok: false, error: "Invalid endpoint" }, { status: 400 })

  const { error } = await supabase.from("automation_webhook_endpoints").insert({
    workspace_id: workspaceId,
    name, url, environment: environment ?? "production",
    event_groups: eventGroups ?? [],
    enabled: true,
  })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

---

### 2. Connect "View billing" button in Usage & Limits to real billing page

The "View billing" button currently calls `toast("Opening billing")`.  
Once Stripe billing is active, update to route to the billing page:

```tsx
// src/features/automations/pages/UsageLimitsPage.tsx
// Change:
onClick={() => toast("Opening billing")}
// To:
onClick={() => router.push("/property-manager/settings/billing")}
```

---

## Completed — Closed This Session (2026-06-26)

- ✅ **V2 tables created and seeded** — `automation_approvals`, `automation_errors`, `automation_integrations`, `automation_webhook_endpoints`, `automation_webhook_deliveries`, `automation_usage_daily` all exist and have realistic demo data.
- ✅ **All detail pages/panels verified with live data:**
  - Canvas builder (`/canvas/[automationId]`) — nodes + edges visible, version badge correct
  - Run detail (`/runs/[id]`) — 3-step timeline, Succeeded status, input/output JSON
  - Approvals inline panel — possession notice, tenant name, High priority
  - Errors inline panel — AUTH_EXPIRED, Details/Remediation tabs
  - Integrations — 4 connected apps with health badges
  - Webhooks inline panel — destination URL, signing secret, delivery sub-tabs
- ✅ **Browser screenshots taken** at desktop, tablet and mobile via Chrome MCP
- ✅ **RSC boundary bug fixed** (`OpsHeader` now accepts `iconNode?: React.ReactNode` for server component callers)
- ✅ **All 5 data hooks rewritten** to fetch live Supabase data (FIX-569)
- ✅ **ARIA accessibility** on all sub-tab strips and data table (FIX-570–573)
- ✅ Admin Controls redirect → Workspace Settings (FIX-502)
- ✅ Recipes API wired (81 recipes from `/api/automations/recipes`)
- ✅ Approval approve/reject wired to `/api/automations/approvals`
- ✅ AI Builder wired to `/api/automations/ai-builder`
- ✅ Canvas Lite plan gate enforced server-side
- ✅ Toggle enable/disable uses `setAutomationEnabled` server action
