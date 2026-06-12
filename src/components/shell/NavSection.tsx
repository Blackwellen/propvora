"use client"

interface NavSectionProps {
  label?: string
  collapsed: boolean
  children: React.ReactNode
}

export default function NavSection({ label, collapsed, children }: NavSectionProps) {
  return (
    <div className="mb-1">
      {label && !collapsed && (
        <p className="text-[10px] font-bold text-[#8EA9D8] uppercase tracking-[0.08em] px-5 mb-1.5 mt-3">
          {label}
        </p>
      )}
      {label && collapsed && <div className="h-[1px] bg-white/10 mx-3 my-2" />}
      {children}
    </div>
  )
}
