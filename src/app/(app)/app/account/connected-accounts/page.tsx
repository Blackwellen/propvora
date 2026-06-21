"use client"

import { Globe, Link2 } from "lucide-react"

type Provider = {
  id: string
  name: string
  desc: string
  status: "connected" | "not_connected"
  email: string | null
  colour: string
}

const PROVIDERS: Provider[] = [
  {
    id: "google",
    name: "Google",
    desc: "Sign in with Google, sync calendar and contacts",
    status: "not_connected",
    email: null,
    colour: "#EA4335",
  },
  {
    id: "apple",
    name: "Apple",
    desc: "Sign in with Apple ID",
    status: "not_connected",
    email: null,
    colour: "#1C1C1E",
  },
]

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  )
}

function ProviderIcon({ id }: { id: string }) {
  if (id === "google")    return <GoogleIcon />
  if (id === "apple")     return <AppleIcon />
  return <Globe className="w-5 h-5 text-slate-500" />
}

export default function ConnectedAccountsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Connected Accounts</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Manage your connected login providers and integrations
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <div style={{ color: "var(--brand)" }}>
            <Link2 className="w-4 h-4" />
          </div>
          <h3 className="text-[14px] font-bold text-slate-900">OAuth Providers</h3>
        </div>

        {PROVIDERS.map(provider => (
          <div
            key={provider.id}
            className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <ProviderIcon id={provider.id} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800">{provider.name}</p>
                <p className="text-[11.5px] text-slate-400">{provider.desc}</p>
                {provider.email ? (
                  <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                    Connected as {provider.email}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-0.5">Not connected</p>
                )}
              </div>
            </div>
            <div>
              {provider.status === "connected" ? (
                <button className="px-3 py-1.5 rounded-lg border border-red-200 text-[11.5px] font-medium text-red-600 hover:bg-red-50 transition-colors">
                  Disconnect
                </button>
              ) : (
                <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <p className="text-[12.5px] text-slate-500">
          <span className="font-semibold text-slate-700">Administrator note:</span>{" "}
          Contact your workspace administrator to configure OAuth providers for your organisation.
          Connecting providers here will allow single sign-on once configured.
        </p>
      </div>
    </div>
  )
}
