/**
 * Jurisdiction engine — public API.
 *
 * The per-property internationalisation model:
 *   - usePropertyJurisdiction(id)  → RECORD-TRUE jurisdiction of an asset (locked)
 *   - useActiveJurisdiction({...})  → SECTION-LENS for overviews (switchable/grouped)
 *   - resolveValue(layers)          → the override chain (case▸property▸workspace▸sourced▸blank)
 *
 * Render with <SourcedValue>, <JurisdictionChip>, <NotLegalAdviceNotice> from
 * @/components/jurisdiction. Posture: PM platform, not a legal/tax advisor.
 */

export {
  resolveValue,
  numericCompare,
  type ProvenanceSource,
  type JurisdictionOverride,
  type SourcedDefault,
  type OverrideLayers,
  type ResolvedValue,
} from "./resolve"

export { usePropertyJurisdiction, type PropertyJurisdiction } from "./usePropertyJurisdiction"

export {
  JurisdictionContextProvider,
  useActiveJurisdiction,
  type SectionLens,
  type ActiveJurisdiction,
} from "./context"

export { usePortfolioJurisdictions, type PortfolioJurisdiction } from "./usePortfolioJurisdictions"
