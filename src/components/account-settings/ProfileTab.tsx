"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/lib/supabase/client"
import AvatarUploader from "@/components/settings/AvatarUploader"

const profileSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  phone:     z.string().optional(),
})
type ProfileData = z.infer<typeof profileSchema>

export default function ProfileTab() {
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [email,       setEmail]       = useState("")
  const [userId,      setUserId]      = useState<string | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [avatarKey,   setAvatarKey]   = useState<string | null>(null)
  const [avatarSaved, setAvatarSaved] = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone: "" },
  })

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)
        setEmail(user.email ?? "")
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name:display_name, phone, avatar_url, current_workspace_id")
          .eq("id", user.id)
          .maybeSingle()
        if (error && (error as { code?: string }).code !== "42P01") { /* non-fatal */ }
        setAvatarKey((profile?.avatar_url as string | null) ?? null)
        let wsId = (profile?.current_workspace_id as string | null) ?? null
        if (!wsId) {
          const { data: m } = await supabase
            .from("workspace_members")
            .select("workspace_id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle()
          wsId = (m?.workspace_id as string | null) ?? null
        }
        setWorkspaceId(wsId)
        form.reset({
          full_name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
          phone: profile?.phone ?? "",
        })
      } catch { /* keep empty */ }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function persistAvatar(key: string) {
    setAvatarKey(key)
    try {
      const supabase = createClient()
      const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      await supabase.from("profiles").update({ avatar_url: key }).eq("id", uid)
      setAvatarSaved(true)
      setTimeout(() => setAvatarSaved(false), 2000)
    } catch { /* non-fatal */ }
  }

  const nameValue = form.watch("full_name") || email || "U"
  const profileInitials = nameValue
    .trim().split(/\s+/).map((w: string) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "U"

  async function onSubmit(data: ProfileData) {
    setSaving(true); setError(null)
    try {
      const supabase = createClient()
      const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
      if (!uid) { setError("Not signed in."); return }
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: data.full_name.trim() || null, phone: data.phone?.trim() || null })
        .eq("id", uid)
      if (error && (error as { code?: string }).code !== "42P01") { setError("Failed to save."); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("An unexpected error occurred.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <AvatarUploader
          currentKey={avatarKey}
          workspaceId={workspaceId}
          initials={profileInitials}
          onUploaded={persistAvatar}
        />
        {avatarSaved && (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <Check className="w-3 h-3" /> Photo saved
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Full Name</label>
          <input
            {...form.register("full_name")}
            className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
          {form.formState.errors.full_name && (
            <p className="text-xs text-red-600">{form.formState.errors.full_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            value={email}
            disabled
            className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400">Contact support to change email</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Phone</label>
          <input
            {...form.register("phone")}
            placeholder="07700 900000"
            className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button
        type="submit"
        variant="primary"
        loading={saving}
        leftIcon={saved ? <Check className="w-4 h-4" /> : undefined}
      >
        {saved ? "Saved!" : "Save Changes"}
      </Button>
    </form>
  )
}
