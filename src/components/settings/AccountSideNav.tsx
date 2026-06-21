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
    href: "/property-manager/account",
    icon: User,
  },
  {
    key: "profile",
    label: "Profile",
    href: "/property-manager/account/profile",
    icon: User,
  },
  {
    key: "security",
    label: "Security",
    href: "/property-manager/account/security",
    icon: Shield,
  },
  {
    key: "login",
    label: "Login Methods",
    href: "/property-manager/account/login",
    icon: KeyRound,
  },
  {
    key: "notifications",
    label: "Notifications",
    href: "/property-manager/account/notifications",
    icon: Bell,
  },
  {
    key: "preferences",
    label: "Preferences",
    href: "/property-manager/account/preferences",
    icon: Sliders,
  },
  {
    key: "sessions",
    label: "Sessions & Devices",
    href: "/property-manager/account/sessions",
    icon: Monitor,
  },
  {
    key: "activity",
    label: "Activity",
    href: "/property-manager/account/activity",
    icon: Activity,
  },
  {
    key: "connected-accounts",
    label: "Connected Accounts",
    href: "/property-manager/account/connected-accounts",
    icon: Link2,
  },
  {
    key: "data-privacy",
    label: "Data & Privacy",
    href: "/property-manager/account/data-privacy",
    icon: Lock,
  },
]
