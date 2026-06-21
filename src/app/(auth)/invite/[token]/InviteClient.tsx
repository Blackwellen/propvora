"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Building2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { acceptInvite, type InviteDetails } from "@/lib/actions/invite"

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
  finance: "Finance",
  supplier: "Supplier",
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, var(--brand-soft) 0%, var(--bg-surface) 40%, var(--accent-soft) 100%)" }}
    >
      <div className="w-full max-w-[440px]">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image
              src="/propvora-logo-dark.png"
              alt="Propvora"
              width={520}
              height={130}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>
        <div className="bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] border border-slate-100/80 p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  not_found: {
    title: "Invitation not found",
    body: "This invitation link is invalid. Please check the link or ask the workspace owner to send a new one.",
  },
  expired: {
    title: "Invitation expired",
    body: "This invitation has expired. Ask the workspace owner to send you a fresh invite.",
  },
  revoked: {
    title: "Invitation revoked",
    body: "This invitation has been revoked and can no longer be used.",
  },
  already_accepted: {
    title: "Already accepted",
    body: "This invitation has already been accepted. Try signing in to access the workspace.",
  },
  error: {
    title: "Something went wrong",
    body: "We couldn't load this invitation right now. Please try again shortly.",
  },
}

export default function InviteClient({
  token,
  details,
}: {
  token: string
  details: InviteDetails
}) {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setAuthed(!!data.session)
      setAuthChecked(true)
    })
    return () => {
      mounted = false
    }
  }, [])

  if (details.status !== "ok") {
    const copy = ERROR_COPY[details.status] ?? ERROR_COPY.error
    return (
      <Shell>
        <div className="text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border border-red-100">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0D1B2A]">{copy.title}</h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{copy.body}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/login">
              <Button variant="primary" size="lg" className="w-full">
                Go to sign in
              </Button>
            </Link>
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">
              Back to home
            </Link>
          </div>
        </div>
      </Shell>
    )
  }

  if (accepted) {
    return (
      <Shell>
        <div className="text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0D1B2A]">You&apos;re in</h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              You&apos;ve joined <span className="font-semibold text-slate-700">{details.workspaceName}</span>.
              Taking you to the workspace…
            </p>
          </div>
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin mx-auto" />
        </div>
      </Shell>
    )
  }

  const roleLabel = ROLE_LABELS[details.role ?? "member"] ?? "Member"

  const handleAccept = async () => {
    setAccepting(true)
    setError(null)
    const result = await acceptInvite(token)
    setAccepting(false)

    if (result.requiresAuth) {
      // Send to register, preserving the invite so they return here after auth.
      const dest = `/register?invite=${encodeURIComponent(token)}`
      router.push(dest)
      return
    }
    if (!result.ok) {
      setError(result.error ?? "We couldn't accept this invitation.")
      return
    }
    setAccepted(true)
    setTimeout(() => {
      router.push("/app")
      router.refresh()
    }, 1400)
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
            <Building2 className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0D1B2A]">You&apos;ve been invited</h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Join{" "}
              <span className="font-semibold text-slate-700">{details.workspaceName}</span>{" "}
              on Propvora.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">Your role</span>
          </div>
          <span className="text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-full px-3 py-0.5">
            {roleLabel}
          </span>
        </div>

        {details.email && (
          <p className="text-xs text-slate-400 text-center">
            This invitation was sent to {details.email}.
          </p>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
        )}

        {authChecked && !authed ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 text-center">
              Sign in or create an account to accept this invitation.
            </p>
            <Link href={`/register?invite=${encodeURIComponent(token)}`}>
              <Button variant="primary" size="lg" className="w-full">
                Create account &amp; join
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link href={`/login?redirectTo=/invite/${encodeURIComponent(token)}`}>
              <Button variant="outline" size="lg" className="w-full">
                I already have an account
              </Button>
            </Link>
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={accepting}
            onClick={handleAccept}
          >
            {accepting ? "Joining…" : "Accept invitation"}
            {!accepting && <ArrowRight className="h-4 w-4 ml-1" />}
          </Button>
        )}
      </div>
    </Shell>
  )
}
