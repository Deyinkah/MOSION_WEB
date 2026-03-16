import { next, rewrite } from "@vercel/functions";

const STUDIO_HOST = "studio.mosion.app";
const ROOT_PATHS = new Set(["/", "/index", "/index.html"]);
const STUDIO_PAGE_PATHS = new Set(["/studio", "/studio/", "/studio.html"]);

export const config = {
  matcher: ["/", "/index", "/index.html", "/studio", "/studio.html", "/studio/"]
};

export default function middleware(request) {
  const host = request.headers.get("host")?.split(":")[0];

  if (host !== STUDIO_HOST) {
    return next();
  }

  const url = new URL(request.url);

  if (STUDIO_PAGE_PATHS.has(url.pathname)) {
    url.pathname = "/";
    return Response.redirect(url, 308);
  }

  if (ROOT_PATHS.has(url.pathname)) {
    return rewrite(new URL("/studio", request.url));
  }

  return next();
}
