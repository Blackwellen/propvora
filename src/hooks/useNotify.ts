'use client'

// ────────────────────────────────────────────────────────────────────────────
// useNotify — thin client hook that binds the notification emitters to the
// current workspace + actor, so mutation hooks can fire real events with one
// call. Fire-and-forget: emitter failures are swallowed and never surface to
// the primary mutation.
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo } from 'react'
import { useAuth, useWorkspace } from '@/providers/AuthProvider'
import * as emit from '@/lib/notifications/emitters'

type Emitters = typeof emit

export function useNotify() {
  const { user } = useAuth()
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const actorId = user?.id ?? null

  /**
   * Run an emitter with the bound workspaceId injected. The supplied args omit
   * `workspaceId`; it's merged in here. Safe no-op if no workspace is loaded.
   */
  const notify = useCallback(
    <K extends keyof Emitters>(
      event: K,
      args: Omit<Parameters<Emitters[K]>[0], 'workspaceId'>,
    ): void => {
      if (!workspaceId) return
      try {
        const fn = emit[event] as (a: unknown) => Promise<unknown>
        void fn({ ...args, workspaceId }).catch(() => {})
      } catch {
        /* never break the caller */
      }
    },
    [workspaceId],
  )

  return useMemo(() => ({ notify, workspaceId, actorId }), [notify, workspaceId, actorId])
}
