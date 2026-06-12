"use client"

interface CopilotContextBarProps {
  breadcrumb: string
  onSwitch?: () => void
}

export default function CopilotContextBar({ breadcrumb, onSwitch }: CopilotContextBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100 shrink-0">
      <p className="text-[11px] text-blue-600 font-medium truncate">
        <span className="text-blue-400">Context: </span>
        <span className="text-blue-800 font-semibold">{breadcrumb}</span>
      </p>
      {onSwitch && (
        <button
          onClick={onSwitch}
          className="text-[10px] text-blue-600 font-semibold hover:text-blue-800 transition-colors shrink-0 ml-2"
        >
          Switch context
        </button>
      )}
    </div>
  )
}
