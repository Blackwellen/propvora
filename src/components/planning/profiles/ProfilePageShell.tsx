"use client"

import React from "react"
import type { ProfileConfig } from "@/lib/planning/profile-config"
import ProfileHero from "./ProfileHero"
import ProfileTabs from "./ProfileTabs"

interface ProfilePageShellProps {
  profile: ProfileConfig
  activeTab: string
  children: React.ReactNode
}

export default function ProfilePageShell({
  profile,
  activeTab,
  children,
}: ProfilePageShellProps) {
  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Hero */}
        <ProfileHero profile={profile} />

        {/* Tab Navigation */}
        <ProfileTabs profile={profile} activeTab={activeTab} />

        {/* Tab Content */}
        <main
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-label={`${activeTab} content`}
          className="w-full"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
