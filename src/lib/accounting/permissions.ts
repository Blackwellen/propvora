// Who may POST and REVERSE journal entries.
//
// RLS already guarantees workspace isolation (read+write only within your
// workspace). On top of that, the *act of posting/reversing* — committing an
// immutable financial record — is restricted to finance-capable roles. Other
// members get a read-only ledger.
//
// Roles come from the workspace_members.role enum:
//   owner | admin | manager | member | accountant

export type WorkspaceRole = "owner" | "admin" | "manager" | "member" | "accountant"

/** Roles permitted to post / reverse journal entries. */
export const FINANCE_ROLES: readonly WorkspaceRole[] = [
  "owner",
  "admin",
  "manager",
  "accountant",
] as const

export function canPostLedger(role: string | null | undefined): boolean {
  return !!role && (FINANCE_ROLES as readonly string[]).includes(role)
}

/** Reversal requires the same capability as posting. */
export function canReverseLedger(role: string | null | undefined): boolean {
  return canPostLedger(role)
}
