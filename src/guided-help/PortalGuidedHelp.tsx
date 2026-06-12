"use client"

import React from "react"
import { GuidedHelpProvider } from "./GuidedHelpProvider"
import FirstUseModal from "./components/FirstUseModal"
import TutorialLauncher from "./components/TutorialLauncher"

/**
 * Mounts the Guided Help engine for external portal shells (landlord / supplier /
 * tenant / generic). Uses the "portal" surface so portal users only ever see the
 * simple portal welcome guides — never internal app walkthroughs. Persistence
 * falls back to localStorage for magic-link users who aren't Supabase-authed.
 */
export default function PortalGuidedHelp({ children }: { children: React.ReactNode }) {
  return (
    <GuidedHelpProvider surface="portal">
      {children}
      <FirstUseModal />
      <TutorialLauncher surface="portal" />
    </GuidedHelpProvider>
  )
}
