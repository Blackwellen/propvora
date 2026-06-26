"use client"

import React, { useState, useEffect, Suspense } from "react"
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
  User,
  AlertCircle,
  CheckCircle2,
  Building2,
  ArrowLeft,
  Home,
  Wrench,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { resolveLoginDestination } from "@/lib/actions/workspace"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type Intent = "customer" | "supplier" | "operator"

// ─── Schema ───────────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(80, "Full name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.literal(true, "You must accept the terms to continue"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

type RegisterFormData = z.infer<typeof registerSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapAuthError(code: string | undefined, message: string): string {
  if (code === "user_already_exists" || message.includes("already registered")) {
    return "An account with this email already exists. Try signing in instead."
  }
  if (code === "weak_password" || message.includes("weak")) {
    return "Password must be at least 8 characters and contain letters and numbers."
  }
  if (code === "too_many_requests") {
    return "Too many attempts. Please wait a few minutes and try again."
  }
  if (message.includes("email")) {
    return "Please enter a valid email address."
  }
  return "Something went wrong. Please try again."
}

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

function getPasswordStrength(password: string): { score: number; label: string; colour: string } {
  if (!password) return { score: 0, label: "", colour: "" }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { score, label: "Weak", colour: "bg-red-400" }
  if (score <= 2) return { score, label: "Fair", colour: "bg-amber-400" }
  if (score <= 3) return { score, label: "Good", colour: "bg-yellow-400" }
  if (score <= 4) return { score, label: "Strong", colour: "bg-emerald-400" }
  return { score, label: "Very strong", colour: "bg-emerald-500" }
}

// ─── Right-panel feature lists ────────────────────────────────────────────────

const PANEL_CONTENT: Record<
  Intent,
  { headline: string; sub: string; features: string[] }
> = {
  customer: {
    headline: "Book stays with confidence",
    sub: "Find and book verified properties across the UK.",
    features: [
      "Browse & book verified stays",
      "Instant booking confirmation",
      "Secure checkout & payments",
      "Manage trips & messages",
      "Save favourite properties",
      "Support & dispute resolution",
    ],
  },
  supplier: {
    headline: "Grow your trade business",
    sub: "Connect with property managers who need your skills.",
    features: [
      "Reach hundreds of local operators",
      "Instant job notifications",
      "Secure, fast payments",
      "Build your online reputation",
      "Emergency job alerts",
      "Free to join — no subscription",
    ],
  },
  operator: {
    headline: "Property management, simplified",
    sub: "Everything your team needs in one workspace.",
    features: [
      "Property & Unit Management",
      "Tenancy Management",
      "Work Management",
      "Supplier Management",
      "Invoicing & Payments",
      "AI Copilot",
    ],
  },
}

// Default panel for the chooser screen
const DEFAULT_PANEL = {
  headline: "The smarter way to manage property",
  sub: "One platform — guests, operators, and trades.",
  features: [
    "Book verified short & long stays",
    "Manage your property portfolio",
    "Connect with vetted suppliers",
    "AI-powered operations copilot",
    "Secure payments & compliance",
    "Built for the UK market",
  ],
}

// ─── Account-type chooser cards ────────────────────────────────────────────────

const INTENT_CARDS: {
  intent: Intent
  icon: React.ReactNode
  title: string
  tagline: string
  bullets: string[]
  cta: string
  accentBg: string
  accentText: string
  accentBorder: string
}[] = [
  {
    intent: "customer",
    icon: <Home className="h-6 w-6" />,
    title: "Book a Stay",
    tagline: "Find somewhere to stay",
    bullets: ["Browse verified UK properties", "Book directly — no fees", "Track trips & messages"],
    cta: "Get started",
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-600",
    accentBorder: "border-emerald-200",
  },
  {
    intent: "supplier",
    icon: <Wrench className="h-6 w-6" />,
    title: "Offer Services",
    tagline: "For trade & service providers",
    bullets: ["List your trade on the marketplace", "Receive job requests locally", "Fast, secure payments"],
    cta: "Get started",
    accentBg: "bg-amber-50",
    accentText: "text-amber-600",
    accentBorder: "border-amber-200",
  },
  {
    intent: "operator",
    icon: <LayoutDashboard className="h-6 w-6" />,
    title: "Manage Properties",
    tagline: "For landlords & property managers",
    bullets: ["All-in-one portfolio workspace", "AI-powered operations copilot", "Supplier & tenant management"],
    cta: "Get started",
    accentBg: "bg-blue-50",
    accentText: "text-blue-600",
    accentBorder: "border-blue-200",
  },
]

