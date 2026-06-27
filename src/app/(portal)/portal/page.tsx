import { redirect } from "next/navigation"
import Image from "next/image"
import { isExternalPortalEnabled } from "@/lib/portal/flags"

export const dynamic = "force-dynamic"

// GET /portal?token=... (landing)
//
// Reads the token from the query and POSTs it to /api/portal/verify. We use a
// no-JS auto-submitting form so the token leaves the URL bar immediately and
// the session cookie is set by the POST handler (cookies can't be set during
// GET rendering). If there's no token we send the visitor to the login page.
export default async function PortalLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  if (!isExternalPortalEnabled()) {
    redirect("/portal/expired")
  }

  const sp = await searchParams
  const raw = sp.token
  const token = Array.isArray(raw) ? raw[0] : raw

  if (!token) {
    redirect("/portal/login")
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center">
        <div className="relative h-8 w-[150px] mx-auto mb-6">
          <Image
            src="/propvora-logo-dark.png"
            alt="Propvora"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-base font-semibold text-slate-900">Opening your portal…</h1>
        <p className="text-sm text-slate-500 mt-1">
          Verifying your secure link. This only takes a moment.
        </p>

        {/* Auto-submitting verify form (no JS required) */}
        <form
          id="verify-form"
          method="POST"
          action="/api/portal/verify"
          className="mt-6"
        >
          <input type="hidden" name="token" value={token} />
          <noscript>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
            >
              Continue to portal
            </button>
          </noscript>
        </form>

        <div className="mt-6 flex items-center justify-center" aria-hidden>
          <span className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-[var(--brand)] animate-spin" />
        </div>

        {/* Submit on load; runs in the browser only. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.getElementById('verify-form').submit();",
          }}
        />
      </div>
    </main>
  )
}
