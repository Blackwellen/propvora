"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { AdminWizard, Field, NativeSelect, type WizardStepDef } from "@/components/admin-wizard/AdminWizard"
import { createUser } from "@/lib/admin/mutations"

const ROLE_OPTIONS = [
  { value: "", label: "Standard user" },
  { value: "support", label: "Support staff" },
  { value: "admin", label: "Platform admin" },
]

export default function CreateUserWizard() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("")
  const [mode, setMode] = useState<"invite" | "password">("invite")
  const [password, setPassword] = useState("")

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  function resetForm() {
    setEmail(""); setFirstName(""); setLastName(""); setPhone("")
    setRole(""); setMode("invite"); setPassword(""); setError(null)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    const res = await createUser({
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || undefined,
      platformRole: (role as "" | "support" | "admin") || undefined,
      sendInvite: mode === "invite",
      password: mode === "password" ? password : undefined,
    })
    setSubmitting(false)
    if (!res.ok) { setError(res.error ?? "Could not create user."); return }
    setOpen(false)
    resetForm()
    if (res.data?.id) router.push(`/admin/users/${res.data.id}`)
    else router.refresh()
  }

  const steps: WizardStepDef[] = [
    {
      key: "identity",
      label: "Identity",
      subtitle: "Email & name",
      validate: () => emailValid,
      content: (
        <div className="space-y-4 max-w-md">
          <Field label="Email address" required hint="The account login. Must be unique.">
            <Input type="email" placeholder="person@company.com" value={email} onChange={(e) => setEmail(e.target.value)} error={email && !emailValid ? "Enter a valid email" : undefined} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name"><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></Field>
            <Field label="Last name"><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></Field>
          </div>
          <Field label="Phone" hint="Optional"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        </div>
      ),
    },
    {
      key: "access",
      label: "Access",
      subtitle: "Role & sign-in",
      content: (
        <div className="space-y-4 max-w-md">
          <Field label="Platform role" hint="Platform admins get full console access. This is audited.">
            <NativeSelect value={role} onChange={setRole} options={ROLE_OPTIONS} />
          </Field>
          <Field label="Sign-in method">
            <div className="flex gap-2">
              {(["invite", "password"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`flex-1 h-9 rounded-lg border text-[12.5px] font-semibold transition-colors ${mode === m ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]" : "border-[#E2E8F0] text-slate-600 hover:bg-slate-50"}`}>
                  {m === "invite" ? "Send invite email" : "Set password"}
                </button>
              ))}
            </div>
          </Field>
          {mode === "password" && (
            <Field label="Temporary password" required hint="At least 8 characters. The user should change it on first login.">
              <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
            </Field>
          )}
        </div>
      ),
      validate: () => mode === "invite" || password.length >= 8,
    },
    {
      key: "review",
      label: "Review",
      subtitle: "Confirm & create",
      content: (
        <div className="max-w-md space-y-3">
          <p className="text-[13px] text-slate-500">A real auth user will be created and the action written to the audit log.</p>
          <dl className="rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] text-[13px]">
            {[
              ["Email", email],
              ["Name", [firstName, lastName].filter(Boolean).join(" ") || "—"],
              ["Phone", phone || "—"],
              ["Role", ROLE_OPTIONS.find((r) => r.value === role)?.label ?? "Standard user"],
              ["Sign-in", mode === "invite" ? "Invite email" : "Password set by admin"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <dt className="text-slate-400">{k}</dt>
                <dd className="font-medium text-slate-800 text-right truncate">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    },
  ]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4fd7] transition-colors shadow-sm"
      >
        <UserPlus className="w-4 h-4" /> New User
      </button>
      <AdminWizard
        open={open}
        onOpenChange={setOpen}
        title="New User"
        subtitle="Create a platform account"
        steps={steps}
        submitLabel="Create User"
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
      />
    </>
  )
}
