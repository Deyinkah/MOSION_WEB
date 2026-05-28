function getOrigin() {
  const value = process.env.STUDIO_WEB_APP_ORIGIN?.trim();
  if (!value) return null;
  return value.replace(/\/+$/, "");
}

function createStudioRedirects() {
  return [
    { source: "/partner/onboarding", destination: "/#studioWaitlistForm", permanent: false },
    { source: "/partner/onboarding/:path*", destination: "/#studioWaitlistForm", permanent: false },
  ];
}

function createStudioRewrites() {
  const origin = getOrigin();
  if (!origin) return [];
  const partnerBase = `${origin}/partner`;
  return [
    { source: "/partner", destination: partnerBase },
    { source: "/partner/:path*", destination: `${partnerBase}/:path*` },
    { source: "/_next/:path*", destination: `${origin}/_next/:path*` },
  ];
}

export const config = {
  redirects: createStudioRedirects(),
  rewrites: createStudioRewrites(),
};
