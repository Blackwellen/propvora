"use client"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "#0f172a", color: "#fff", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="text-center max-w-sm w-full">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
        >
          <span className="text-2xl font-bold text-white">P</span>
        </div>
        <h1 className="text-2xl font-semibold mb-3 text-white">You&apos;re offline</h1>
        <p className="mb-6" style={{ color: "#94a3b8" }}>
          Propvora needs a connection for live property data. Check your network and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="font-semibold px-6 py-3 rounded-xl text-white"
          style={{ background: "#2563EB" }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
