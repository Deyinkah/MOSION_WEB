const fs = require("fs");
const os = require("os");
const path = require("path");
const { Resend } = require("resend");
const {
  buildWaitlistConfirmationTemplate,
  renderWaitlistConfirmationPreviewDocument
} = require("./emails/waitlist-confirmation");

loadEnvFile();

let resendClient = null;
let waitlistLogoAsset = null;
let hasLoadedWaitlistLogoAsset = false;

const DEFAULT_WAITLIST_LOGO_PATH = path.join(__dirname, "public", "logo-wordmark.png");
const WAITLIST_LOGO_CONTENT_ID = "mosion-logo";

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
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function getCorsOrigin(origin) {
  const value = typeof origin === "string" ? origin.trim() : "";

  if (!value) {
    return "";
  }

  const exactOrigins = new Set([
    "https://mosion.app",
    "https://www.mosion.app",
    "https://studio.mosion.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ]);

  if (exactOrigins.has(value)) {
    return value;
  }

  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(value)) {
    return value;
  }

  return "";
}

function applyWaitlistCors(req, res) {
  const allowedOrigin = getCorsOrigin(req.headers.origin);

  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function maskEmailForLogs(email) {
  if (!isValidEmail(email)) {
    return "[invalid-email]";
  }

  const [localPart, domain = ""] = email.split("@");
  const visibleLocal = localPart.slice(0, 2);
  const maskedLocal = `${visibleLocal}${"*".repeat(Math.max(localPart.length - 2, 1))}`;
  return `${maskedLocal}@${domain}`;
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

function formatMailbox(mailbox) {
  if (!mailbox) {
    return "";
  }

  const name = typeof mailbox.name === "string" ? mailbox.name.replace(/[<>"]/g, "").trim() : "";
  return name ? `"${name}" <${mailbox.email}>` : mailbox.email;
}

function getMimeTypeFromFilePath(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function getWaitlistLogoAsset() {
  if (hasLoadedWaitlistLogoAsset) {
    return waitlistLogoAsset;
  }

  hasLoadedWaitlistLogoAsset = true;

  const candidatePaths = [
    DEFAULT_WAITLIST_LOGO_PATH
  ].filter(Boolean);

  const logoPath = candidatePaths.find((candidatePath) => {
    try {
      return fs.statSync(candidatePath).isFile();
    } catch (error) {
      return false;
    }
  });

  if (!logoPath) {
    waitlistLogoAsset = null;
    return waitlistLogoAsset;
  }

  const content = fs.readFileSync(logoPath);
  const contentType = getMimeTypeFromFilePath(logoPath);

  waitlistLogoAsset = {
    content,
    contentId: WAITLIST_LOGO_CONTENT_ID,
    contentType,
    filename: path.basename(logoPath),
    previewSrc: `data:${contentType};base64,${content.toString("base64")}`
  };

  return waitlistLogoAsset;
}

function getWaitlistFilePath() {
  if (process.env.WAITLIST_FILE) {
    return path.resolve(process.env.WAITLIST_FILE);
  }

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return path.join(os.tmpdir(), "mosion-waitlist-signups.jsonl");
  }

  return path.join(__dirname, "data", "waitlist-signups.jsonl");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string" && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      throw createHttpError(400, "Invalid request body.", error.message);
    }
  }

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
  const waitlistFile = getWaitlistFilePath();
  await fs.promises.mkdir(path.dirname(waitlistFile), { recursive: true });
  await fs.promises.appendFile(waitlistFile, `${JSON.stringify(entry)}\n`, "utf8");
}

function normalizeWaitlistSource(source) {
  const value = typeof source === "string" ? source.trim().toLowerCase() : "";

  if (value === "studio" || value === "studio-site" || value === "filmmaker") {
    return "studio";
  }

  return "website";
}

function normalizeOptionalText(value, maxLength = 160) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    return "";
  }

  return normalized.slice(0, maxLength);
}

function getWaitlistDetails(body) {
  if (!body || typeof body !== "object") {
    return {};
  }

  const firstName = normalizeOptionalText(body.firstName, 80);
  const lastName = normalizeOptionalText(body.lastName, 80);
  const filmName = normalizeOptionalText(body.filmName, 160);
  const origin = normalizeOptionalText(body.origin, 120);

  return {
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    ...(filmName ? { filmName } : {}),
    ...(origin ? { origin } : {}),
  };
}

function getWaitlistConfirmationContent({
  source = "website",
  betaUrl,
  preview = false,
  replyTo = process.env.WAITLIST_REPLY_TO,
  fromEmail = process.env.WAITLIST_FROM_EMAIL || process.env.EMAIL_FROM,
  fromName = process.env.WAITLIST_FROM_NAME || "Mosion"
} = {}) {
  const sender = parseMailbox(fromEmail, fromName);
  const replyToMailbox = parseMailbox(replyTo);
  const replyToAddress = replyToMailbox?.email || "";
  const logoAsset = getWaitlistLogoAsset();
  const logoSrc = logoAsset
    ? preview
      ? logoAsset.previewSrc
      : `cid:${logoAsset.contentId}`
    : undefined;
  const { source: templateSource, betaUrl: resolvedBetaUrl, subject, text, html } =
    buildWaitlistConfirmationTemplate({
      source,
      betaUrl,
      logoSrc,
      replyToAddress
    });

  return {
    source: templateSource,
    sender,
    replyToMailbox,
    betaUrl: resolvedBetaUrl,
    subject,
    text,
    html,
    attachments: !preview && logoAsset
      ? [{
          filename: logoAsset.filename,
          content: logoAsset.content,
          contentType: logoAsset.contentType,
          contentId: logoAsset.contentId
        }]
      : undefined
  };
}

function renderWaitlistConfirmationPreviewPage(options = {}) {
  const { subject, html } = getWaitlistConfirmationContent({
    ...options,
    preview: true
  });

  return renderWaitlistConfirmationPreviewDocument({ subject, html });
}

function getResendApiKey() {
  return process.env.WAITLIST_RESEND_API_KEY || process.env.RESEND_API_KEY || "";
}

function getResendClient() {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    throw createHttpError(
      500,
      "Waitlist registration is temporarily unavailable.",
      "Missing required waitlist env var: RESEND_API_KEY"
    );
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

async function sendWaitlistConfirmation(email, source = "website") {
  const { sender, replyToMailbox, subject, text, html, attachments } = getWaitlistConfirmationContent({ source });

  if (!sender) {
    throw createHttpError(
      500,
      "Waitlist registration is temporarily unavailable.",
      "Missing one or more required waitlist env vars: WAITLIST_FROM_EMAIL or EMAIL_FROM"
    );
  }

  try {
    const { error } = await getResendClient().emails.send({
      from: formatMailbox(sender),
      to: [email],
      replyTo: replyToMailbox ? replyToMailbox.email : undefined,
      subject,
      text,
      html,
      attachments
    });

    if (error) {
      const detail =
        (typeof error.message === "string" && error.message.trim()) ||
        (typeof error.name === "string" && error.name.trim()) ||
        "Unknown Resend error";

      throw createHttpError(
        502,
        "We couldn't send the confirmation email just now. Please try again.",
        `Resend send failed: ${detail}`
      );
    }
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    throw createHttpError(
      502,
      "We couldn't send the confirmation email just now. Please try again.",
      `Resend send failed: ${error.name || "Error"}: ${error.message}`
    );
  }
}

async function handleWaitlistSignup(req, res) {
  applyWaitlistCors(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const source = normalizeWaitlistSource(body.source);
    const details = getWaitlistDetails(body);
    const requestId = `wl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

    if (!isValidEmail(email)) {
      console.warn(`[waitlist:${requestId}] invalid email submitted source=${source}`);
      throw createHttpError(400, "Enter a valid email address.");
    }

    const maskedEmail = maskEmailForLogs(email);
    console.log(`[waitlist:${requestId}] signup received email=${maskedEmail} source=${source}`);

    await saveWaitlistSignup({
      email,
      createdAt: new Date().toISOString(),
      source,
      ...details
    });
    console.log(`[waitlist:${requestId}] signup stored email=${maskedEmail} source=${source}`);

    let confirmationSent = false;

    try {
      await sendWaitlistConfirmation(email, source);
      confirmationSent = true;
      console.log(`[waitlist:${requestId}] confirmation sent email=${maskedEmail} source=${source}`);
    } catch (error) {
      console.error(`[waitlist:${requestId}] confirmation failed email=${maskedEmail} source=${source}:`, error.message);
    }

    console.log(`[waitlist:${requestId}] response sent confirmationSent=${confirmationSent} source=${source}`);
    sendJson(res, 200, { ok: true, confirmationSent, source });
  } catch (error) {
    console.error("Waitlist signup failed:", error.message);
    sendJson(res, error.statusCode || 500, {
      error: error.publicMessage || "Something went wrong."
    });
  }
}

module.exports = {
  handleWaitlistSignup,
  renderWaitlistConfirmationPreviewPage
};
