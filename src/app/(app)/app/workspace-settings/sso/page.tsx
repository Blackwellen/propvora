"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Key, Check } from "lucide-react"

const SSO_FEATURES = [
  "SAML 2.0 / OIDC support",
  "Enforce SSO for all users",
  "Just-in-time user provisioning",
  "Google Workspace integration",
  "Microsoft / Azure AD integration",
  "Custom identity provider",
]

export default function SSOPage() {
  const router = useRouter()
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">SAML / SSO</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Single sign-on configuration for your workspace
        </p>
      </div>

      {/* Locked upgrade card */}
      <div className="bg-white rounded-2xl border border-violet-200 p-10 text-center max-w-[560px] mx-auto mt-8 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-5">
          <div style={{ color: "#7C3AED" }}>
            <Key className="w-7 h-7" />
          </div>
        </div>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-violet-100 text-violet-700 uppercase tracking-wide">
          Enterprise Add-on Required
        </span>
        <h2 className="text-[18px] font-black text-slate-900 mt-4 mb-2">SAML / SSO</h2>
        <p className="text-[13.5px] text-slate-500 mb-6">
          Configure SAML 2.0 single sign-on for your workspace. Allow your team to sign in with
          your existing identity provider.
        </p>
        <div className="text-left space-y-0.5">
          {SSO_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2.5 py-2">
              <div className="w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <div style={{ color: "#7C3AED" }}>
                  <Check className="w-2.5 h-2.5" />
                </div>
              </div>
              <p className="text-[12.5px] text-slate-700">{f}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push("/app/workspace-settings/billing")}
          className="mt-6 w-full py-3 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-[#6d28d9] transition-colors"
        >
          Upgrade to Enterprise
        </button>
      </div>

      {/* Configuration preview — disabled/blurred */}
      <div className="max-w-[560px] mx-auto">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">
          Configuration Preview (Enterprise only)
        </p>
        <div
          className="bg-white rounded-2xl border border-slate-200 p-6 pointer-events-none select-none"
          style={{ filter: "blur(2px)", opacity: 0.45 }}
        >
          <h3 className="text-[14px] font-bold text-slate-900 mb-5">SAML Configuration</h3>
          <div className="space-y-4">
            {[
              { label: "Entity ID",     placeholder: "https://your-idp.com/entity" },
              { label: "ACS URL",       placeholder: "https://propvora.io/auth/saml/callback" },
              { label: "Metadata URL",  placeholder: "https://your-idp.com/metadata.xml" },
            ].map(({ label, placeholder }) => (
              <div key={label}>
                <label htmlFor={`sso-${label.replace(/\s+/g, "-").toLowerCase()}`} className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                  {label}
                </label>
                <input
                  id={`sso-${label.replace(/\s+/g, "-").toLowerCase()}`}
                  disabled
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 bg-slate-50"
                />
              </div>
            ))}
            <div className="flex items-center justify-between py-3 border-t border-slate-100">
              <div>
                <p className="text-[13px] font-medium text-slate-800">Enforce SSO for all users</p>
                <p className="text-[11.5px] text-slate-400">Disable password login when SSO is active</p>
              </div>
              <div className="w-10 h-6 rounded-full bg-slate-200">
                <span className="block w-4 h-4 rounded-full bg-white shadow-sm m-1" />
              </div>
            </div>
          </div>
          <button
            disabled
            className="mt-4 w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold opacity-50"
          >
            Save SSO configuration
          </button>
        </div>
      </div>
    </div>
  )
}
