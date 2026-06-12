"use client"

interface ShellLogoProps {
  collapsed: boolean
}

export default function ShellLogo({ collapsed }: ShellLogoProps) {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center h-[72px] w-full">
        <img
          src="/propvora-favicon.png"
          alt="Propvora"
          style={{ width: 36, height: 36, objectFit: "contain" }}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center h-[72px] px-6">
      <img
        src="/propvora-logo-white.png"
        alt="Propvora"
        style={{ width: 178, height: "auto", maxHeight: 44, objectFit: "contain" }}
      />
    </div>
  )
}
