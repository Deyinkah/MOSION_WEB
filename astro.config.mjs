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
function studioRewrites() {
  const origin = process.env.STUDIO_WEB_APP_ORIGIN?.trim().replace(/\/+$/, "") ?? "";
  if (!origin) return [];
  const hostMatch = [{ type: "host", value: STUDIO_HOST }];
  const rewrites = [];
  for (const pathname of STUDIO_APP_PATHS) {
    rewrites.push(
      { source: pathname, destination: `${origin}${pathname}`, has: hostMatch },
      { source: `${pathname}/:path*`, destination: `${origin}${pathname}/:path*`, has: hostMatch },
    );
  }
  rewrites.push({ source: "/_next/:path*", destination: `${origin}/_next/:path*`, has: hostMatch });
  return rewrites;
}

export default defineConfig({
  output: "server",
  adapter: vercel(),
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
