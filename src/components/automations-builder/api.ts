"use client"

// Client-side fetch helpers for the Automation v2 builder APIs. Thin wrappers
// that always pass the active workspaceId and surface a clean error/upgrade
// shape to the UI. No secrets here — all auth is cookie-based, gates are server.

import type {
  AutomationDefinition,
  DryRunResponse,
  NlDraftResponse,
} from "./types"

export interface ApiError {
  error: string
  upgrade?: boolean
  tier?: string
  status: number
}

async function readJson<T>(res: Response): Promise<T | ApiError> {
  let body: Record<string, unknown> = {}
  try {
    body = (await res.json()) as Record<string, unknown>
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    return {
      error: String(body.error ?? "Request failed"),
      upgrade: Boolean(body.upgrade),
      tier: body.tier ? String(body.tier) : undefined,
      status: res.status,
    }
  }
  return body as T
}

export function isApiError(x: unknown): x is ApiError {
  return !!x && typeof x === "object" && "error" in x && "status" in x
}

export async function nlDraft(prompt: string, workspaceId?: string): Promise<NlDraftResponse | ApiError> {
  const res = await fetch("/api/automations/nl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, workspaceId }),
  })
  return readJson<NlDraftResponse>(res)
}

export async function dryRunDefinition(
  definition: AutomationDefinition,
  workspaceId?: string
): Promise<DryRunResponse | ApiError> {
  const res = await fetch("/api/automations/dry-run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ definition, workspaceId }),
  })
  return readJson<DryRunResponse>(res)
}

export async function saveDefinition(
  definition: AutomationDefinition,
  opts: { workspaceId?: string; source: "builder" | "canvas" }
): Promise<{ ok: true; id: string } | ApiError> {
  const editing = !!definition.id
  const url = editing ? `/api/automations/definitions/${definition.id}` : "/api/automations/definitions"
  const res = await fetch(url, {
    method: editing ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ definition, workspaceId: opts.workspaceId, source: opts.source }),
  })
  return readJson<{ ok: true; id: string }>(res)
}
