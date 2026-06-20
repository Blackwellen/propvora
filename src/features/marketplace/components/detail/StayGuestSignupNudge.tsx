import Link from "next/link"

export default function StayGuestSignupNudge() {
  return (
    <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <p className="text-[14px] font-semibold text-[#0B1B3F]">New to Propvora?</p>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Create a free guest account to save favourites, track your trips and message the host directly.
        </p>
      </div>
      <Link
        href="/register?intent=customer"
        className="shrink-0 inline-flex items-center justify-center rounded-xl bg-[#2563EB] text-white text-[13.5px] font-semibold px-5 py-2.5 hover:bg-[#1d4ed8] transition-colors"
      >
        Sign up free
      </Link>
    </div>
  )
}
