"use client"

import { createContext, useContext } from "react"

/* ──────────────────────────────────────────────────────────────────────────
   SupplierWorkspaceContext — provides the resolved supplier `workspaceId` to
   every client surface inside the `(supplier-workspace)` route group.

   The group `layout.tsx` already resolves the signed-in user's supplier
   workspace id server-side (and gates access on membership). We thread that id
   down through the shell into this context so client pages can append
   `?workspaceId=...` to their `/api/supplier/*` calls WITHOUT each one
   re-running an auth + membership round-trip on the client.

   This is the fix for the "wired but dead" supplier workspace: previously every
   tab called its API with no `workspaceId`, the route answered 400, and the
   tolerant fetch hook rendered a permanent "coming online" state.
─────────────────────────────────────────────────────────────────────────── */

interface SupplierWorkspaceValue {
  workspaceId: string | null
  /** False only during the (vanishingly small) window before the provider mounts. */
  ready: boolean
}

const SupplierWorkspaceContext = createContext<SupplierWorkspaceValue>({
  workspaceId: null,
  ready: false,
})

export function SupplierWorkspaceProvider({
  workspaceId,
  children,
}: {
  workspaceId: string | null
  children: React.ReactNode
}) {
  return (
    <SupplierWorkspaceContext.Provider value={{ workspaceId, ready: true }}>
      {children}
    </SupplierWorkspaceContext.Provider>
  )
}

/**
 * The resolved supplier workspace id for the current session. `ready` becomes
 * true as soon as the provider (mounted in the shell, fed by the server layout)
 * is in scope — the id is already known server-side, so there is no client
 * round-trip and effectively no loading window.
 */
export function useSupplierWorkspace(): SupplierWorkspaceValue {
  return useContext(SupplierWorkspaceContext)
}

/**
 * Append `workspaceId` (and any extra query params) to a `/api/supplier/*` path.
 * Returns `null` until the workspace id is known, so a caller passing this
 * straight into `useSupplierApi(url)` correctly waits (no request fires, and no
 * 400-missing-param can occur). All supplier-workspace reads are SUPPLIER-side,
 * so callers that hit the shared operator/supplier routes (jobs, quotes) should
 * pass `{ side: "supplier" }`.
 */
export function useSupplierApiUrl(
  path: string,
  extraParams?: Record<string, string>
): string | null {
  const { workspaceId } = useContext(SupplierWorkspaceContext)
  if (!workspaceId) return null
  const params = new URLSearchParams({ workspaceId, ...(extraParams ?? {}) })
  const sep = path.includes("?") ? "&" : "?"
  return `${path}${sep}${params.toString()}`
}