// ─── Intent chooser (Step 0) ───────────────────────────────────────────────────

function IntentChooser({ onSelect }: { onSelect: (intent: Intent) => void }) {
  // Registration segments are feature-flagged. Operator always; Customer and
  // Supplier appear only when their registration flags are on (V1: off).
  const [seg, setSeg] = useState({ registrationCustomer: false, registrationSupplier: false })
  useEffect(() => {
    let mounted = true
    fetch("/api/flags/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (mounted && d) setSeg({ registrationCustomer: Boolean(d.registrationCustomer), registrationSupplier: Boolean(d.registrationSupplier) }) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])
  const cards = INTENT_CARDS.filter(
    (c) => c.intent === "operator" || (c.intent === "customer" && seg.registrationCustomer) || (c.intent === "supplier" && seg.registrationSupplier)
  )
  return (
    <div className="w-full max-w-[480px]">
      <div className="bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] border border-slate-100/80 p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-[26px] font-bold text-[#06122F] tracking-tight mb-1.5">
            Create your account
          </h1>
          <p className="text-[14px] text-slate-500 leading-relaxed">
            Choose how you want to use Propvora
          </p>
        </div>

        <div className="space-y-3">
          {cards.map((card) => (
            <button
              key={card.intent}
              type="button"
              onClick={() => onSelect(card.intent)}
              className="w-full group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition-all hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                  card.accentBg,
                  card.accentText,
                  card.accentBorder
                )}
              >
                {card.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[15px] font-bold text-[#06122F]">{card.title}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                </div>
                <p className="text-[12.5px] text-slate-500 mb-2">{card.tagline}</p>
                <ul className="space-y-0.5">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-1.5 text-[12px] text-slate-500">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-5 text-center text-[13px] text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

// ─── Registration form (Step 1) ────────────────────────────────────────────────

interface RegisterFormProps {
  intent: Intent
  onBack: () => void
  /** Invite token from URL — carry through email callback and Google OAuth so the
   *  user is redirected to accept the invite after account creation. */
  inviteToken?: string | null
}

function RegisterForm({ intent, onBack, inviteToken }: RegisterFormProps) {
  const isCustomer = intent === "customer"
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successEmail, setSuccessEmail] = useState<string | null>(null)
  // Company name is optional for non-customers — captured separately and stored
  // in user_metadata so it appears in the workspace onboarding pre-fill.
  const [companyName, setCompanyName] = useState("")

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const passwordValue = watch("password", "")
  const strength = getPasswordStrength(passwordValue)

  if (successEmail) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0D1B2A]">Check your email</h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              We&apos;ve sent a verification link to{" "}
              <span className="font-medium text-slate-700">{successEmail}</span>.
              Click the link in the email to verify your account and get started.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Didn&apos;t receive it? Check your spam folder or contact support.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  // Google OAuth signup — carries `intent` into the auth callback so the new
  // account is provisioned + routed for the right persona.
  const handleGoogle = async () => {
    setIsLoading(true)
    setAuthError(null)
    const supabase = createClient()
    const callbackUrl = new URL("/auth/callback", window.location.origin)
    callbackUrl.searchParams.set("intent", intent)
    if (inviteToken) callbackUrl.searchParams.set("invite", inviteToken)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    })
    if (error) {
      setAuthError("Couldn’t start Google sign-up. Please try again or use email.")
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setAuthError(null)

    const gate = await checkAuthRateLimit("signup")
    if (gate) {
      setAuthError(gate)
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const callbackUrl = new URL("/auth/callback", window.location.origin)
    callbackUrl.searchParams.set("intent", intent)
    if (inviteToken) callbackUrl.searchParams.set("invite", inviteToken)
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        data: {
          full_name: data.fullName.trim(),
          display_name: data.fullName.trim(),
          ...(companyName.trim() ? { company_name: companyName.trim() } : {}),
        },
        emailRedirectTo: callbackUrl.toString(),
      },
    })
    if (error) {
      setAuthError(mapAuthError(error.code, error.message))
      setIsLoading(false)
      return
    }

    // When Supabase email confirmation is OFF, signUp returns a live session and
    // NO confirmation email is sent — so the /auth/callback (which routes by
    // intent) never fires. Route by intent here so a customer signup lands in
    // the customer workspace (/user) instead of falling through to onboarding.
    if (signUpData.session) {
      // best-effort welcome email
      try {
        void fetch("/api/email/welcome", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email.trim().toLowerCase(), userName: data.fullName.trim(), workspaceName: "" }),
        })
      } catch { /* non-critical */ }
      // If the user arrived via an invite link, route them straight to accept it.
      if (inviteToken) {
        window.location.assign(`/invite/${encodeURIComponent(inviteToken)}`)
        return
      }
      let destination = "/onboarding"
      try { destination = await resolveLoginDestination(intent) }
      catch { destination = intent === "customer" ? "/user" : intent === "supplier" ? "/onboarding/supplier" : "/onboarding" }
      // Hard navigation (not push + refresh): a client refresh re-requests
      // /register, which the proxy redirects to /app for the now-authenticated
      // user — clobbering the persona destination (a customer would land on
      // /property-manager / onboarding). A full load of `destination` is allowed
      // by the proxy and lands the user where their intent says.
      window.location.assign(destination)
      return
    }
    try {
      void fetch("/api/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          userName: data.fullName.trim(),
          workspaceName: "",
        }),
      })
    } catch {
      // non-critical
    }
    setIsLoading(false)
    setSuccessEmail(data.email.trim().toLowerCase())
  }

  const headings: Record<Intent, { title: string; sub: string }> = {
    customer: {
      title: "Create your guest account",
      sub: "Book stays, track your trips, and save your favourite places.",
    },
    supplier: {
      title: "Join as a supplier",
      sub: "List your trade services and start receiving job requests.",
    },
    operator: {
      title: "Create your account",
      sub: "Start managing your properties smarter and more efficiently.",
    },
  }

  const { title, sub } = headings[intent]

  return (
    <div className="w-full max-w-[440px]">
      <div className="bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] border border-slate-100/80 p-6 sm:p-8">
        {/* Back to chooser */}
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-[26px] font-bold text-[#06122F] tracking-tight mb-1.5">{title}</h1>
          <p className="text-[14px] text-slate-500 leading-relaxed">{sub}</p>
        </div>

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
          {/* Name (+ Company for non-customers) */}
          <div className={isCustomer ? "" : "grid grid-cols-2 gap-3"}>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                Full name
              </label>
              <Input
                type="text"
                aria-label="Full name"
                placeholder="Your full name"
                autoComplete="name"
                autoFocus
                leftElement={<User className="h-4 w-4" />}
                error={errors.fullName?.message}
                {...formRegister("fullName")}
              />
            </div>
            {!isCustomer && (
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Company
                </label>
                <Input
                  type="text"
                  aria-label="Company name"
                  placeholder="Company name"
                  autoComplete="organization"
                  leftElement={<Building2 className="h-4 w-4" />}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              {isCustomer ? "Email address" : "Work email"}
            </label>
            <Input
              type="email"
              aria-label="Email address"
              placeholder={isCustomer ? "Enter your email" : "Enter your work email"}
              autoComplete="email"
              leftElement={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...formRegister("email")}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-slate-700">
              Password
            </label>
            <Input
              type={showPassword ? "text" : "password"}
              aria-label="Password"
              placeholder="Create a strong password"
              autoComplete="new-password"
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
              {...formRegister("password")}
            />

            {passwordValue && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors duration-300",
                        i <= strength.score ? strength.colour : "bg-slate-200"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: "8+ characters", met: passwordValue.length >= 8 },
                { label: "1 number", met: /[0-9]/.test(passwordValue) },
                { label: "1 uppercase", met: /[A-Z]/.test(passwordValue) },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className={cn(
                    "flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1 rounded-full transition-colors",
                    chip.met && passwordValue
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500 border border-transparent"
                  )}
                >
                  {chip.met && passwordValue && <CheckCircle2 className="w-3 h-3" />}
                  {chip.label}
                </span>
              ))}
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Confirm password
            </label>
            <Input
              type={showConfirm ? "text" : "password"}
              aria-label="Confirm password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              leftElement={<Lock className="h-4 w-4" />}
              rightElement={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="pointer-events-auto text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.confirmPassword?.message}
              {...formRegister("confirmPassword")}
            />
          </div>

          {/* Terms */}
          <div className="space-y-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#2563EB]",
                  errors.acceptTerms && "border-red-400"
                )}
                {...formRegister("acceptTerms")}
              />
              <span className="text-[12.5px] text-slate-600 leading-relaxed">
                I agree to the{" "}
                <Link href="/legal/terms" target="_blank" className="font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/legal/privacy" target="_blank" className="font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-[12px] text-red-500 pl-7">{errors.acceptTerms.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            className="w-full !h-11 !rounded-xl"
          >
            {isLoading ? "Creating account…" : "Create account"}
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
            onClick={handleGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-slate-200 bg-white text-[13.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="mt-5 text-center text-[13px] text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

// ─── Right panel ───────────────────────────────────────────────────────────────

function RightPanel({ intent }: { intent: Intent | null }) {
  const content = intent ? PANEL_CONTENT[intent] : DEFAULT_PANEL
  return (
    <div className="hidden lg:block relative w-[52%] xl:w-[55%] shrink-0 overflow-hidden">
      <Image
        src="/auth2.png"
        alt="Modern property"
        fill
        className="object-cover object-center"
        priority
        sizes="55vw"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(15,23,42,0.2) 100%)",
        }}
      />
      <div className="absolute top-0 right-0 bottom-0 flex flex-col justify-center pr-10 pl-6 gap-3">
        <div
          className="rounded-2xl px-6 py-5 shadow-xl max-w-[260px]"
          style={{
            background: "rgba(255,255,255,0.90)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.95)",
          }}
        >
          <h3 className="text-[15px] font-bold text-[#06122F] mb-1 leading-snug">
            {content.headline}
          </h3>
          <p className="text-[12px] text-slate-400 mb-4">{content.sub}</p>
          <div className="space-y-2.5">
            {content.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-[12.5px] font-medium text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 left-8">
        <p className="text-[11.5px] text-white/60">&copy; 2026 Blackwellen Ltd, t/a Propvora.</p>
      </div>
    </div>
  )
}

// ─── Main shell ────────────────────────────────────────────────────────────────

function RegisterShell() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Read intent from URL; validate it's one of the three known values
  const rawIntent = searchParams.get("intent")
  const urlIntent: Intent | null =
    rawIntent === "customer" || rawIntent === "supplier" || rawIntent === "operator"
      ? rawIntent
      : null

  // Invite token from URL — carry through the form so it can be embedded in the
  // email verification callback URL and the Google OAuth redirect URL.
  const inviteToken = searchParams.get("invite") || null

  // Step 0 = chooser, step 1 = form
  const [step, setStep] = useState<0 | 1>(urlIntent ? 1 : 0)
  const [intent, setIntent] = useState<Intent | null>(urlIntent)

  const handleSelect = (chosen: Intent) => {
    setIntent(chosen)
    setStep(1)
    // Reflect in URL without full navigation (back button goes to chooser via state).
    // Preserve the invite token so it survives the chooser → form transition.
    const url = inviteToken
      ? `/register?intent=${chosen}&invite=${encodeURIComponent(inviteToken)}`
      : `/register?intent=${chosen}`
    router.replace(url, { scroll: false })
  }

  const handleBack = () => {
    setStep(0)
    const url = inviteToken ? `/register?invite=${encodeURIComponent(inviteToken)}` : "/register"
    router.replace(url, { scroll: false })
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "linear-gradient(135deg, var(--brand-soft) 0%, var(--bg-surface) 40%, var(--accent-soft) 100%)" }}
    >
      {/* LEFT: form or chooser */}
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

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
          {step === 0 || intent === null ? (
            <IntentChooser onSelect={handleSelect} />
          ) : (
            <RegisterForm intent={intent} onBack={handleBack} inviteToken={inviteToken} />
          )}
        </div>
      </div>

      {/* RIGHT panel */}
      <RightPanel intent={intent} />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterShell />
    </Suspense>
  )
}
