const DEFAULT_STUDIO_DOWNLOAD_URL =
  process.env.STUDIO_BETA_DOWNLOAD_URL ||
  process.env.STUDIO_BETA_PROXY_URL ||
  "https://www.mosion.app/api/download-studio-apk";

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.statusCode = 405;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Method not allowed.");
    return;
  }

  res.statusCode = 307;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Location", DEFAULT_STUDIO_DOWNLOAD_URL);
  res.end();
};
