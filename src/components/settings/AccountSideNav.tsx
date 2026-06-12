"use client"

import {
  User,
  Shield,
  KeyRound,
  Bell,
  Sliders,
  Monitor,
  Activity,
  Link2,
  Lock,
} from "lucide-react"
import type { SettingsNavItem } from "./SettingsShell"

export const ACCOUNT_NAV: SettingsNavItem[] = [
  {
    key: "overview",
    label: "Overview",
    href: "/app/account",
    icon: User,
  },
  {
    key: "profile",
    label: "Profile",
    href: "/app/account/profile",
    icon: User,
  },
  {
    key: "security",
    label: "Security",
    href: "/app/account/security",
    icon: Shield,
  },
  {
    key: "login",
    label: "Login Methods",
    href: "/app/account/login",
    icon: KeyRound,
  },
  {
    key: "notifications",
    label: "Notifications",
    href: "/app/account/notifications",
    icon: Bell,
  },
  {
    key: "preferences",
    label: "Preferences",
    href: "/app/account/preferences",
    icon: Sliders,
  },
  {
    key: "sessions",
    label: "Sessions & Devices",
    href: "/app/account/sessions",
    icon: Monitor,
  },
  {
    key: "activity",
    label: "Activity",
    href: "/app/account/activity",
    icon: Activity,
  },
  {
    key: "connected-accounts",
    label: "Connected Accounts",
    href: "/app/account/connected-accounts",
    icon: Link2,
  },
  {
    key: "data-privacy",
    label: "Data & Privacy",
    href: "/app/account/data-privacy",
    icon: Lock,
  },
]
