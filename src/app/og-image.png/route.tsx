import { ImageResponse } from "next/og"

// Branded 1200×630 Open Graph card served at /og-image.png.
// Generated dynamically so there is no binary asset to keep in sync, and so the
// 8 marketing/legal pages that reference "/og-image.png" always resolve to a
// real, on-brand preview instead of a 404.
export const contentType = "image/png"
export const size = { width: 1200, height: 630 }

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #0D1B2A 0%, #1B263B 55%, #16324f 100%)",
          color: "#F8FAFC",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
              fontSize: 38,
              fontWeight: 800,
              color: "#0D1B2A",
            }}
          >
            P
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
            Propvora
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Run every property operation with clarity.
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.35,
              color: "#94A3B8",
              maxWidth: 920,
            }}
          >
            UK property operations, compliance and finance — portfolio, work,
            money and portals in one premium workspace.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 24,
            color: "#64748B",
          }}
        >
          <div style={{ color: "#38bdf8", fontWeight: 600 }}>propvora.com</div>
          <div>·</div>
          <div>Built for UK landlords &amp; letting agents</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
