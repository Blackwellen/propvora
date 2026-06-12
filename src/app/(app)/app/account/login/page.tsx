"use client"

import { Mail, Globe, Zap } from "lucide-react"

const LOGIN_METHODS = [
  {
    method: "Email & Password",
    icon: Mail,
    status: "connected" as const,
    email: "jamahlthomas1996@gmail.com",
    primary: true,
    description: "Sign in with your email and password",
  },
  {
    method: "Google",
    icon: Globe,
    status: "not_connected" as const,
    email: null,
    primary: false,
    description: "Sign in with your Google account",
  },
  {
    method: "Magic Link",
    icon: Zap,
    status: "available" as const,
    email: "jamahlthomas1996@gmail.com",
    primary: false,
    description: "Passwordless sign-in via email link",
  },
]

export default function LoginMethodsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Login Methods</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Manage how you sign in to Propvora</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Connected Methods</h3>
        {LOGIN_METHODS.map(item => (
          <div
            key={item.method}
            className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-slate-800">{item.method}</p>
                  {item.primary && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {item.email ?? "Not connected"}
                </p>
                <p className="text-[11px] text-slate-400">{item.description}</p>
              </div>
            </div>
            <div>
              {item.status === "connected" ? (
                <span className="text-[11.5px] font-medium text-emerald-600">Connected</span>
              ) : (
                <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  {item.status === "not_connected" ? "Connect" : "Use"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Password section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Add a login method</h3>
        <p className="text-[12.5px] text-slate-500 mb-4">
          Connect additional providers so you have multiple ways to access your account.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 rounded-xl border border-slate-200 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            Add Google
          </button>
          <button className="px-4 py-2 rounded-xl border border-slate-200 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"/>
            </svg>
            Add Microsoft
          </button>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <p className="text-[12.5px] text-slate-500">
          <span className="font-semibold text-slate-700">Note:</span> Contact your workspace administrator to configure additional OAuth providers for your organisation.
        </p>
      </div>
    </div>
  )
}
