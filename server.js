const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  handleWaitlistSignup,
  renderWaitlistConfirmationPreviewPage
} = require("./waitlist-handler");
const {
  handleBetaApkDownload,
  handleStudioBetaApkDownload
} = require("./apk-download-handler");

loadEnvFile();

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const ROOT_SITE_DIR = path.join(__dirname, "public");
const STUDIO_SITE_DIR = path.join(__dirname, "studio-site");
const STUDIO_PATH_PREFIX = "/studio";
const EXACT_STUDIO_HOSTS = new Set([
  "studio.mosion.app",
  "www.studio.mosion.app",
  "studio.localhost"
]);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".MP4": "video/mp4"
};

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex < 1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

function safeResolvePath(rootDir, requestPath) {
  const normalized = path.posix.normalize(decodeURIComponent(requestPath));
  return path.resolve(rootDir, `.${normalized}`);
}

function getRequestHost(req) {
  return String(req.headers.host || "")
    .split(":")[0]
    .trim()
    .toLowerCase();
}

function isStudioHost(host) {
  if (EXACT_STUDIO_HOSTS.has(host)) {
    return true;
  }

  return host.endsWith(".studio.mosion.app") || host.endsWith(".studio.localhost");
}

function canRenderEmailPreview(host) {
  if (process.env.ALLOW_EMAIL_PREVIEW === "true") {
    return true;
  }

  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
}

function getSiteContext(req, requestUrl) {
  const host = getRequestHost(req);

  if (isStudioHost(host)) {
    return {
      rootDir: STUDIO_SITE_DIR,
      pathname: requestUrl.pathname
    };
  }

  if (
    requestUrl.pathname === STUDIO_PATH_PREFIX ||
    requestUrl.pathname.startsWith(`${STUDIO_PATH_PREFIX}/`)
  ) {
    const pathname =
      requestUrl.pathname === STUDIO_PATH_PREFIX
        ? "/"
        : requestUrl.pathname.slice(STUDIO_PATH_PREFIX.length);

    return {
      rootDir: STUDIO_SITE_DIR,
      pathname
    };
  }

  return {
    rootDir: ROOT_SITE_DIR,
    pathname: requestUrl.pathname
  };
}

function getCandidatePaths(pathname) {
  if (pathname === "/") {
    return ["/index.html"];
  }

  if (!path.extname(pathname)) {
    return [`${pathname}.html`, path.posix.join(pathname, "index.html")];
  }

  return [pathname];
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const host = getRequestHost(req);

  if (requestUrl.pathname === "/preview/waitlist-email") {
    if (!canRenderEmailPreview(host)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const previewSource = requestUrl.searchParams.get("source") || "website";
    const previewBetaUrl = requestUrl.searchParams.get("betaUrl");
    const previewReplyTo = requestUrl.searchParams.get("replyTo") || process.env.WAITLIST_REPLY_TO;
    const previewHtml = renderWaitlistConfirmationPreviewPage({
      source: previewSource,
      betaUrl: previewBetaUrl || undefined,
      replyTo: previewReplyTo
    });

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(previewHtml);
    return;
  }

  if (requestUrl.pathname === "/api/waitlist") {
    handleWaitlistSignup(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/download-apk") {
    handleBetaApkDownload(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/download-studio-apk") {
    handleStudioBetaApkDownload(req, res);
    return;
  }

  // Redirect /studio → /studio/ so relative asset paths resolve correctly
  if (requestUrl.pathname === STUDIO_PATH_PREFIX && !isStudioHost(host)) {
    const location = STUDIO_PATH_PREFIX + "/" + (requestUrl.search || "");
    res.writeHead(301, { Location: location });
    res.end();
    return;
  }

  const site = getSiteContext(req, requestUrl);
  const candidatePaths = getCandidatePaths(site.pathname)
    .map((candidate) => safeResolvePath(site.rootDir, candidate))
    .filter((candidate) => candidate.startsWith(site.rootDir));

  if (!candidatePaths.length) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  const tryServe = (index) => {
    const filePath = candidatePaths[index];

    if (!filePath) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        tryServe(index + 1);
        return;
      }

      const extension = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[extension] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  };

  tryServe(0);
});

function startServer(port, attemptsLeft = 10) {
  server.listen(port, () => {
    console.log(`Static server running at http://localhost:${port}`);
  });

  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      const nextPort = port + 1;
      server.removeAllListeners("error");
      startServer(nextPort, attemptsLeft - 1);
      return;
    }

    throw error;
  });
}

startServer(DEFAULT_PORT);
