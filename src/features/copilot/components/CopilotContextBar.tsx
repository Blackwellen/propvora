"use client"

interface CopilotContextBarProps {
  breadcrumb: string
  onSwitch?: () => void
}

export default function CopilotContextBar({ breadcrumb, onSwitch }: CopilotContextBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[var(--brand-soft)] border-b border-[var(--color-brand-100)] shrink-0">
      <p className="text-[11px] text-[var(--brand)] font-medium truncate">
        <span className="text-[var(--color-brand-400)]">Context: </span>
        <span className="text-[var(--brand-strong)] font-semibold">{breadcrumb}</span>
      </p>
      {onSwitch && (
        <button
          onClick={onSwitch}
          className="text-[10px] text-[var(--brand)] font-semibold hover:text-[var(--brand-strong)] transition-colors shrink-0 ml-2"
        >
          Switch context
        </button>
      )}
    </div>
  )
}
