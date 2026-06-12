import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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
