/* eslint-disable @next/next/no-img-element */
// ============================================================================
// CopilotBrandMark — the Propvora favicon mark used as the Copilot avatar/badge.
// Replaces the old ✦ gradient glyph so the assistant is branded as Propvora.
// The favicon is a transparent blue "P"; it sits on a light rounded tile so the
// mark reads clearly at small sizes against any background.
// ============================================================================

export default function CopilotBrandMark({
  size = 32,
  radius,
  className = "",
}: {
  size?: number
  radius?: number
  className?: string
}) {
  const r = radius ?? Math.round(size * 0.31)
  const pad = Math.round(size * 0.16)
  return (
    <div
      className={`shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "#FFFFFF",
        border: "1px solid rgba(37,99,235,0.16)",
        boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: pad,
      }}
    >
      <img
        src="/propvora-favicon.png"
        alt="Propvora"
        width={size - pad * 2}
        height={size - pad * 2}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
    </div>
  )
}
