/**
 * Jurisdiction value resolver — the override chain.
 *
 * Every jurisdiction-sensitive value (a notice period, a deposit cap, a tax
 * rate, a compliance cadence) is resolved through ONE function so the whole app
 * behaves consistently and the liability posture is uniform:
 *
 *   per-CASE override  ▸  per-PROPERTY override  ▸  per-WORKSPACE customisation
 *   ▸  Propvora SOURCED default (informational, cited)  ▸  BLANK ("set this")
 *
 * The resolver is PURE and dependency-free so it is trivially unit-testable and
 * usable on both server and client. It never decides UI; it returns the value
 * plus its provenance so `<SourcedValue>` can render the source chip, the edit
 * affordance and the permanent "not legal advice" disclaimer.
 *
 * Posture: Propvora is a property-management platform, NOT a legal/tax advisor.
 * A `sourced` value is informational, drawn from verified public sources, and
 * the operator must verify and customise it. See
 * release-gated/docs/internationalisation/LIABILITY-disclaimer-and-customizability-plan.md
 */

/** Which layer of the chain a resolved value came from. */
export type ProvenanceSource = "case" | "property" | "workspace" | "sourced" | "blank"

/** An operator override at a given scope. Carries the reason/exemption for audit. */
export interface JurisdictionOverride<T> {
  value: T
  /** Free-text reason the operator changed the default (required for case scope). */
  reason?: string
  /** Optional structured exemption type (e.g. "contractual", "transitional"). */
  exemption?: string
  /** Who set it + when, for the audit trail (optional at call sites that don't track it). */
  setBy?: string
  setAt?: string
}

/** The Propvora-sourced default: informational, cited, NOT legal advice. */
export interface SourcedDefault<T> {
  value: T
  /** Human-readable citation/source (e.g. "GOV.UK — CGT rates"). */
  citation?: string
  /** ISO date the figure was compiled, so stale fiscal/legislative values surface. */
  compiledAt?: string
  /** A known statutory minimum, if any, used to warn on sub-minimum overrides. */
  statutoryMinimum?: T
}

/** All layers a value may be supplied at. Any may be omitted. */
export interface OverrideLayers<T> {
  case?: JurisdictionOverride<T> | null
  property?: JurisdictionOverride<T> | null
  workspace?: JurisdictionOverride<T> | null
  sourced?: SourcedDefault<T> | null
}

/** The resolved value plus full provenance for rendering + audit. */
export interface ResolvedValue<T> {
  /** The effective value, or null when nothing is set ("blank"). */
  value: T | null
  /** Which layer won. */
  source: ProvenanceSource
  /** True when an operator layer (case/property/workspace) overrode the sourced default. */
  isOverridden: boolean
  /** The override reason, when source is an operator layer. */
  overrideReason?: string
  /** The override exemption type, when present. */
  overrideExemption?: string
  /** The Propvora sourced default, ALWAYS surfaced so the citation can be shown alongside an override. */
  sourcedDefault: T | null
  /** Citation for the sourced default, if any. */
  citation?: string
  /** Compiled-at date for the sourced default, if any. */
  compiledAt?: string
  /**
   * True when the resolved value is below a known statutory minimum — the UI
   * warns (does not block), because the operator may know an exemption the
   * system doesn't. Only computed for numeric/comparable values via `compare`.
   */
  belowStatutoryMinimum?: boolean
}

/**
 * Resolve a single jurisdiction value through the override chain.
 *
 * @param layers   the value as supplied at each scope (any may be absent)
 * @param compare  optional comparator for the statutory-minimum warning; return
 *                 a negative number when `a < b`. Provide for numeric day-counts
 *                 / amounts. Omit for non-comparable values (strings, enums).
 */
export function resolveValue<T>(
  layers: OverrideLayers<T>,
  compare?: (a: T, b: T) => number,
): ResolvedValue<T> {
  const sourced = layers.sourced ?? null
  const sourcedDefault = sourced ? sourced.value : null
  const citation = sourced?.citation
  const compiledAt = sourced?.compiledAt

  // Walk the chain most-specific → least-specific.
  const winner: { source: ProvenanceSource; layer: JurisdictionOverride<T> | null } | null =
    layers.case != null
      ? { source: "case", layer: layers.case }
      : layers.property != null
        ? { source: "property", layer: layers.property }
        : layers.workspace != null
          ? { source: "workspace", layer: layers.workspace }
          : sourced != null
            ? { source: "sourced", layer: null }
            : null

  if (winner == null) {
    return { value: null, source: "blank", isOverridden: false, sourcedDefault, citation, compiledAt }
  }

  const isOverridden = winner.source === "case" || winner.source === "property" || winner.source === "workspace"
  const value = isOverridden ? (winner.layer as JurisdictionOverride<T>).value : (sourcedDefault as T)

  let belowStatutoryMinimum: boolean | undefined
  if (compare && sourced?.statutoryMinimum != null && value != null) {
    belowStatutoryMinimum = compare(value, sourced.statutoryMinimum) < 0
  }

  return {
    value,
    source: winner.source,
    isOverridden,
    overrideReason: isOverridden ? (winner.layer as JurisdictionOverride<T>).reason : undefined,
    overrideExemption: isOverridden ? (winner.layer as JurisdictionOverride<T>).exemption : undefined,
    sourcedDefault,
    citation,
    compiledAt,
    belowStatutoryMinimum,
  }
}

/** Numeric comparator helper for `resolveValue` statutory-minimum checks. */
export const numericCompare = (a: number, b: number): number => a - b
