import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/security/rateLimit"

/** Attach security headers to any response (mutates in-place, returns the response). */
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  return response
}

type ProxySupabaseClient = ReturnType<typeof createServerClient>

/**
 * Lightweight platform-admin check for the proxy (Edge). Mirrors the
 * authoritative server guard in src/lib/admin/guard.ts but uses the request's
 * own anon-keyed client (the user reads their OWN profile row, which RLS
 * permits). Fail-closed: any error returns false so maintenance mode never
 * accidentally grants access. This is only used to let admins bypass the
 * maintenance redirect — all real admin authorisation still runs server-side.
 */
async function isPlatformAdmin(
  supabase: ProxySupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("platform_role")
      .eq("id", userId)
      .maybeSingle()
    if (data && (data as { platform_role?: string }).platform_role === "admin") {
      return true
    }
  } catch {
    // column/table missing — fall through to the grant table.
  }
  try {
    const { data } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()
    if (data) return true
  } catch {
    // table missing — deny.
  }
  return false
}

export async function proxy(request: NextRequest) {
  // Forward pathname so Server Components can read it via headers()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Apply cookies to both the mutated request headers and the response
          cookiesToSet.forEach(({ name, value }) =>
            requestHeaders.set("cookie", `${request.headers.get("cookie") ?? ""}; ${name}=${value}`)
          )
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — important for Server Components to read the session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── Rate limiting ─────────────────────────────────────────────────────────
  // Applied before any auth check so we can limit unauthenticated callers too.
  // Identifier: authenticated user id if available, otherwise the originating IP.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"

  if (pathname.startsWith("/api/auth/")) {
    const rl = checkRateLimit(ip, "auth", 10, 60_000)
    if (!rl.allowed) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000)),
        },
      })
    }
  }

  if (pathname.startsWith("/api/ai/")) {
    const userId = user?.id ?? ip
    const rl = checkRateLimit(userId, "ai", 30, 60_000)
    if (!rl.allowed) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000)),
        },
      })
    }
  }

  if (pathname.startsWith("/api/upload/") || pathname === "/api/upload") {
    const userId = user?.id ?? ip
    const rl = checkRateLimit(userId, "upload", 20, 60_000)
    if (!rl.allowed) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000)),
        },
      })
    }
  }

  // ── Maintenance mode ──────────────────────────────────────────────────────
  // Toggled via the server env var MAINTENANCE_MODE=true (NEXT_PUBLIC_ variant
  // also honoured so client bundles can read it if needed). When ON, everyone
  // is redirected to /maintenance EXCEPT:
  //   - platform admins (so they can keep working / verify the deploy)
  //   - a small allowlist of paths that must keep functioning
  // The matcher already excludes _next/static, _next/image, favicon and image
  // assets, so those are inherently allowed.
  const maintenanceOn =
    process.env.MAINTENANCE_MODE === "true" ||
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"

  if (maintenanceOn) {
    const maintenanceAllowlist = [
      "/maintenance",
      "/api/health",
      "/admin-login",
    ]
    const isAllowlisted =
      maintenanceAllowlist.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
      ) ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/_vercel/")

    if (!isAllowlisted) {
      // Let verified platform admins through so they can keep operating.
      const isAdmin = user ? await isPlatformAdmin(supabase, user.id) : false
      if (!isAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = "/maintenance"
        url.search = ""
        return applySecurityHeaders(NextResponse.redirect(url))
      }
    }
  }

  // Public admin paths that must not be auth-guarded (login page itself)
  const publicAdminPaths = ["/admin-login"]

  // Protected route prefixes — require authentication.
  // The affiliate experience now lives as internal-tabbed sections under the
  // already-gated /property-manager and /user prefixes, so no separate
  // "/affiliate" case is needed. The PUBLIC marketing pages at
  // "/affiliate-programme*" remain ungated.
  //
  // /portal/* and /p/* intentionally NOT included here — they use magic-link
  // token-based session auth (set by /api/portal/verify), not the Supabase
  // session cookie. Their auth is enforced inside the portal route handlers.
  // NOTE: "/supplier/" and "/supplier-portal/" (with trailing slash) deliberately
  // exclude the public "/suppliers" marketplace route which must be anon-readable.
  const protectedPrefixes = ["/property-manager", "/supplier/", "/supplier-portal/", "/customer", "/user", "/admin"]

  // Public checkout funnel — the guest `/checkout/*` group must be reachable
  // WITHOUT an auth account (access is scoped by a session token via RLS, not a
  // Postgres role). It deliberately does NOT start with any protected prefix,
  // but we allowlist it explicitly so a future prefix change can never gate it
  // by accident. NOTE: the authenticated `/property-manager/checkout/*`
  // equivalents ARE gated (they live under the protected `/property-manager`
  // prefix and are intentionally excluded from this allowlist).
  const publicCheckout =
    pathname === "/checkout" || pathname.startsWith("/checkout/")

  const isProtected =
    !publicCheckout &&
    protectedPrefixes.some((p) => pathname.startsWith(p)) &&
    !publicAdminPaths.includes(pathname)

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectTo", pathname)
    return applySecurityHeaders(NextResponse.redirect(url))
  }

  // Auth pages — redirect already-authenticated users to app
  const authPaths = ["/login", "/register"]
  if (user && authPaths.includes(pathname)) {
    return applySecurityHeaders(NextResponse.redirect(new URL("/property-manager", request.url)))
  }

  // ── v2 routeContext guard (ADDITIVE, flag-gated, fail-open) ────────────────
  // Composes WITH the auth guard above — it never replaces it. It only ever
  // acts when ALL of the following hold:
  //   - the request is authenticated (no point resolving context otherwise),
  //   - the pathname matches a route with a declared RouteContext, and
  //   - the `contextEngine` v2 flag is ON (default OFF → this whole block is a
  //     no-op and V1 behaviour is unchanged).
  // Every dependency is imported LAZILY and wrapped so that a missing export
  // (the resolver is owned by a concurrent agent) or any error can NEVER crash
  // the proxy — on any problem we simply fall through to the normal response.
  if (user) {
    const guarded = await maybeApplyRouteContextGuard(supabase, request, pathname)
    if (guarded) return applySecurityHeaders(guarded)
  }

  return applySecurityHeaders(supabaseResponse)
}

