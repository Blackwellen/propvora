import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  AiContext,
  AiDepth,
  AutomationContext,
  ComplianceContext,
  LegalContext,
  MoneyContext,
  PropvoraContext,
  ResolveContextArgs,
} from "./context-types"
import { packAtLeast } from "./_safe"
import { resolveActorContext } from "./actor-context"
import { resolveWorkspaceContext } from "./workspace-context"
import { resolvePropertyContext } from "./property-context"
import { resolveCountryContext } from "./country-context"
import { resolvePermissionContext } from "./permission-context"
import { resolveRiskContext } from "./risk-context"

/**
 * ============================================================================
 * Propvora v2 Context Engine — RESOLVER
 * ============================================================================
 * `resolvePropvoraContext` is the single entry point every v2 surface calls to
 * compose the full {@link PropvoraContext}. It orchestrates the per-block
 * sub-resolvers and derives the money / legal / compliance / ai / automation /
 * permission / risk blocks from them.
 *
 * It NEVER throws on a data problem: each sub-resolver degrades to safe GB /
 * operator defaults, so the resolver is safe to call from a v1 (unmigrated)
 * environment.
 * ============================================================================
 */

/** Lazily create the SSR server client when the caller didn't pass one. */
async function getSupabase(args: ResolveContextArgs): Promise<SupabaseClient> {
  if (args.supabase) return args.supabase
  // Imported lazily so this module stays importable in non-request contexts
  // (e.g. type-only use) without pulling next/headers eagerly.
  const { createClient } = await import("@/lib/supabase/server")
  return createClient()
}

export async function resolvePropvoraContext(
  args: ResolveContextArgs
): Promise<PropvoraContext> {
  const supabase = await getSupabase(args)

  // 1. Workspace + actor (actor needs the workspace id for its workspace role).
  const workspace = await resolveWorkspaceContext(supabase, args.workspaceId ?? null)
  const actor = await resolveActorContext(supabase, {
    actorId: args.actorId ?? null,
    workspaceId: workspace.id,
  })

  // 2. Property (optional) — its country, when present, drives the pack.
  const property = await resolvePropertyContext(
    supabase,
    args.propertyId ?? null,
    workspace.businessCountryCode
  )

  // 3. Country pack — property country wins, else workspace business country.
  const countryCode = property?.countryCode ?? workspace.businessCountryCode
  const country = await resolveCountryContext(supabase, {
    code: countryCode,
    source: property ? "property" : "workspace",
  })

  // 4. Money — property currency (if any) over pack/workspace currency.
  const baseCurrency = workspace.defaultCurrency
  const txCurrency =
    (property?.currency && property.currency.length > 0 && property.currency) ||
    country.currency ||
    baseCurrency
  const money: MoneyContext = {
    currency: txCurrency,
    baseCurrency,
    fxApplies: txCurrency !== baseCurrency,
  }

  // 5. Legal — UK-statute features apply only for GB (per build spec).
  const legal: LegalContext = {
    packLegalStatus: country.legalStatus,
    jurisdiction: property?.legalJurisdiction ?? country.code,
    ukStatuteApplies: country.code === "GB",
    localReviewRequired: !packAtLeast(country.legalStatus, "reviewed"),
  }

  // 6. Compliance — country-aware modules, gated by property-features posture.
  const compliance: ComplianceContext = {
    modules: {},
    enabled: packAtLeast(country.propertyFeaturesStatus, "research_only"),
  }

  // 7. AI — downgrade legal/tax depth to 'generic' when pack status < reviewed.
  const legalDepth: AiDepth = packAtLeast(country.legalStatus, "reviewed")
    ? "reviewed"
    : "generic"
  const taxDepth: AiDepth = packAtLeast(country.taxStatus, "reviewed")
    ? "reviewed"
    : "generic"
  const ai: AiContext = {
    legalDepth,
    taxDepth,
    countryGuarded: legalDepth === "generic" || taxDepth === "generic",
  }

  // 8. Automation — only safe action classes auto-run; risky classes need
  //    human approval and are never in this list.
  const allowedActionClasses = [
    "create_task",
    "send_notification",
    "request_approval",
    "create_draft_message",
    "ai_summarise",
    "flag_compliance_risk",
  ]
  if (country.offerStatus === "banned") {
    // A banned country gets no unattended automation at all.
    allowedActionClasses.length = 0
  }
  const automation: AutomationContext = { allowedActionClasses }

  // 9. Permission + Risk (pure derivations).
  const permission = resolvePermissionContext({ actor, workspace, country })
  const risk = resolveRiskContext({ country, money, property })

  return {
    actor,
    workspace,
    country,
    property,
    money,
    legal,
    compliance,
    ai,
    automation,
    permission,
    risk,
    route: args.route ?? null,
  }
}
