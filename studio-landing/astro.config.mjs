import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

const STUDIO_APP_PATHS = [
  "/onboarding", "/signin", "/signup", "/forgot-password",
  "/dashboard", "/analytics", "/chat", "/earnings", "/films",
  "/notifications", "/payout-method", "/pipeline", "/profile",
  "/transactions", "/withdraw", "/partner",
];

function studioAppRewrites() {
  const origin = process.env.STUDIO_WEB_APP_ORIGIN?.trim().replace(/\/+$/, "") ?? "";
  if (!origin) return [];
  const rewrites = [];
  for (const pathname of STUDIO_APP_PATHS) {
    rewrites.push(
      { source: pathname, destination: `${origin}${pathname}` },
      { source: `${pathname}/:path*`, destination: `${origin}${pathname}/:path*` },
    );
  }
  rewrites.push({ source: "/_next/:path*", destination: `${origin}/_next/:path*` });
  return rewrites;
}

export default defineConfig({
  output: "static",
  adapter: vercel(),
  site: "https://studio.mosion.app",
  trailingSlash: "never",
  server: {
    rewrites: [...studioAppRewrites()],
  },
});
