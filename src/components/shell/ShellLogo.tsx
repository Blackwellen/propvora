"use client"

interface ShellLogoProps {
  collapsed: boolean
  /** Optional workspace brand logo URL. When set, shown instead of the Propvora logo. */
  brandLogoUrl?: string | null
}

export default function ShellLogo({ collapsed, brandLogoUrl }: ShellLogoProps) {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center h-[72px] w-full">
        <img
          src={brandLogoUrl ?? "/propvora-favicon.png"}
          alt={brandLogoUrl ? "Workspace" : "Propvora"}
          style={{ width: 36, height: 36, objectFit: "contain", borderRadius: brandLogoUrl ? 6 : 0 }}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center h-[72px] px-6">
      <img
        src={brandLogoUrl ?? "/propvora-logo-white.png"}
        alt={brandLogoUrl ? "Workspace logo" : "Propvora"}
        style={{ width: 178, height: "auto", maxHeight: 44, objectFit: "contain" }}
      />
    </div>
  )
}
