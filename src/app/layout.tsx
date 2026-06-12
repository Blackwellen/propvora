import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import { QueryProvider } from "@/providers/QueryProvider"
import { AuthProvider } from "@/providers/AuthProvider"
import RefCapture from "@/components/marketing/RefCapture"
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister"
import InstallPrompt from "@/components/pwa/InstallPrompt"
import OfflineBanner from "@/components/pwa/OfflineBanner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Propvora — Property Management Software",
    template: "%s | Propvora",
  },
  description:
    "Propvora helps landlords and letting agents manage properties, tenants, maintenance, compliance and finances.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://propvora.com"),
  keywords: ["property management", "landlord software", "tenancy management", "proptech"],
  authors: [{ name: "Propvora Ltd" }],
  creator: "Propvora Ltd",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Propvora",
    title: "Propvora — Property Management Software",
    description:
      "Propvora helps landlords and letting agents manage properties, tenants, maintenance, compliance and finances.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Propvora — Property Management Software",
    description:
      "Propvora helps landlords and letting agents manage properties, tenants, maintenance, compliance and finances.",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Propvora",
    startupImage: [
      { url: "/splash/splash-750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/splash/splash-828x1792.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/splash/splash-1170x2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/splash-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/splash-1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/splash-1620x2160.png", media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/splash/splash-1668x2388.png", media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/splash/splash-2048x2732.png", media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: "#0D1B2A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full" style={{ fontFamily: "var(--font-inter, var(--font-sans))" }}>
          <QueryProvider>
            <AuthProvider>
              <Suspense fallback={null}>
                <RefCapture />
              </Suspense>
              <ServiceWorkerRegister />
              <OfflineBanner />
              <InstallPrompt />
              {children}
            </AuthProvider>
          </QueryProvider>
      </body>
    </html>
  )
}
