const http = require("http");
const fs = require("fs");
const path = require("path");

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function safeResolvePath(requestPath) {
  const normalized = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  return path.join(ROOT_DIR, normalized);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = requestUrl.pathname;

  if (pathname === "/") {
    pathname = "/index.html";
  }

  const filePath = safeResolvePath(pathname);
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
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
