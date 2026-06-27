import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import { QueryProvider } from "@/providers/QueryProvider"
import { AuthProvider } from "@/providers/AuthProvider"
import RefCapture from "@/components/marketing/RefCapture"
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister"
import InstallPrompt from "@/components/pwa/InstallPrompt"
import OfflineBanner from "@/components/pwa/OfflineBanner"
import CookieConsent from "@/components/consent/CookieConsent"
import Analytics from "@/components/consent/Analytics"
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
    "Propvora is UK property-operations & compliance software for landlords and letting agents — manage properties, tenancies, maintenance, compliance and finances in one place.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://propvora.com"),
  applicationName: "Propvora",
  keywords: [
    "property management software", "landlord software", "letting agent software",
    "tenancy management", "property compliance software", "proptech", "UK property software",
    "maintenance management", "rent management",
  ],
  authors: [{ name: "Blackwellen Ltd", url: "https://propvora.com" }],
  creator: "Blackwellen Ltd",
  publisher: "Blackwellen Ltd t/a Propvora",
  category: "Property management software",
  // NB: no global canonical here — a root-level canonical would be inherited by
  // every child route and wrongly point them all at "/". Each page sets its own.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Propvora",
    url: "/",
    title: "Propvora — UK Property Management & Compliance Software",
    description:
      "Manage properties, tenancies, maintenance, compliance and finances in one place. Built for UK landlords and letting agents.",
    images: [{ url: "/propvora-logo-dark.png", width: 1200, height: 630, alt: "Propvora" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Propvora — UK Property Management & Compliance Software",
    description:
      "Manage properties, tenancies, maintenance, compliance and finances in one place. Built for UK landlords and letting agents.",
    images: ["/propvora-logo-dark.png"],
  },
  icons: {
    // Transparent brand mark — no background (replaces the old favicon.ico).
    icon: [{ url: "/propvora-favicon.png", type: "image/png" }],
    shortcut: [{ url: "/propvora-favicon.png", type: "image/png" }],
    apple: [{ url: "/propvora-favicon.png", type: "image/png" }],
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://propvora.com"

// Structured data (JSON-LD) for rich results + AI-search understanding.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Propvora",
      legalName: "Blackwellen Ltd",
      url: SITE_URL,
      logo: `${SITE_URL}/propvora-logo-dark.png`,
      description: "UK property-operations & compliance software for landlords and letting agents.",
      areaServed: "GB",
      sameAs: ["https://blackwellen.com"],
      address: {
        "@type": "PostalAddress",
        addressCountry: "GB",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@propvora.com",
          areaServed: "GB",
          availableLanguage: ["en-GB"],
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Propvora",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-GB",
    },
    {
      "@type": "SoftwareApplication",
      name: "Propvora",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      description: "Manage properties, tenancies, maintenance, compliance and finances in one place.",
      featureList: [
        "Portfolio & tenancy management",
        "Maintenance, work & PPM scheduling",
        "UK compliance tracking",
        "Rent, expenses & finance",
        "Tenant, landlord & supplier portals",
        "Document management & evidence",
      ],
      offers: {
        "@type": "Offer",
        category: "SaaS subscription",
        priceCurrency: "GBP",
        price: "29.00",
        url: `${SITE_URL}/pricing`,
      },
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en-GB"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full" style={{ fontFamily: "var(--font-inter, var(--font-sans))" }}>
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
          />
          <QueryProvider>
            <AuthProvider>
              <Suspense fallback={null}>
                <RefCapture />
              </Suspense>
              <ServiceWorkerRegister />
              <OfflineBanner />
              <InstallPrompt />
              {children}
              <CookieConsent />
              <Analytics />
            </AuthProvider>
          </QueryProvider>
      </body>
    </html>
  )
}
