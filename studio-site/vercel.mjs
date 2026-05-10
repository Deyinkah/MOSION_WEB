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

export const config = {
  cleanUrls: true,
  trailingSlash: false,
  rewrites: createStudioRewrites()
};
