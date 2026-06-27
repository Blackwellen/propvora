"use client"

import { Download, KeyRound, Smartphone } from "lucide-react"
import { useCustomerToast } from "../../components/toast"

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function SecRow({
  icon: Icon,
  title,
  sub,
  cta,
  onClick,
}: {
  icon: typeof KeyRound
  title: string
  sub: string
  cta: string
  onClick: () => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </span>
        <div>
          <p className="text-[12.5px] font-semibold text-slate-800">{title}</p>
          <p className="text-[11px] text-slate-400">{sub}</p>
        </div>
      </div>
      <button onClick={onClick} className="text-[11.5px] font-semibold text-[var(--brand)]">
        {cta}
      </button>
    </div>
  )
}

export default function SecuritySection() {
  const { toast } = useCustomerToast()
  return (
    <Panel title="Security">
      <SecRow
        icon={KeyRound}
        title="Password"
        sub="Last changed 2 months ago"
        cta="Change password"
        onClick={() => toast("Change password — coming soon", "info")}
      />
      <SecRow
        icon={Smartphone}
        title="Two-factor authentication"
        sub="Authenticator app enabled"
        cta="Manage"
        onClick={() => toast("Manage 2FA — coming soon", "info")}
      />
      <SecRow
        icon={Download}
        title="Download your data"
        sub="Get a copy of your account data"
        cta="Request"
        onClick={() => toast("Data export requested", "success")}
      />
    </Panel>
  )
}
