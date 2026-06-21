"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface I18nPreferences {
  countryCode: string
  currency: string
  locale: string
  dateFormat: string
  timezone?: string
}

export async function saveI18nPreferences(data: I18nPreferences) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get active workspace
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.current_workspace_id) throw new Error("No active workspace")

  const settings = {
    countryCode: data.countryCode,
    currency: data.currency,
    locale: data.locale,
    dateFormat: data.dateFormat,
    timezone: data.timezone ?? "Europe/London",
  }

  const { error } = await supabase
    .from("workspaces")
    .update({ settings })
    .eq("id", profile.current_workspace_id)

  if (error) throw new Error(error.message)

  revalidatePath("/property-manager/workspace-settings/preferences")
  revalidatePath("/app/workspace-settings/preferences")
}
