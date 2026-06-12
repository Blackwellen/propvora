import { LeasingTabNav } from "@/components/leasing/LeasingTabNav"

export const dynamic = "force-dynamic"

export default function LeasingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-50 min-h-screen -mx-6 -mt-6">
      <LeasingTabNav />
      <div className="px-6 pt-0">{children}</div>
    </div>
  )
}
