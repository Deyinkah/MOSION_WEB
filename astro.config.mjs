import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";

const STUDIO_HOST = "studio.mosion.app";
const STUDIO_APP_PATHS = [
  "/onboarding", "/signin", "/signup", "/forgot-password",
  "/dashboard", "/analytics", "/chat", "/earnings", "/films",
  "/notifications", "/payout-method", "/pipeline", "/profile",
  "/transactions", "/withdraw",
];
const STUDIO_LANDING_PAGES = [
  { source: "/", destination: "/studio" },
  { source: "/privacy", destination: "/studio/privacy" },
  { source: "/terms", destination: "/studio/terms" },
  { source: "/cookies", destination: "/studio/cookies" },
  { source: "/accessibility", destination: "/studio/accessibility" },
];

function studioRewrites() {
  const origin = process.env.STUDIO_WEB_APP_ORIGIN?.trim().replace(/\/+$/, "") ?? "";
  const hostMatch = [{ type: "host", value: STUDIO_HOST }];
  const rewrites = [];

  // Landing page rewrites — map studio.mosion.app/* to /studio/* static pages
  for (const { source, destination } of STUDIO_LANDING_PAGES) {
    rewrites.push({ source, destination, has: hostMatch });
  }

  // Next.js app rewrites — proxy to external origin
  if (origin) {
    for (const pathname of STUDIO_APP_PATHS) {
      rewrites.push(
        { source: pathname, destination: `${origin}${pathname}`, has: hostMatch },
        { source: `${pathname}/:path*`, destination: `${origin}${pathname}/:path*`, has: hostMatch },
      );
    }
    rewrites.push({ source: "/_next/:path*", destination: `${origin}/_next/:path*`, has: hostMatch });
  }

  return rewrites;
}

export default defineConfig({
  output: "server",
  adapter: vercel({ edgeMiddleware: true }),
  integrations: [sitemap()],
  site: "https://www.mosion.app",
  trailingSlash: "never",
  vite: {
    ssr: {
      noExternal: [],
    },
  },
  server: {
    rewrites: [...studioRewrites()],
  },
});
