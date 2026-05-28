import { defineMiddleware } from "astro:middleware";

const STUDIO_PAGES: Record<string, string> = {
  "/": "/studio",
  "/privacy": "/studio/privacy",
  "/terms": "/studio/terms",
  "/cookies": "/studio/cookies",
  "/accessibility": "/studio/accessibility",
};

const NEXTJS_PREFIXES = [
  "/partner", "/onboarding", "/signin", "/signup", "/forgot-password",
  "/dashboard", "/analytics", "/chat", "/earnings", "/films",
  "/notifications", "/payout-method", "/pipeline", "/profile",
  "/transactions", "/withdraw", "/_next",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const host = context.request.headers.get("host") ?? "";
  const isStudio = host === "studio.mosion.app" || host.startsWith("studio.");

  if (!isStudio) return next();

  const path = new URL(context.request.url).pathname;

  const isNextjs = NEXTJS_PREFIXES.some(
    (p) => path === p || path.startsWith(p + "/")
  );
  if (isNextjs) return next();

  const rewriteTo = STUDIO_PAGES[path];
  if (rewriteTo) return context.rewrite(rewriteTo);

  return next();
});
