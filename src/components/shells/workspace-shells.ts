import type { WorkspaceType } from "@/lib/flags/route-context"

/**
 * WORKSPACE-TYPE → SHELL MAP (v2 scaffold)
 * ----------------------------------------
 * Documents which existing shell serves each v2 workspace type, plus the flag
 * (if any) that must be ON for that shell to be reachable. This is a pure,
 * declarative scaffold — it changes NOTHING at runtime on its own. It exists so
 * future v2 routing can pick a shell by workspace.type instead of hard-coding,
 * and so the four-shell intent is discoverable in one place.
 *
 * With all v2 flags OFF:
 *   - operator → existing AppShell (unchanged; no flag gate, this is V1)
 *   - supplier → existing SupplierShell (unchanged)
 *   - platform_admin → existing AdminShell (unchanged)
 *   - customer → new CustomerShell, gated behind `customerWorkspace` (OFF) so
 *     it does not appear in V1 at all.
 *
 * Importing this file pulls in NO React/Supabase — it is just metadata.
 */
import type { V2FlagKey } from "@/lib/flags/registry"

export interface WorkspaceShellDescriptor {
  /** Component module path (for documentation / future dynamic resolution). */
  shellModule: string
  /** Default route group base for this workspace type. */
  routeBase: string
  /** Flag that must be ON for this shell to be reachable, or null for V1. */
  requiredFlag: V2FlagKey | null
}

export const WORKSPACE_SHELLS: Record<WorkspaceType, WorkspaceShellDescriptor> = {
  operator: {
    shellModule: "@/components/shells/AppShell",
    routeBase: "/app",
    requiredFlag: null, // V1 default — always available.
  },
  supplier: {
    shellModule: "@/components/shells/SupplierShell",
    routeBase: "/supplier-portal",
    requiredFlag: null, // existing portal stays available; supplierWorkspace
    // (OFF) only gates the *expanded* workspace surface, not the portal.
  },
  customer: {
    shellModule: "@/components/shells/CustomerShell",
    routeBase: "/customer",
    requiredFlag: "customerWorkspace", // OFF by default → hidden in V1.
  },
  platform_admin: {
    shellModule: "@/components/shells/AdminShell",
    routeBase: "/admin",
    requiredFlag: null, // existing admin console — unchanged.
  },
}
