const STUDIO_APP_PATHS = [
  "/dashboard",
  "/onboarding",
  "/signin",
  "/signup",
  "/forgot-password",
  "/overview",
  "/analytics",
  "/chat",
  "/revenue",
  "/films",
  "/notifications",
  "/payout-method",
  "/pipeline",
  "/account",
  "/purchases",
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
  const partnerBase = `${origin}/partner`;
  return [
    createRewrite("/partner", partnerBase),
    createRewrite("/partner/:path*", `${partnerBase}/:path*`),
    createRewrite("/_next/:path*", `${origin}/_next/:path*`)
  ];
}

function createStudioLegacyRedirects() {
  const redirects = [];

  for (const pathname of STUDIO_APP_PATHS) {
    if (pathname === "/dashboard") {
      redirects.push(
        {
          source: pathname,
          destination: "/partner/overview",
          permanent: false
        },
        {
          source: `${pathname}/:path*`,
          destination: "/partner/overview",
          permanent: false
        }
      );
      continue;
    }

    redirects.push(
      {
        source: pathname,
        destination: `/partner${pathname}`,
        permanent: false
      },
      {
        source: `${pathname}/:path*`,
        destination: `/partner${pathname}/:path*`,
        permanent: false
      }
    );
  }

  redirects.push(
    {
      source: "/payments",
      destination: "/partner/purchases",
      permanent: false
    },
    {
      source: "/payments/:path*",
      destination: "/partner/purchases/:path*",
      permanent: false
    }
  );

  return redirects;
}

export const config = {
  cleanUrls: true,
  trailingSlash: false,
  redirects: createStudioLegacyRedirects(),
  rewrites: createStudioRewrites()
};
