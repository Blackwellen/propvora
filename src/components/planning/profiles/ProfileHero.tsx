"use client"

import { useRouter } from "next/navigation"
import {
  ChevronRight,
  ChevronDown,
  Play,
  BarChart2,
  Zap,
  Home,
  Users,
  GraduationCap,
  Sofa,
  Bed,
  PalmtreeIcon,
  ArrowLeftRight,
  Shield,
  Building2,
  Briefcase,
  LayoutGrid,
  RefreshCw,
  Hammer,
} from "lucide-react"
import type { LucideProps } from "lucide-react"
import type { ProfileConfig } from "@/lib/planning/profile-config"
import { PROFILE_CONFIGS } from "@/lib/planning/profile-config"
import ProfileTag from "./ProfileTag"
import ProfileStatusPill from "./ProfileStatusPill"

type IconMap = Record<string, React.ComponentType<LucideProps>>

const ICON_MAP: IconMap = {
  Home,
  Users,
  GraduationCap,
  Sofa,
  Bed,
  Palmtree: PalmtreeIcon,
  ArrowLeftRight,
  Shield,
  Building2,
  Briefcase,
  LayoutGrid,
  RefreshCw,
  Hammer,
}

function ProfileIcon({
  iconName,
  accentColor,
}: {
  iconName: string
  accentColor: string
}) {
  const Icon = ICON_MAP[iconName] ?? Home
  return (
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm shrink-0"
      style={{ backgroundColor: accentColor }}
      aria-hidden="true"
    >
      <Icon className="w-8 h-8 text-white" />
    </div>
  )
}

interface ProfileHeroProps {
  profile: ProfileConfig
}

export default function ProfileHero({ profile }: ProfileHeroProps) {
  const router = useRouter()

  return (
    <div
      className="w-full rounded-2xl border border-slate-100 overflow-hidden mb-6"
      style={{
        background: `linear-gradient(135deg, #ffffff 0%, ${profile.bgColor} 100%)`,
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 pt-6 pb-4">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1 text-xs text-slate-400 mb-5"
          aria-label="Breadcrumb"
        >
          <span className="hover:text-slate-600 cursor-pointer transition-colors">
            Planning
          </span>
          <ChevronRight className="w-3 h-3" />
          <span
            className="hover:text-slate-600 cursor-pointer transition-colors"
            onClick={() => router.push("/app/planning/profiles")}
          >
            Profiles
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">{profile.name}</span>
        </nav>

        {/* 2-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* LEFT COLUMN */}
          <div className="flex-1 min-w-0">
            {/* Icon + Name + Tagline */}
            <div className="flex items-start gap-4 mb-4">
              <ProfileIcon
                iconName={profile.icon}
                accentColor={profile.accentColor}
              />
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                  {profile.name}
                </h1>
                <p className="text-base text-slate-500 mt-1 leading-snug">
                  {profile.tagline}
                </p>
              </div>
            </div>

            {/* Tags */}
            {profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.tags.map((tag) => (
                  <ProfileTag key={tag} label={tag} />
                ))}
              </div>
            )}

            {/* Status pills */}
            <div className="flex flex-wrap gap-2">
              <ProfileStatusPill label="Risk" level={profile.riskLevel} size="sm" />
              <ProfileStatusPill
                label="Mgmt"
                level={profile.managementIntensity}
                size="sm"
              />
              <ProfileStatusPill
                label="Compliance"
                level={profile.complianceIntensity}
                size="sm"
              />
            </div>
          </div>

          {/* RIGHT COLUMN — desktop only */}
          <div className="hidden lg:flex flex-col gap-3 w-64 shrink-0">
            {/* Primary metric card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                {profile.primaryMetric.label}
              </p>
              <p
                className="text-3xl font-bold leading-none mb-1"
                style={{ color: profile.accentColor }}
              >
                {profile.primaryMetric.value}
              </p>
              <p className="text-xs text-slate-400">{profile.primaryMetric.sublabel}</p>
            </div>

            {/* Group chip */}
            <div className="flex justify-end">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm"
                style={{ backgroundColor: profile.accentColor }}
              >
                {profile.groupLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="border-t border-slate-100/80 bg-white/60 backdrop-blur-sm px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-3">
          {/* Primary CTA */}
          <button
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: profile.accentColor }}
            onClick={() =>
              router.push(`/app/planning/profiles/${profile.slug}/overview`)
            }
          >
            <Play className="w-4 h-4" />
            Start Planning Set
          </button>

          {/* Outline buttons */}
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98]"
            onClick={() => router.push("/app/planning/compare")}
          >
            <BarChart2 className="w-4 h-4 text-slate-500" />
            Compare Profile
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98]"
            onClick={() =>
              router.push(
                `/app/planning/profiles/${profile.slug}/example-forecast`
              )
            }
          >
            <Zap className="w-4 h-4 text-slate-500" />
            Run Quick Scenario
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Switch Profile dropdown */}
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all">
              Switch Profile
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 overflow-hidden">
              <div className="py-1 max-h-[min(55vh,256px)] overflow-y-auto overscroll-contain">
                {PROFILE_CONFIGS.filter((p) => p.slug !== profile.slug).map(
                  (p) => (
                    <button
                      key={p.slug}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      onClick={() =>
                        router.push(
                          `/app/planning/profiles/${p.slug}/overview`
                        )
                      }
                    >
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ backgroundColor: p.accentColor }}
                      >
                        {p.number.toString().padStart(2, "0")}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Back link */}
          <button
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            onClick={() => router.push("/app/planning/profiles")}
          >
            ← Back to Profiles
          </button>
        </div>
      </div>
    </div>
  )
}
