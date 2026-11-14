import type { NextConfig } from "next";

// Only the project's own Storage host may serve optimized images.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  cacheComponents: true,
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
