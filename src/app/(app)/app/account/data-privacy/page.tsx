"use client"

import { useState } from "react"
import { Download, AlertTriangle, Lock, FileText, X } from "lucide-react"

export default function DataPrivacyPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState("")
  const [exportRequested, setExportRequested] = useState(false)

  const canDelete = deleteText === "DELETE"

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Data & Privacy</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Control your data and account lifecycle</p>
      </div>

      {/* Data rights */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <div style={{ color: "#2563EB" }}>
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-[14px] font-bold text-slate-900">Your Data Rights</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            { label: "Right to access",   desc: "View all data we hold about you" },
            { label: "Right to portability", desc: "Export a copy of your data" },
            { label: "Right to erasure",  desc: "Request permanent deletion" },
          ].map(right => (
            <div key={right.label} className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-[12px] font-semibold text-blue-800">{right.label}</p>
              <p className="text-[11px] text-blue-600 mt-0.5">{right.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export data */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <div style={{ color: "#059669" }}>
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-[14px] font-bold text-slate-900">Export My Data</h3>
        </div>
        <p className="text-[13px] text-slate-500 mb-4">
          Download a copy of all your personal data stored in Propvora. Includes your profile, activity,
          preferences, and notification settings.
        </p>
        {exportRequested ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <p className="text-[13px] text-emerald-700 font-medium">
              Export requested — you&apos;ll receive a download link at jamahlthomas1996@gmail.com within 24 hours.
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={() => setExportRequested(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Request data export
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              You will receive a download link by email within 24 hours.
            </p>
          </>
        )}
      </div>

      {/* Privacy settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Privacy Settings</h3>
        {[
          { label: "Analytics & usage data",  desc: "Allow Propvora to collect anonymous usage data to improve the product" },
          { label: "Marketing communications", desc: "Receive product updates, tips and offers via email" },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
            <div className="pr-4">
              <p className="text-[13px] font-medium text-slate-800">{item.label}</p>
              <p className="text-[11.5px] text-slate-400">{item.desc}</p>
            </div>
            <button className="w-10 h-6 rounded-full bg-[#2563EB] relative shrink-0">
              <span className="absolute top-1 right-1 block w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        ))}
      </div>

      {/* Delete account */}
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <div style={{ color: "#DC2626" }}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className="text-[14px] font-bold text-red-900">Delete Account</h3>
        </div>
        <p className="text-[13px] text-red-700 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone and
          all your personal data will be removed within 30 days.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors"
        >
          Request account deletion
        </button>
        <p className="text-[11px] text-red-400 mt-2">
          If you own workspaces, you must transfer or delete them first.
        </p>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-[420px] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div style={{ color: "#DC2626" }}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900">Confirm Account Deletion</h3>
              </div>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteText("") }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[13px] text-slate-600 mb-4">
              This will permanently delete your account and all personal data. This cannot be reversed.
            </p>
            <p className="text-[12.5px] font-semibold text-slate-700 mb-2">
              Type <span className="text-red-600">DELETE</span> to confirm
            </p>
            <input
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-red-400 transition-all mb-4"
              placeholder="Type DELETE"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteText("") }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!canDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete my account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