/**
 * Tolerant scaffold for the v2 routeContext guard. Returns a redirect Response
 * to enforce a context mismatch, or null to allow the request through. Any
 * error, missing export or disabled flag returns null (fail-open) so the proxy
 * is never destabilised by v2 work-in-progress.
 */
async function maybeApplyRouteContextGuard(
  supabase: ProxySupabaseClient,
  request: NextRequest,
  pathname: string
): Promise<NextResponse | null> {
  try {
    // Route-context constraints are an Ops-stage rollout. Keep every V1/V1.5
    // route inert until the global context-engine flag is explicitly enabled.
    // The accessor is tolerant and resolves false on schema/RLS failures.
    const { isFeatureEnabled } = await import("@/lib/flags")
    const contextEngineOn = await isFeatureEnabled("contextEngine", { supabase })
    if (!contextEngineOn) return null

    const { matchRouteContext } = await import("@/lib/flags/route-registry")
    const routeContext = matchRouteContext(pathname)
    if (!routeContext) return null // self-gates: only routes that DECLARE a context are guarded.

    // v2 is integrated into core (no feature flags) — the guard runs on any route
    // that declares a routeContext and enforces workspace-type/country rules.
    // Resolver imported lazily and tolerant so routing never breaks if absent.
    // missing export so a not-yet-landed `@/lib/context` never breaks routing.
    let resolved: unknown = null
    try {
      const contextMod = (await import("@/lib/context")) as {
        resolvePropvoraContext?: (args: {
          request: NextRequest
          route: string
        }) => Promise<unknown>
      }
      if (typeof contextMod.resolvePropvoraContext === "function") {
        resolved = await contextMod.resolvePropvoraContext({ request, route: pathname })
      }
    } catch {
      return null // resolver missing/failed → fail open.
    }
    if (!resolved) return null

    const { evaluateRouteContext } = await import("@/lib/flags/route-context")
    const outcome = evaluateRouteContext(
      routeContext,
      resolved as Parameters<typeof evaluateRouteContext>[1]
    )
    if (outcome.ok) return null

    const url = request.nextUrl.clone()
    url.pathname = outcome.redirectTo ?? "/property-manager"
    url.search = ""
    return NextResponse.redirect(url)
  } catch {
    return null // any failure → fail open, never crash the proxy.
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image  (image optimisation)
     * - favicon.ico, public asset images
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
