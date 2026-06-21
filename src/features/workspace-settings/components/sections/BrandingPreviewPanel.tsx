"use client"

import React from "react"
import type { BrandColours } from "./BrandColoursSection"

export interface BrandingPreviewPanelProps {
  colours: BrandColours
}

export function BrandingPreviewPanel({ colours }: BrandingPreviewPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Preview</p>
      <div className="border border-slate-100 rounded-xl overflow-hidden">
        {/* Mock topbar */}
        <div
          className="px-4 py-3 border-b border-slate-100 flex items-center gap-3"
          style={{ backgroundColor: colours.primary + "08" }}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
            style={{ backgroundColor: colours.primary }}
          >
            P
          </div>
          <p className="text-[12px] font-bold" style={{ color: colours.primary }}>
            Propvora Demo Workspace
          </p>
          <div className="ml-auto flex items-center gap-2">
            <div
              className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white"
              style={{ backgroundColor: colours.primary }}
            >
              Save
            </div>
          </div>
        </div>
        {/* Mock content */}
        <div className="p-4" style={{ backgroundColor: colours.background }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 rounded-full w-20" style={{ backgroundColor: colours.primary }} />
            <div className="h-2 rounded-full w-32 bg-slate-100" />
          </div>
          <div className="h-2 rounded-full w-full bg-slate-100 mb-2" />
          <div className="h-2 rounded-full w-4/5 bg-slate-100 mb-4" />
          <div className="flex gap-2">
            <div
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
              style={{ backgroundColor: colours.primary }}
            >
              Primary action
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
              style={{ backgroundColor: colours.accent }}
            >
              Accent
            </div>
            <div className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 bg-white border border-slate-200">
              Secondary
            </div>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-3">
        This preview reflects your current colour settings. Actual results may vary slightly.
      </p>
    </div>
  )
}
