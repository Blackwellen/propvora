import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      // Cloudflare R2 (private S3-compatible endpoint)
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      // Cloudflare R2 public buckets / custom domains
      { protocol: "https", hostname: "*.r2.dev" },
      // R2 public URL env var domain — add your actual domain here if needed
      // e.g. { protocol: "https", hostname: "pub-xxxxxxxx.r2.dev" },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
};

export default nextConfig;
