const http = require("http");
const fs = require("fs");
const https = require("https");
const path = require("path");

loadEnvFile();

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = path.join(__dirname, "public");
const WAITLIST_FILE = path.join(__dirname, "data", "waitlist-signups.jsonl");
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

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

function createHttpError(statusCode, publicMessage, internalMessage = publicMessage) {
  const error = new Error(internalMessage);
  error.statusCode = statusCode;
  error.publicMessage = publicMessage;
  return error;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseMailbox(input, fallbackName = "") {
  const value = typeof input === "string" ? input.trim() : "";

  if (!value) {
    return null;
  }

  const namedMatch = value.match(/^(.*)<([^>]+)>$/);

  if (namedMatch) {
    const name = namedMatch[1].trim().replace(/^["']|["']$/g, "");
    const email = namedMatch[2].trim();

    if (!isValidEmail(email)) {
      return null;
    }

    return name ? { email, name } : { email };
  }

  if (!isValidEmail(value)) {
    return null;
  }

  return fallbackName ? { email: value, name: fallbackName } : { email: value };
}

function safeResolvePath(requestPath) {
  const normalized = path.posix.normalize(decodeURIComponent(requestPath));
  return path.resolve(ROOT_DIR, `.${normalized}`);
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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1024 * 1024) {
        reject(createHttpError(413, "Request body is too large."));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(createHttpError(400, "Invalid request body.", error.message));
      }
    });

    req.on("error", (error) => {
      reject(createHttpError(400, "Could not read the request body.", error.message));
    });
  });
}

async function saveWaitlistSignup(entry) {
  await fs.promises.mkdir(path.dirname(WAITLIST_FILE), { recursive: true });
  await fs.promises.appendFile(WAITLIST_FILE, `${JSON.stringify(entry)}\n`, "utf8");
}

function postJson(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const body = JSON.stringify(payload);
    const request = https.request(
      {
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...headers
        }
      },
      (response) => {
        let responseBody = "";

        response.on("data", (chunk) => {
          responseBody += chunk;
        });

        response.on("end", () => {
          let parsed = {};

          if (responseBody) {
            try {
              parsed = JSON.parse(responseBody);
            } catch (error) {
              parsed = { raw: responseBody };
            }
          }

          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(parsed);
            return;
          }

          reject(
            createHttpError(
              502,
              "We couldn't send the confirmation email just now. Please try again.",
              `Email API error ${response.statusCode}: ${responseBody}`
            )
          );
        });
      }
    );

    request.on("error", (error) => {
      reject(
        createHttpError(
          502,
          "We couldn't send the confirmation email just now. Please try again.",
          error.message
        )
      );
    });

    request.write(body);
    request.end();
  });
}

