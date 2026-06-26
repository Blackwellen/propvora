import Image from "next/image"
import Link from "next/link"
import { Lock, ArrowRight } from "lucide-react"

interface TrialFeatureGateProps {
  /** Which feature is being gated — shown in the headline. */
  featureName: string
  /** Short description of what the feature does (1–2 sentences). */
  description: string
  /** Bullet-point benefits shown below the description (3–4 max). */
  benefits?: string[]
}

/**
 * Full-page branded gate shown when a trial user tries to access a paid feature.
 * Used server-side (no "use client") so it renders on the first paint.
 */
export default function TrialFeatureGate({
  featureName,
  description,
  benefits = [],
}: TrialFeatureGateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 min-h-[60vh]">
      <div className="w-full max-w-md flex flex-col items-center text-center gap-6">
        {/* Brand mark */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl border border-slate-100 shadow bg-white flex items-center justify-center">
            <Image
              src="/favicon.ico"
              alt="Propvora"
              width={44}
              height={44}
              className="object-contain"
              unoptimized
            />
          </div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Propvora
          </p>
        </div>

        {/* Lock icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center">
          <Lock className="w-6 h-6 text-slate-500" />
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[20px] font-bold text-slate-900 leading-snug">
            {featureName} requires a paid subscription
          </h1>
          <p className="text-[14px] text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Benefits list */}
        {benefits.length > 0 && (
          <ul className="w-full flex flex-col gap-2 text-left">
            {benefits.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                </span>
                <span className="text-[13px] text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <div className="w-full flex flex-col gap-2 pt-2">
          <Link
            href="/property-manager/workspace-settings/subscription"
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white text-[14px] font-semibold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow"
          >
            <Image src="/favicon.ico" alt="" width={18} height={18} className="rounded-sm opacity-90" unoptimized />
            Subscribe to Propvora
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[11.5px] text-slate-400">
            No long-term contract — cancel anytime.{" "}
            <Link
              href="/property-manager/workspace-settings/subscription"
              className="underline underline-offset-2 hover:text-slate-600"
            >
              View plans
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
