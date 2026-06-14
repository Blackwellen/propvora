import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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
        return NextResponse.redirect(url)
      }
    }
  }

  // Public admin paths that must not be auth-guarded (login page itself)
  const publicAdminPaths = ["/admin-login"]

  // Protected route prefixes — require authentication.
  // NOTE: the authenticated affiliate dashboard lives at exactly "/affiliate"
  // and "/affiliate/*". The PUBLIC marketing pages at "/affiliate-programme*"
  // must NOT be gated — so we match the affiliate app precisely, not by a loose
  // "/affiliate" startsWith (which would also catch "/affiliate-programme").
  const protectedPrefixes = ["/app", "/supplier-portal", "/admin"]
  const isAffiliateApp = pathname === "/affiliate" || pathname.startsWith("/affiliate/")
  const isProtected =
    (protectedPrefixes.some((p) => pathname.startsWith(p)) || isAffiliateApp) &&
    !publicAdminPaths.includes(pathname)

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(url)
  }

  // Auth pages — redirect already-authenticated users to app
  const authPaths = ["/login", "/register"]
  if (user && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/app", request.url))
  }

  return supabaseResponse
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
