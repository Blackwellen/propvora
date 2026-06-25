"use client"

import { CheckCircle, Shield, Clock, FileText } from 'lucide-react'
import type { ProfileConfig } from '@/lib/planning/profile-config'

interface Props {
  profile: ProfileConfig
}

export default function ComplianceTab({ profile }: Props) {
  const { compliance } = profile

  const priorityBadge: Record<string, string> = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low: 'bg-emerald-100 text-emerald-700',
  }

  const scoreColor =
    compliance.score >= 80
      ? '#10B981'
      : compliance.score >= 60
      ? '#F59E0B'
      : '#EF4444'

  const circumference = 2 * Math.PI * 42
  const dash = (compliance.score / 100) * circumference

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Compliance Score */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#F1F5F9" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={scoreColor}
                strokeWidth="10"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-sm font-bold"
              style={{ color: scoreColor }}
            >
              {compliance.score}%
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Compliance Score</p>
            <p className="text-xl font-bold text-slate-900">{compliance.score}<span className="text-sm text-slate-400">/100</span></p>
            <p className="text-xs text-slate-500">{compliance.scoreLabel}</p>
          </div>
        </div>

        {/* Critical Items */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Critical Items</p>
            <p className="text-2xl font-bold text-slate-900">{compliance.criticalCount}</p>
            <p className="text-xs text-slate-500">Require immediate attention</p>
          </div>
        </div>

        {/* Required Docs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Required Documents</p>
            <p className="text-2xl font-bold text-slate-900">{compliance.requiredDocs.length}</p>
            <p className="text-xs text-slate-500">Documents needed</p>
          </div>
        </div>
      </div>

      {/* 2. Requirements Register */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Requirements Register</h2>
        <div className="rounded-xl overflow-hidden border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Area</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Requirement</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Required</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Renewal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Est Cost</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk If Missing</th>
              </tr>
            </thead>
            <tbody>
              {compliance.requirements.map((req, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-3 text-slate-500 text-xs font-medium">{req.area}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium">{req.item}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityBadge[req.priority] ?? 'bg-slate-100 text-slate-500'}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {req.required ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Optional</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{req.renewal}</td>
                  <td className="px-4 py-3 font-mono text-slate-700 text-xs">{req.estimatedCost}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px]">{req.riskIfMissing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Upcoming Deadlines */}
      {compliance.upcomingDeadlines.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Deadlines</h2>
          <ul className="space-y-3">
            {compliance.upcomingDeadlines.map((deadline, idx) => (
              <li key={idx} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-800">{deadline.label}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500 font-mono">{deadline.due}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityBadge[deadline.priority] ?? 'bg-slate-100 text-slate-500'}`}>
                    {deadline.priority}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Required Documents */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Required Documents</h2>
        <div className="flex flex-wrap gap-2">
          {compliance.requiredDocs.map((doc) => (
            <span
              key={doc}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {doc}
            </span>
          ))}
        </div>
      </div>

      {/* 5. Compliance Guidance */}
      <div className="flex items-start gap-4 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900 mb-1">Compliance Guidance</p>
          <p className="text-sm text-blue-700 leading-relaxed">{compliance.aiInsight}</p>
        </div>
      </div>
    </div>
  )
}
