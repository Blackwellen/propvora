"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ChevronDown, ChevronRight, Send, Zap } from 'lucide-react'
import type { ProfileConfig } from '@/lib/planning/profile-config'
import { ProfileKpiCard } from '@/components/planning/profiles'

interface Props {
  profile: ProfileConfig
}

export default function AiQuestionsTab({ profile }: Props) {
  const { aiQuestions } = profile

  const [activeQuestion, setActiveQuestion] = useState<string | null>(null)
  const [customQuestion, setCustomQuestion] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function toggleQuestion(q: string) {
    setActiveQuestion((prev) => (prev === q ? null : q))
  }

  function handleAskAI(question: string) {
    showToast('AI answer coming — start a Planning Set for personalized analysis')
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customQuestion.trim()) return
    setAnswers((prev) => ({
      ...prev,
      [customQuestion.trim()]: 'This is a profile-level suggestion. Start a Planning Set to get personalized AI analysis.',
    }))
    setCustomQuestion('')
  }

  const circumference = 2 * Math.PI * 42
  const dash = (aiQuestions.confidenceScore / 100) * circumference
  const scoreColor =
    aiQuestions.confidenceScore >= 80 ? '#10B981'
    : aiQuestions.confidenceScore >= 60 ? '#F59E0B'
    : '#EF4444'

  const categoryColors: Record<string, string> = {
    'Deal Viability': 'bg-blue-100 text-blue-700',
    Sensitivity: 'bg-purple-100 text-purple-700',
    'Cost Planning': 'bg-teal-100 text-teal-700',
    Risk: 'bg-red-100 text-red-700',
    Strategy: 'bg-indigo-100 text-indigo-700',
    Finance: 'bg-cyan-100 text-cyan-700',
    Tax: 'bg-orange-100 text-orange-700',
    Compliance: 'bg-amber-100 text-amber-700',
    Operations: 'bg-emerald-100 text-emerald-700',
    Marketing: 'bg-pink-100 text-pink-700',
    Yield: 'bg-violet-100 text-violet-700',
  }

  function categoryBadge(cat: string): string {
    return categoryColors[cat] ?? 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: profile.accentColor }} />
          <span>{toast}</span>
        </div>
      )}

      {/* 1. Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Confidence Score */}
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
              {aiQuestions.confidenceScore}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Confidence Score</p>
            <p className="text-xl font-bold text-slate-900">{aiQuestions.confidenceScore}<span className="text-sm text-slate-400">/100</span></p>
            <p className="text-xs text-slate-500">{aiQuestions.confidenceLabel}</p>
          </div>
        </div>

        {/* Key Drivers */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${profile.accentColor}18` }}
          >
            <Zap className="w-5 h-5" style={{ color: profile.accentColor }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Key Drivers</p>
            <p className="text-2xl font-bold text-slate-900">{aiQuestions.keyDrivers.length}</p>
            <p className="text-xs text-slate-500">Value drivers identified</p>
          </div>
        </div>

        {/* Suggested Questions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Suggested Questions</p>
            <p className="text-2xl font-bold text-slate-900">{aiQuestions.suggestedQuestions.length}</p>
            <p className="text-xs text-slate-500">Ready to explore</p>
          </div>
        </div>
      </div>

      {/* 2. Confidence Score Display */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#F1F5F9" strokeWidth="9" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={scoreColor}
                strokeWidth="9"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: scoreColor }}>{aiQuestions.confidenceScore}</span>
              <span className="text-xs text-slate-400 font-medium">/100</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{aiQuestions.confidenceLabel}</h2>
            <p className="text-sm text-slate-500 mt-1">
              This profile has a confidence score of <span className="font-semibold text-slate-700">{aiQuestions.confidenceScore}/100</span> based on available market data, regulatory clarity, and income model predictability.
            </p>
            <p className="text-xs text-slate-400 mt-2">Scores above 80 indicate high-confidence modelling. Below 60 warrants additional due diligence.</p>
          </div>
        </div>
      </div>

      {/* 3. Suggested Questions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5" style={{ color: profile.accentColor }} />
          <h2 className="text-lg font-semibold text-slate-900">Suggested Questions</h2>
        </div>
        <div className="space-y-3">
          {aiQuestions.suggestedQuestions.map((q, idx) => {
            const isOpen = activeQuestion === q.question
            return (
              <div
                key={idx}
                className="border border-slate-100 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(q.question)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: profile.accentColor }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{q.question}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryBadge(q.category)}`}>
                        {q.category}
                      </span>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 bg-slate-50/60 border-t border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">{q.insight}</p>
                    <button
                      onClick={() => handleAskAI(q.question)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-white text-sm font-medium transition-all"
                      style={{ backgroundColor: profile.accentColor }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Ask AI
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. Key Drivers */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Value Drivers</h2>
        <div className="flex flex-wrap gap-2">
          {aiQuestions.keyDrivers.map((driver) => (
            <span
              key={driver}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border"
              style={{
                borderColor: `${profile.accentColor}40`,
                backgroundColor: `${profile.accentColor}0D`,
                color: profile.accentColor,
              }}
            >
              <Zap className="w-3.5 h-3.5" />
              {driver}
            </span>
          ))}
        </div>
      </div>

      {/* 5. Quick Stats */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {aiQuestions.quickStats.map((stat) => (
            <ProfileKpiCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              sublabel={stat.sublabel}
              trend={stat.trend}
              highlight={stat.highlight}
              accentColor={profile.accentColor}
            />
          ))}
        </div>
      </div>

      {/* 6. AI Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <h2 className="text-lg font-semibold text-slate-900">AI Recommendations</h2>
        </div>
        <ol className="space-y-3">
          {aiQuestions.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <span className="text-sm text-violet-800 leading-relaxed">{rec}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* 7. Custom Question Input */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Ask a Custom Question</h2>
        <p className="text-sm text-slate-500 mb-4">Get a profile-level response or start a Planning Set for personalised AI analysis.</p>

        {/* Past answers */}
        {Object.keys(answers).length > 0 && (
          <div className="space-y-3 mb-4">
            {Object.entries(answers).map(([q, a]) => (
              <div key={q} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-sm font-semibold text-slate-800 mb-1">{q}</p>
                <p className="text-sm text-slate-500">{a}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleCustomSubmit} className="flex gap-3">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="e.g. What yield should I target for this model?"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': profile.accentColor } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={!customQuestion.trim()}
            className="px-4 py-3 rounded-xl text-white font-medium text-sm flex items-center gap-2 disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: profile.accentColor }}
          >
            <Send className="w-4 h-4" />
            Ask
          </button>
        </form>
      </div>

      {/* 8. Start Planning Set CTA */}
      <div
        className="rounded-2xl p-8 text-white"
        style={{
          background: `linear-gradient(135deg, ${profile.accentColor}, ${profile.accentColor}CC)`,
        }}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-white/80" />
              <p className="text-sm font-semibold text-white/80 uppercase tracking-wide">AI-Powered Analysis</p>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Get Personalised AI Analysis</h3>
            <p className="text-sm text-white/80 max-w-md leading-relaxed">
              Start a Planning Set to unlock full AI-powered modelling, scenario analysis, and compliance tracking tailored to your specific deal and property details.
            </p>
          </div>
          <Link
            href={`/property-manager/planning/wizard?profile=${profile.slug}`}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-sm font-semibold rounded-xl transition-all hover:bg-white/90"
            style={{ color: profile.accentColor }}
          >
            <Zap className="w-4 h-4" />
            Start Planning Set
          </Link>
        </div>
      </div>
    </div>
  )
}
