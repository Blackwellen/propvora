"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

const OTP_LENGTH = 6

export default function Verify2FAPage() {
  const router = useRouter()
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const otp = digits.join("")

  const handleChange = (index: number, value: string) => {
    // Handle paste
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, OTP_LENGTH)
      const next = Array(OTP_LENGTH).fill("")
      pasted.split("").forEach((c, i) => { next[i] = c })
      setDigits(next)
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
      inputRefs.current[focusIndex]?.focus()
      return
    }

    const digit = value.replace(/\D/g, "")
    const next = [...digits]
    next[index] = digit
    setDigits(next)

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleVerify = async () => {
    if (otp.length < OTP_LENGTH) {
      setAuthError("Please enter the full 6-digit code.")
      return
    }
    setIsLoading(true)
    setAuthError(null)
    const supabase = createClient()

    // Get MFA factors
    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
    if (factorsError || !factorsData?.totp?.length) {
      setAuthError("Could not find your 2FA setup. Please sign in again.")
      setIsLoading(false)
      return
    }

    const factorId = factorsData.totp[0].id
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId })

    if (challengeError) {
      setAuthError("Failed to start verification. Please try again.")
      setIsLoading(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: otp,
    })

    if (verifyError) {
      if (verifyError.code === "mfa_verification_rejected") {
        setAuthError("Incorrect code. Please check your authenticator app and try again.")
      } else if (verifyError.code === "mfa_challenge_expired") {
        setAuthError("The code has expired. Please request a new one.")
      } else {
        setAuthError("Verification failed. Please try again.")
      }
      setDigits(Array(OTP_LENGTH).fill(""))
      inputRefs.current[0]?.focus()
      setIsLoading(false)
      return
    }

    router.push("/app")
    router.refresh()
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setIsResending(true)
    setAuthError(null)
    // For TOTP, resend isn't applicable — but for SMS MFA it would be
    // Show a helpful message instead
    await new Promise((r) => setTimeout(r, 500))
    setIsResending(false)
    setResendCooldown(60)
    setAuthError(null)
    // Hint: user should open their authenticator app
  }

  return (
    <>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] border border-[#DBEAFE]">
          <ShieldCheck className="h-6 w-6 text-[#2563EB]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0D1B2A] tracking-tight">
          Two-factor authentication
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>

      {authError && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{authError}</p>
        </div>
      )}

      {/* OTP digit inputs */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6" role="group" aria-label="6-digit verification code">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={6}
            value={digit}
            autoFocus={i === 0}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            aria-label={`Digit ${i + 1}`}
            className={cn(
              "w-11 h-14 rounded-xl border-2 text-center text-xl font-semibold",
              "text-[#0D1B2A] bg-white",
              "transition-all duration-150",
              "focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20",
              "caret-transparent select-none",
              digit
                ? "border-[#2563EB] bg-[#EFF6FF]"
                : "border-slate-200 hover:border-slate-300"
            )}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        loading={isLoading}
        disabled={otp.length < OTP_LENGTH}
        onClick={handleVerify}
        className="w-full"
      >
        {isLoading ? "Verifying…" : "Verify code"}
      </Button>

      {/* Resend */}
      <div className="mt-5 text-center">
        <p className="text-sm text-slate-500">
          Having trouble?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className={cn(
              "font-medium transition-colors",
              resendCooldown > 0 || isResending
                ? "text-slate-400 cursor-not-allowed"
                : "text-[#2563EB] hover:text-[#1d4ed8] cursor-pointer"
            )}
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : isResending
              ? "Sending…"
              : "Resend code"}
          </button>
        </p>
        {resendCooldown > 0 && (
          <p className="mt-1 text-xs text-slate-400">
            Open your authenticator app to get a fresh code.
          </p>
        )}
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </>
  )
}
