"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { switchWorkspace as switchWorkspaceAction } from "@/lib/actions/workspace"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Workspace {
  id: string
  name: string
  slug: string
  business_type: string | null
  operation_interests: string[]
  plan: string
  trial_ends_at: string | null
  owner_id: string
}

interface AuthContextValue {
  /** The currently authenticated Supabase user, or null if unauthenticated. */
  user: User | null
  /** The current Supabase session, or null. */
  session: Session | null
  /** The user's active workspace (first workspace found), or null. */
  workspace: Workspace | null
  /** Whether the initial auth state has been resolved. */
  isLoading: boolean
  /** Sign out the user and redirect to /login. */
  signOut: () => Promise<void>
  /** Reload the workspace data. */
  refreshWorkspace: () => Promise<void>
  /**
   * Switch the active workspace: persists the choice, clears all cached
   * query data (prevents cross-workspace leak), reloads workspace context.
   */
  switchWorkspace: (workspaceId: string) => Promise<void>
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load the user's active workspace
  const loadWorkspace = useCallback(
    async (userId: string) => {
      try {
        // Try to get current_workspace_id from profile first
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_workspace_id")
          .eq("id", userId)
          .maybeSingle()

        let wsQuery = supabase
          .from("workspaces")
          .select("id, name, slug, business_type, operation_interests, plan, trial_ends_at, owner_id")

        if (profile?.current_workspace_id) {
          wsQuery = wsQuery.eq("id", profile.current_workspace_id)
        } else {
          // Fallback: get first workspace the user is a member of
          const { data: membership } = await supabase
            .from("workspace_members")
            .select("workspace_id")
            .eq("user_id", userId)
            .order("joined_at", { ascending: true })
            .limit(1)
            .maybeSingle()

          if (!membership) {
            setWorkspace(null)
            return
          }
          wsQuery = wsQuery.eq("id", membership.workspace_id)
        }

        const { data: ws } = await wsQuery.maybeSingle()
        setWorkspace((ws as Workspace) ?? null)
      } catch {
        setWorkspace(null)
      }
    },
    [supabase]
  )

  // Initialise auth state
  useEffect(() => {
    let mounted = true

    const init = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(initialSession)
      setUser(initialSession?.user ?? null)

      if (initialSession?.user) {
        await loadWorkspace(initialSession.user.id)
      }

      setIsLoading(false)
    }

    init()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        await loadWorkspace(newSession.user.id)
      } else {
        setWorkspace(null)
      }

      if (event === "SIGNED_OUT") {
        router.push("/login")
        router.refresh()
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.refresh()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setWorkspace(null)
    router.push("/login")
    router.refresh()
  }, [supabase, router])

  const refreshWorkspace = useCallback(async () => {
    if (user) {
      await loadWorkspace(user.id)
    }
  }, [user, loadWorkspace])

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      // 1. Persist the choice server-side (verifies membership).
      await switchWorkspaceAction(workspaceId)
      // 2. Clear ALL cached query data so no prior-workspace records leak.
      queryClient.clear()
      // 3. Reload the workspace context in the provider.
      if (user) {
        await loadWorkspace(user.id)
      }
      // 4. Refresh server components / route data.
      router.refresh()
    },
    [queryClient, user, loadWorkspace, router]
  )

  return (
    <AuthContext.Provider
      value={{ user, session, workspace, isLoading, signOut, refreshWorkspace, switchWorkspace }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Returns auth state: user, session, isLoading, and signOut.
 * Must be used within <AuthProvider>.
 */
export function useAuth(): Pick<
  AuthContextValue,
  "user" | "session" | "isLoading" | "signOut"
> {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>")
  }
  return {
    user: ctx.user,
    session: ctx.session,
    isLoading: ctx.isLoading,
    signOut: ctx.signOut,
  }
}

/**
 * Returns the current workspace and a refresh function.
 * Must be used within <AuthProvider>.
 */
export function useWorkspace(): Pick<
  AuthContextValue,
  "workspace" | "isLoading" | "refreshWorkspace" | "switchWorkspace"
> {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useWorkspace must be used within <AuthProvider>")
  }
  return {
    workspace: ctx.workspace,
    isLoading: ctx.isLoading,
    refreshWorkspace: ctx.refreshWorkspace,
    switchWorkspace: ctx.switchWorkspace,
  }
}
