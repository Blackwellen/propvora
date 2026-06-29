import type { ActionKind, QuickAction } from "../types"

// ============================================================================
// Action-block parser.
//
// The model may append a machine-readable block at the very end of its reply to
// offer the user GUI action buttons (e.g. "Create task", "Draft email"):
//
//   [[ACTIONS]]
//   [{"label":"Create task: chase EICR","kind":"create","prompt":"/create-task Chase the overdue EICR at 22 Park Road"}]
//   [[/ACTIONS]]
//
// `stripActions` removes the block (complete OR a partially-streamed one) from
// the visible text so it never flashes on screen. `parseActions` validates the
// JSON into safe QuickAction buttons. Clicking a button sends its `prompt`
// through the normal chat flow, so any mutation still goes through the existing
// permission-gated approval card — these buttons add NO new execution path.
// ============================================================================

const OPEN = "[[ACTIONS]]"
const CLOSE = "[[/ACTIONS]]"
const BLOCK_RE = /\[\[ACTIONS\]\]([\s\S]*?)\[\[\/ACTIONS\]\]/i

const ALLOWED_KINDS: ActionKind[] = ["create", "edit", "update", "draft", "view", "ask"]
const MAX_ACTIONS = 4
const MAX_LABEL = 80
const MAX_PROMPT = 500

/**
 * Strip the action block from displayed content. Handles the complete block and
 * an unterminated one still mid-stream (everything from `[[ACTIONS]]` onward).
 */
export function stripActions(raw: string): string {
  let out = raw.replace(BLOCK_RE, "")
  const openIdx = out.indexOf(OPEN)
  if (openIdx !== -1) out = out.slice(0, openIdx) // unterminated trailing block while streaming
  return out.trimEnd()
}

/** Parse the (validated) action buttons out of a completed reply. Returns []. */
export function parseActions(raw: string): QuickAction[] {
  const m = raw.match(BLOCK_RE)
  if (!m) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(m[1].trim())
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const actions: QuickAction[] = []
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue
    const rec = item as Record<string, unknown>
    const label = typeof rec.label === "string" ? rec.label.trim().slice(0, MAX_LABEL) : ""
    const prompt = typeof rec.prompt === "string" ? rec.prompt.trim().slice(0, MAX_PROMPT) : ""
    if (!label || !prompt) continue
    const kind: ActionKind =
      typeof rec.kind === "string" && (ALLOWED_KINDS as string[]).includes(rec.kind)
        ? (rec.kind as ActionKind)
        : "ask"
    actions.push({ slug: prompt, label, prompt, kind })
    if (actions.length >= MAX_ACTIONS) break
  }
  return actions
}

/** Convenience: strip + parse in one pass. */
export function splitActions(raw: string): { text: string; actions: QuickAction[] } {
  return { text: stripActions(raw), actions: parseActions(raw) }
}

export { OPEN as ACTIONS_OPEN, CLOSE as ACTIONS_CLOSE }
