import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

/**
 * Only the Vercel PRODUCTION deployment is crawlable. Local builds and preview deployments
 * disallow everything so test content never reaches search engines.
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === "production";
  if (!isProduction) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
