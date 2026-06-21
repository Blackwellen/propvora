"use client"

import React, { useState } from "react"
import { User, Shield, Bell, Palette, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import ProfileTab       from "@/components/account-settings/ProfileTab"
import SecurityTab      from "@/components/account-settings/SecurityTab"
import NotificationsTab from "@/components/account-settings/NotificationsTab"
import AppearanceTab    from "@/components/account-settings/AppearanceTab"
import PreferencesTab   from "@/components/account-settings/PreferencesTab"

const TABS = [
  { id: "profile",       label: "Profile",       icon: User    },
  { id: "security",      label: "Security",      icon: Shield  },
  { id: "notifications", label: "Notifications", icon: Bell    },
  { id: "appearance",    label: "Appearance",    icon: Palette },
  { id: "preferences",   label: "Preferences",   icon: Settings },
]

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your profile, security, shell appearance and preferences.
        </p>
      </div>

      {/* Tab nav */}
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden border-b border-slate-200 pb-2.5">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Navigate section"
        >
          {TABS.map((tab) => (
            <option key={tab.id} value={tab.id}>{tab.label}</option>
          ))}
        </select>
      </div>
      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        {activeTab === "profile"       && <ProfileTab />}
        {activeTab === "security"      && <SecurityTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "appearance"    && <AppearanceTab />}
        {activeTab === "preferences"   && <PreferencesTab />}
      </div>
    </div>
  )
}
