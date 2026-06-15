"use client"

import React, { useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  Shield,
  Cloud,
  Users,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

function mapAuthError(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "Incorrect email or password. Please try again."
    case "email_not_confirmed":
      return "Please verify your email address before signing in."
    case "too_many_requests":
      return "Too many attempts. Please wait a few minutes and try again."
    case "user_not_found":
      return "No account found with this email address."
    default:
      return "Something went wrong. Please try again."
  }
}

/**
 * Hit the server-side rate gate (/api/auth/rate-check) before a sensitive auth
 * call. Returns a friendly error string when throttled, or null to proceed.
 * Fails OPEN on network/parse errors so the gate never blocks a real login.
 */
async function checkAuthRateLimit(action: string): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/rate-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    if (res.status === 429) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      return body?.error ?? "Too many attempts. Please wait and try again."
    }
    return null
  } catch {
    return null
  }
}

const ALLOWED_REDIRECTS = ["/app", "/admin", "/supplier-portal", "/affiliate", "/invite", "/onboarding"]

function safeRedirect(url: string): string {
  return ALLOWED_REDIRECTS.some((allowed) => url.startsWith(allowed)) ? url : "/app"
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get("redirectTo") ?? "/app")
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setAuthError(null)

    // Application-side rate limit (per IP) before hitting Supabase auth.
    const gate = await checkAuthRateLimit("login")
    if (gate) {
      setAuthError(gate)
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    })
    if (error) {
      setAuthError(mapAuthError(error.code ?? error.message))
      setIsLoading(false)
      return
    }

    // Decide destination: an explicit redirectTo wins; otherwise route users
    // with no workspace into onboarding, and everyone else into the app.
    let destination = redirectTo
    if (redirectTo === "/app") {
      try {
        const userId = signInData.user?.id
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("current_workspace_id")
            .eq("id", userId)
            .maybeSingle()

          let hasWorkspace = !!profile?.current_workspace_id
          if (!hasWorkspace) {
            const { data: membership } = await supabase
              .from("workspace_members")
              .select("workspace_id")
              .eq("user_id", userId)
              .limit(1)
              .maybeSingle()
            hasWorkspace = !!membership?.workspace_id
          }
          if (!hasWorkspace) destination = "/onboarding"
        }
      } catch {
        // Non-fatal — default to /app.
      }
    }

    router.push(destination)
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 40%, #EEF2FF 100%)" }}
    >
      {/* LEFT: Form panel */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-5">
          <Link href="/" className="flex items-center">
            <Image
              src="/propvora-logo-dark.png"
              alt="Propvora"
              width={520}
              height={130}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <Link
            href="/"
            className="text-[13px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            Back to home
          </Link>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-10">
          <div className="w-full max-w-[420px]">
            {/* Card */}
            <div className="bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] border border-slate-100/80 p-6 sm:p-8">
              {/* Heading */}
              <div className="mb-7">
                <h1 className="text-[28px] font-bold text-[#06122F] tracking-tight mb-1.5">
                  Welcome back
                </h1>
                <p className="text-[14px] text-slate-500 leading-relaxed">
                  Sign in to access your property management workspace.
                </p>
              </div>

              {/* Error */}
              {authError && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-[13px] text-red-700">{authError}</p>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-4 [&_input]:!bg-white [&_input]:!text-slate-900 [&_input]:!border-[#E2E8F0]"
              >
                {/* Email */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <Input
                    type="email"
                    aria-label="Email address"
                    placeholder="Enter your email"
                    autoComplete="email"
                    autoFocus
                    leftElement={<Mail className="h-4 w-4" />}
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[12.5px] font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    aria-label="Password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    leftElement={<Lock className="h-4 w-4" />}
                    rightElement={
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="pointer-events-auto text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    error={errors.password?.message}
                    {...register("password")}
                  />
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 accent-[#2563EB]"
                    {...register("rememberMe")}
                  />
                  <span className="text-[13px] text-slate-600">Remember me</span>
                </label>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  className="w-full !h-11 !rounded-xl"
                >
                  {isLoading ? "Signing in…" : "Sign in"}
                </Button>

                {/* Divider */}
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-[12px] text-slate-400">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-slate-200 bg-white text-[13.5px] font-medium text-slate-400 cursor-not-allowed opacity-70"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                  <span className="text-[11px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">Soon</span>
                </button>
              </form>

              <p className="mt-6 text-center text-[13px] text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                >
                  Sign up
                </Link>
              </p>

              {/* Trust footer inside card */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2">
                <Shield className="w-3.5 h-3.5 text-slate-300" />
                <p className="text-[11.5px] text-slate-400 text-center">
                  Secure login · By signing in you agree to our{" "}
                  <Link href="/legal/terms" className="underline hover:text-slate-600">Terms</Link>{" "}
                  &{" "}
                  <Link href="/legal/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Full-height property image with glass cards */}
      <div className="hidden lg:block relative w-[52%] xl:w-[55%] shrink-0 overflow-hidden">
        {/* Background image */}
        <Image
          src="/auth1.png"
          alt="Modern property"
          fill
          className="object-cover object-center"
          priority
          sizes="55vw"
        />

        {/* Subtle light overlay — keeps image bright, premium feel */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(15,23,42,0.18) 100%)",
          }}
        />

        {/* Floating glass cards — right-aligned stacked */}
        <div className="absolute inset-0 flex flex-col justify-center items-end pr-12 gap-4">
          {(
            [
              {
                icon: Shield,
                title: "Enterprise-grade security",
                desc: "Your data is protected with industry-leading security.",
              },
              {
                icon: Cloud,
                title: "Always available",
                desc: "Access your workspace anywhere, anytime.",
              },
              {
                icon: Users,
                title: "Built for teams",
                desc: "Collaborate with your team and streamline property operations.",
              },
            ] as const
          ).map((card) => (
            <div
              key={card.title}
              className="w-[220px] rounded-2xl px-5 py-4 shadow-lg"
              style={{
                background: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.9)",
              }}
            >
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center mb-3">
                <card.icon className="w-4.5 h-4.5 text-[#2563EB]" style={{ width: 18, height: 18 }} />
              </div>
              <p className="text-[13.5px] font-bold text-[#06122F] mb-1">{card.title}</p>
              <p className="text-[12px] text-slate-500 leading-snug">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom copyright */}
        <div className="absolute bottom-6 left-8">
          <p className="text-[11.5px] text-white/60">&copy; 2026 Blackwellen Ltd, t/a Propvora.</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
