"use client"

import Link from "next/link"
import {
  User, Shield, KeyRound, Bell, Sliders, Monitor, Activity, Link2, Lock,
} from "lucide-react"

// Quick-stat cards: values are honest signposts, not live-fetched data.
// "Security Score" deliberately shows "Review" until MFA is confirmed enabled by the user.
// "Active Sessions" links through to the sessions page which shows live data.
const STATS = [
  { label: "Security Score",  value: "Review",   sub: "Visit Security to configure MFA",  colour: "#D97706", icon: Shield },
  { label: "Active Sessions", value: "—",        sub: "See Sessions & Devices",            colour: "#2563EB", icon: Monitor },
  { label: "Notifications",   value: "—",        sub: "See Notifications to configure",   colour: "#059669", icon: Bell },
  { label: "Last Login",      value: "—",        sub: "See Activity for login history",    colour: "#059669", icon: Activity },
]

const SECTIONS = [
  { title: "Profile",            desc: "Name, email, phone, avatar, timezone",  href: "/property-manager/account/profile",            icon: User,     colour: "#2563EB" },
  { title: "Security",           desc: "Password, MFA, recovery codes",         href: "/property-manager/account/security",           icon: Shield,   colour: "#DC2626" },
  { title: "Login Methods",      desc: "OAuth providers, magic link, email",    href: "/property-manager/account/login",              icon: KeyRound, colour: "#7C3AED" },
  { title: "Notifications",      desc: "Channels, categories, quiet hours",     href: "/property-manager/account/notifications",      icon: Bell,     colour: "#D97706" },
  { title: "Preferences",        desc: "Theme, density, defaults, timezone",    href: "/property-manager/account/preferences",        icon: Sliders,  colour: "#059669" },
  { title: "Sessions & Devices", desc: "Active sessions, device management",    href: "/property-manager/account/sessions",           icon: Monitor,  colour: "#2563EB" },
  { title: "Activity",           desc: "Login history, changes, AI actions",    href: "/property-manager/account/activity",           icon: Activity, colour: "#7C3AED" },
  { title: "Connected Accounts", desc: "Google, Apple and OAuth providers",      href: "/property-manager/account/connected-accounts", icon: Link2,    colour: "#059669" },
  { title: "Data & Privacy",     desc: "Export data, delete account, privacy",  href: "/property-manager/account/data-privacy",       icon: Lock,     colour: "#DC2626" },
]

export default function AccountOverviewPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-slate-900">Account Settings</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">
          Manage your personal identity, login, security and preferences
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: stat.colour + "20" }}
              >
                <div style={{ color: stat.colour }}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
            <p className="text-[18px] font-bold text-slate-900">{stat.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SECTIONS.map(section => (
          <Link
            key={section.href}
            href={section.href}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all group"
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: section.colour + "15" }}
            >
              <div style={{ color: section.colour }}>
                <section.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                {section.title}
              </p>
              <p className="text-[12px] text-slate-500 mt-0.5 truncate">{section.desc}</p>
            </div>
            <div className="text-slate-300 group-hover:text-slate-400 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
