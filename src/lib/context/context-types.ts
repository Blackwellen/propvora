import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * ============================================================================
 * Propvora v2 Context Engine — TYPES
 * ============================================================================
 *
 * The Context Engine is the single resolver every v2 surface (page loader,
 * server action, API route, AI tool, automation worker, payment webhook) calls
 * to learn WHO the actor is, WHERE they are operating (workspace + country +
 * property), and WHAT IS ALLOWED in that situation.
 *
 * This file declares only the *shape* of that context. The composition logic
 * lives in `context-resolver.ts` (+ the per-block sub-resolvers).
 *
 * DESIGN RULE — DEGRADE, NEVER THROW. The v2 foundation migration
 * (workspaces.business_country_code, the `country_packs` table, property
 * jurisdiction columns…) may not be applied in every environment. Every read
 * tolerates a missing table (Postgres 42P01) or missing column (42703) and
 * falls back to safe GB / operator defaults so a v1 environment is never
 * broken by a v2 caller.
 * ============================================================================
 */

// ── Primitive enums ─────────────────────────────────────────────────────────

/** The four workspace kinds the platform supports. */
export type WorkspaceType = "operator" | "supplier" | "customer" | "platform_admin"

/**
 * Maturity of a country pack feature dimension. Ordered weakest → strongest.
 * Used for `property_features_status` and for legal/tax/privacy review status.
 */
export type PackStatus =
  | "disabled"
  | "generic_only"
  | "research_only"
  | "beta"
  | "reviewed"
  | "enabled"

/** Commercial eligibility of a country. */
export type OfferStatus = "offer" | "restricted" | "banned" | "unknown"

/** How deep AI is permitted to go on jurisdiction-specific guidance. */
export type AiDepth = "generic" | "reviewed"

/** Coarse risk classification for the resolved situation. */
export type RiskClass = "low" | "medium" | "high"

// ── Route-declared context (§2.4 of the audit) ──────────────────────────────

/**
 * The static contract a v2 route declares about itself. Passed into the
 * resolver as `args.route` so the resolver can flag mismatches (e.g. an
 * operator-only route reached in a supplier workspace) without itself
 * performing redirects — surfaces decide what to do with the flags.
 */
export interface RouteContext {
  requiredWorkspaceTypes?: WorkspaceType[]
  supportedActorContexts?: string[]
  countryPackRequired?: boolean
  legalPackRequired?: boolean
  moneyContextRequired?: boolean
  allowResearchOnlyCountry?: boolean
  blockedCountryBehaviour?: "deny" | "generic" | "warn"
}

// ── Context blocks ──────────────────────────────────────────────────────────

export interface ActorContext {
  /** Supabase auth user id, or null when unauthenticated / unresolved. */
  userId: string | null
  /** Platform-level role (e.g. 'platform_admin' | 'user'). */
  role: string | null
  /** This actor's role *within the resolved workspace* (owner/admin/member…). */
  workspaceRole: string | null
  /** True when the actor is a Propvora platform administrator. */
  isPlatformAdmin: boolean
}

export interface WorkspaceContext {
  id: string | null
  type: WorkspaceType
  /** ISO 3166-1 alpha-2 of where the *business* is based (NOT the property). */
  businessCountryCode: string
  /** Hosting/data-residency region marker (free text, e.g. 'eu', 'uk', 'us'). */
  dataRegion: string
  /** ISO 4217 base/reporting currency for the workspace. */
  defaultCurrency: string
  /** BCP-47 default language/locale. */
  defaultLanguage: string
  /** Canonical plan tier string (e.g. 'starter' | 'scale' | 'enterprise'). */
  plan: string
  /** Alias of `plan`, kept for callers that speak in "tier". */
  tier: string
  /** True when no live workspace row backed this context (safe defaults used). */
  isFallback: boolean
}

/**
 * The resolved country pack for the situation. Resolved from the property's
 * country when a property is in scope, otherwise from the workspace's business
 * country. Every status falls back to a safe value when the pack row/column is
 * absent (GB defaults to a fully-enabled posture; everything else to generic).
 */
