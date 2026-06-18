import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://propvora.com"
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app/",
          "/admin/",
          "/supplier-portal/",
          "/user/affiliate/",
          "/login",
          "/register",
          "/onboarding",
          "/invite/",
          "/forgot-password",
          "/reset-password",
          "/verify-2fa",
          "/auth/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
