// ============================================================================
// Guided Help — shared types.
// ============================================================================

export type TutorialType = "first-use" | "section" | "help-block"

export interface TutorialStep {
  title: string
  body: string
}

/** Which shell the tutorial belongs to. Keeps portal users from seeing app guides. */
export type TutorialSurface = "app" | "portal"

export interface Tutorial {
  /** Stable feature key, e.g. "portfolio.create_property". Never reuse. */
  key: string
  type: TutorialType
  /** Defaults to "app" when omitted. */
  surface?: TutorialSurface
  title: string
  /** Short one-liner shown in the help launcher list. */
  summary: string
  steps: TutorialStep[]
  /** Section grouping label, e.g. "Portfolio". */
  section: string
  /** Route prefix where a first-use/section tutorial may auto-trigger. */
  routePattern?: string
  /** Optional Help Centre article link. */
  helpHref?: string
  /** Optional role gate (owner/admin/manager/member/viewer/finance). Empty = all. */
  roles?: string[]
}

export type ChecklistMetric =
  | "properties"
  | "units"
  | "tenancies"
  | "contacts"
  | "team"
  | "documents"

export interface ChecklistItem {
  key: string
  label: string
  description: string
  href: string
  /** Live metric whose count > 0 marks this item complete. */
  metric: ChecklistMetric
  /** Optional role gate. */
  roles?: string[]
}

export type HelpStatus = "seen" | "dismissed" | "completed" | "snoozed"