export interface CountryContext {
  /** ISO country code the pack was resolved for. */
  code: string
  /** Which input the code came from. */
  source: "property" | "workspace" | "default"
  offerStatus: OfferStatus
  /** Gates property/tenancy/compliance features (§2.3 of COUNTRY_LEGAL_PROFILES). */
  propertyFeaturesStatus: PackStatus
  currency: string
  locale: string
  legalStatus: PackStatus
  taxStatus: PackStatus
  privacyStatus: PackStatus
  /** Disclaimer strings the surface must render (may be empty). */
  disclaimers: string[]
  /** True when no live pack row backed this country (safe defaults used). */
  isFallback: boolean
}

/** Present only when a `propertyId` was supplied to the resolver. */
export interface PropertyContext {
  id: string
  countryCode: string
  legalJurisdiction: string
  currency: string
  /** 'sqm' | 'sqft' — area unit for display. */
  areaUnit: string
  /** True when no live property row backed this context. */
  isFallback: boolean
}

export interface MoneyContext {
  /** Currency money should default to in this context. */
  currency: string
  /** Workspace base/reporting currency. */
  baseCurrency: string
  /** True when the resolved property currency differs from the base currency. */
  fxApplies: boolean
}

export interface LegalContext {
  /** The pack's legal review status. */
  packLegalStatus: PackStatus
  jurisdiction: string
  /** True only for GB — gates UK-statute-specific features (RRA-2026, HMO…). */
  ukStatuteApplies: boolean
  /** True until the country's legal pack is reviewed/enabled. */
  localReviewRequired: boolean
}

export interface ComplianceContext {
  /** Country-aware module → status map (e.g. { gas_safety: 'enabled' }). */
  modules: Record<string, string>
  /** True when the property-features posture allows compliance workflows. */
  enabled: boolean
}

export interface AiContext {
  /** Depth allowed for legal answers; 'generic' until the legal pack is reviewed. */
  legalDepth: AiDepth
  /** Depth allowed for tax answers; 'generic' until the tax pack is reviewed. */
  taxDepth: AiDepth
  /** Convenience: true when AI must keep all jurisdiction guidance generic. */
  countryGuarded: boolean
}

export interface AutomationContext {
  /**
   * Action classes automations are allowed to run unattended in this context.
   * Risky classes (legal notices, payment release, refunds, destructive data)
   * are intentionally excluded — they require human approval.
   */
  allowedActionClasses: string[]
}

/**
 * Capability booleans. These are *coarse* situational permissions derived from
 * actor role + workspace type + country posture — not a replacement for RLS,
 * which remains the security boundary. Surfaces use these to show/hide and to
 * pre-empt obviously-disallowed actions.
 */
export interface PermissionContext {
  canManageWorkspace: boolean
  canManageProperty: boolean
  canViewMoney: boolean
  canManageMoney: boolean
  canUseLegalFeatures: boolean
  canUseComplianceFeatures: boolean
  canAdminister: boolean
}

export interface RiskContext {
  class: RiskClass
  flags: string[]
}

// ── The composed context ────────────────────────────────────────────────────

export interface PropvoraContext {
  actor: ActorContext
  workspace: WorkspaceContext
  country: CountryContext
  /** Present only when a propertyId was supplied. */
  property: PropertyContext | null
  money: MoneyContext
  legal: LegalContext
  compliance: ComplianceContext
  ai: AiContext
  automation: AutomationContext
  permission: PermissionContext
  risk: RiskContext
  /** The route contract, echoed back if one was passed in. */
  route: RouteContext | null
}

// ── Resolver arguments ──────────────────────────────────────────────────────

/**
 * Inputs to `resolvePropvoraContext`. All optional except — in practice — the
 * caller usually supplies at least a `supabase` client and a `workspaceId`.
 *
 *  - `supabase`   server-side Supabase client; if omitted the resolver creates
 *                 the SSR server client itself (so it works inside a Server
 *                 Component / route handler with no plumbing).
 *  - `route`      the calling route's declared RouteContext.
 *  - `workspaceId` the workspace to resolve.
 *  - `propertyId`  resolve a property block + country-from-property.
 *  - `entityType` / `entityId`  the focused record (reserved for future
 *                 entity-aware blocks; carried but not yet read).
 *  - `actorId`    override the actor; defaults to the signed-in user.
 */
export interface ResolveContextArgs {
  supabase?: SupabaseClient
  route?: RouteContext
  workspaceId?: string | null
  propertyId?: string | null
  entityType?: string | null
  entityId?: string | null
  actorId?: string | null
}
