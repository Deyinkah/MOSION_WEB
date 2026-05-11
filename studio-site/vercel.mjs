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

function createRedirect(source, destination, permanent = false) {
  return {
    source,
    destination,
    permanent
  };
}

function createStudioRedirects() {
  return [
    // Sign-in pages in the partner app link here for new users; send them to the public apply form.
    createRedirect("/partner/onboarding", "/#studioWaitlistForm"),
    createRedirect("/partner/onboarding/:path*", "/#studioWaitlistForm")
  ];
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

export const config = {
  cleanUrls: true,
  trailingSlash: false,
  redirects: createStudioRedirects(),
  rewrites: createStudioRewrites()
};
