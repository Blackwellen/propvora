"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setAuthError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(
      data.email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    )

    if (error && error.code === "too_many_requests") {
      setAuthError("Too many attempts. Please wait a few minutes and try again.")
      setIsLoading(false)
      return
    }

    // Always show success to prevent email enumeration
    setSubmittedEmail(data.email.trim().toLowerCase())
    setSubmitted(true)
    setIsLoading(false)
  }

  if (submitted) {
    return (
      <div className="text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0D1B2A]">Check your inbox</h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            If an account exists for{" "}
            <span className="font-medium text-slate-700">{submittedEmail}</span>,
            we&apos;ve sent a password reset link. Check your spam folder if it
            doesn&apos;t arrive within a few minutes.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="w-full"
          onClick={() => {
            setSubmitted(false)
            setSubmittedEmail("")
          }}
        >
          Send again
        </Button>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] border border-[#DBEAFE]">
          <Mail className="h-6 w-6 text-[#2563EB]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0D1B2A] tracking-tight">
          Forgot your password?
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {authError && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          leftElement={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? "Sending reset link…" : "Send reset link"}
        </Button>
      </form>

      <div className="mt-5 text-center">
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
