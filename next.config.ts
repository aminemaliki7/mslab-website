import type { NextConfig } from "next";

// Only the project's own Storage host may serve optimized images.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const isDev = process.env.NODE_ENV === "development";
const isProduction = process.env.VERCEL_ENV === "production";
const supabaseOrigin = supabaseHost ? `https://${supabaseHost}` : "";
const gtmScriptOrigin = isProduction ? " https://www.googletagmanager.com" : "";
const analyticsOrigins = isProduction
  ? " https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net"
  : "";

/**
 * Content-Security-Policy "without nonces" (bundled Next docs, content-security-policy.md):
 * nonces would force dynamic rendering of every page and lose the Cache Components static
 * shells, so inline scripts/styles are allowed but every other source is locked to this origin.
 * The browser talks to Supabase only to upload print-on-demand files to Storage (ADR-021);
 * all data access stays server-side.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${gtmScriptOrigin}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}${analyticsOrigins}`.trim(),
  "font-src 'self'",
  // Supabase: visitors' files for print-on-demand requests upload straight to Storage.
  `connect-src 'self' ${supabaseOrigin}${isDev ? " ws: wss:" : ""}${analyticsOrigins}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Preview deployments must never be indexed (robots.ts covers crawlers that read robots.txt).
      ...(isProduction ? [] : [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]),
    ];
  },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/catalog/**" }]
      : [],
  },
  partialPrefetching: true,
  experimental: {
    // 404 page for unmatched URLs across multiple root layouts ([lang] and, later, admin).
    globalNotFound: true,
    // Admin image uploads: 5 MB file limit (Storage bucket) + multipart overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
