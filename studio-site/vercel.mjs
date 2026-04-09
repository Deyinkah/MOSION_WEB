const STUDIO_APP_PATHS = [
  "/onboarding",
  "/signin",
  "/signup",
  "/forgot-password",
  "/dashboard",
  "/analytics",
  "/chat",
  "/earnings",
  "/films",
  "/notifications",
  "/payout-method",
  "/pipeline",
  "/profile",
  "/transactions",
  "/withdraw"
];

function getRequiredOrigin(envKey) {
  const value = process.env[envKey]?.trim();

  if (!value) {
    throw new Error(`${envKey} must be set for Studio rewrites.`);
  }

  return value.replace(/\/+$/, "");
}

function createRewrite(source, destination) {
  return {
    source,
    destination
  };
}

function createStudioRewrites() {
  const origin = getRequiredOrigin("STUDIO_WEB_APP_ORIGIN");
  const rewrites = [];

  for (const pathname of STUDIO_APP_PATHS) {
    rewrites.push(
      createRewrite(pathname, `${origin}${pathname}`),
      createRewrite(`${pathname}/:path*`, `${origin}${pathname}/:path*`)
    );
  }

  rewrites.push(createRewrite("/_next/:path*", `${origin}/_next/:path*`));

  return rewrites;
}

export const config = {
  cleanUrls: true,
  trailingSlash: false,
  rewrites: createStudioRewrites()
};
