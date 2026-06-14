// Cross-component trigger to open the global AI Copilot panel (owned by
// AppShell). Any page's "Ask AI" affordance dispatches this; AppShell listens.
//
// An optional `prompt` can be passed to seed the composer with a starter
// question (the copilot screen may read it from the event detail).

export const OPEN_COPILOT_EVENT = "propvora:open-copilot"

export interface OpenCopilotDetail {
  prompt?: string
}

export function openCopilot(detail: OpenCopilotDetail = {}): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<OpenCopilotDetail>(OPEN_COPILOT_EVENT, { detail }))
}