async function sendWaitlistConfirmation(email) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.WAITLIST_FROM_EMAIL;
  const fromName = process.env.WAITLIST_FROM_NAME || "MOSION";
  const betaUrl = process.env.WAITLIST_BETA_URL;
  const replyTo = process.env.WAITLIST_REPLY_TO;
  const sender = parseMailbox(fromEmail, fromName);
  const replyToMailbox = parseMailbox(replyTo);

  if (!brevoApiKey || !sender || !betaUrl) {
    throw createHttpError(
      500,
      "Waitlist registration is temporarily unavailable.",
      "Missing one or more required waitlist env vars: BREVO_API_KEY, WAITLIST_FROM_EMAIL, WAITLIST_BETA_URL"
    );
  }

  const text = [
    "You're on the MOSION beta waitlist.",
    "",
    "Thanks for registering. You're one of the first people getting access.",
    `Download the beta app here: ${betaUrl}`,
    "",
    replyTo ? `Need help? Reply to ${replyTo}` : "Need help? Reply to this email.",
    "",
    "See you inside,",
    "MOSION"
  ].join("\n");

  const supportCopy = replyTo
    ? `Need help or feedback? Reply to <a href="mailto:${replyTo}" style="color:#ffffff;text-decoration:none;">${replyTo}</a>.`
    : "Need help or feedback? Reply to this email.";

  const html = `
    <div style="margin:0;padding:0;background:#070b14;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        Your MOSION waitlist registration is confirmed. Download the beta app now.
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:#070b14;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;background:#0b0f1c;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
              <tr>
                <td style="padding:24px 32px 18px;background:linear-gradient(180deg,#10182a 0%,#0b0f1c 100%);border-bottom:1px solid rgba(255,255,255,0.06);">
                  <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:42px;letter-spacing:0.22em;line-height:1;color:#ffffff;">MOSION</div>
                  <div style="margin-top:8px;color:#aeb7c2;font-family:'DM Sans','Segoe UI',sans-serif;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;">Beta Waitlist</div>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.06);color:#dbe2ec;font-family:'DM Sans','Segoe UI',sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">
                    Registration Confirmed
                  </div>
                  <h1 style="margin:18px 0 0;font-family:'Bebas Neue',Impact,sans-serif;font-size:56px;letter-spacing:0.08em;line-height:0.95;color:#ffffff;">
                    You're In
                  </h1>
                  <p style="margin:18px 0 0;color:#dbe2ec;font-family:'DM Sans','Segoe UI',sans-serif;font-size:18px;line-height:1.7;">
                    Your MOSION waitlist registration is confirmed. You now have early access to try the beta app before the wider rollout.
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;width:100%;border-collapse:collapse;">
                    <tr>
                      <td style="padding:14px 16px;border:1px solid rgba(255,255,255,0.08);border-radius:16px;background:rgba(255,255,255,0.03);color:#f5f7fa;font-family:'DM Sans','Segoe UI',sans-serif;font-size:14px;line-height:1.6;">
                        <strong style="display:block;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#aeb7c2;">What you get</strong>
                        Early beta access, direct download, and first notice when new releases land.
                      </td>
                    </tr>
                  </table>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;border-collapse:collapse;">
                    <tr>
                      <td align="center" bgcolor="#ffffff" style="border-radius:12px;">
                        <a href="${betaUrl}" style="display:inline-block;padding:15px 26px;border-radius:12px;background:#ffffff;color:#070b14;font-family:'DM Sans','Segoe UI',sans-serif;font-size:15px;font-weight:700;text-decoration:none;">
                          Download the Beta App
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:28px 0 0;color:#7a8598;font-family:'DM Sans','Segoe UI',sans-serif;font-size:14px;line-height:1.8;">
                    If the button above does not work, copy and open this link:<br />
                    <a href="${betaUrl}" style="color:#ffffff;word-break:break-all;text-decoration:none;">${betaUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 32px 28px;border-top:1px solid rgba(255,255,255,0.06);color:#8f9aab;font-family:'DM Sans','Segoe UI',sans-serif;font-size:13px;line-height:1.7;">
                  ${supportCopy}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const payload = {
    sender,
    to: [{ email }],
    subject: "You're on the MOSION beta waitlist",
    htmlContent: html,
    textContent: text,
    tags: ["waitlist", "beta"]
  };

  if (replyToMailbox) {
    payload.replyTo = replyToMailbox;
  }

  await postJson(BREVO_API_URL, payload, {
    "accept": "application/json",
    "api-key": brevoApiKey
  });
}

async function handleWaitlistSignup(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!isValidEmail(email)) {
      throw createHttpError(400, "Enter a valid email address.");
    }

    await saveWaitlistSignup({
      email,
      createdAt: new Date().toISOString(),
      source: "website"
    });

    await sendWaitlistConfirmation(email);

    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error("Waitlist signup failed:", error.message);
    sendJson(res, error.statusCode || 500, {
      error: error.publicMessage || "Something went wrong."
    });
  }
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === "/api/waitlist") {
    handleWaitlistSignup(req, res);
    return;
  }

  const candidatePaths = getCandidatePaths(requestUrl.pathname)
    .map((candidate) => safeResolvePath(candidate))
    .filter((candidate) => candidate.startsWith(ROOT_DIR));

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
