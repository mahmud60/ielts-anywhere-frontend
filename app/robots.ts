import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ieltsanywhere.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth-gated / app surfaces — no value in indexing them.
      disallow: [
        "/admin",
        "/dashboard",
        "/reports",
        "/test/",
        "/speaking/start",
        "/learn/",
        "/api-backend/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
