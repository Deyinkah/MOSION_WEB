const fs = require("fs");
const os = require("os");
const path = require("path");
const { Resend } = require("resend");

loadEnvFile();

let resendClient = null;

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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function getWaitlistVariant(source) {
  const waitlistSource = normalizeWaitlistSource(source);

  if (waitlistSource === "studio") {
    return {
      source: "studio",
      preheader: "Your MOSION Studio waitlist registration is confirmed.",
      subject: "You're on the MOSION Studio waitlist",
      bodyCopy:
        "Your MOSION Studio waitlist registration is confirmed. You now have early access to explore the filmmaker experience before the wider rollout.",
      ctaLabel: "Download MOSION Studio",
      textDownloadLead: "Download MOSION Studio",
      signature: "MOSION Studio",
      logoUrl: process.env.WAITLIST_LOGO_URL || "https://mosion.app/mosion.png",
      betaUrl:
        process.env.WAITLIST_STUDIO_BETA_URL ||
        process.env.WAITLIST_BETA_URL ||
        "https://mosion.app/studio"
    };
  }

  return {
    source: "website",
    preheader: "Your MOSION waitlist registration is confirmed.",
    subject: "You're on the MOSION waitlist",
    bodyCopy:
      "Your MOSION waitlist registration is confirmed. You're now one of the early users to have access to the MOSION app before the wider rollout.",
    ctaLabel: "Download the Beta App",
    textDownloadLead: "Download the Beta App",
    signature: "MOSION",
    logoUrl: process.env.WAITLIST_LOGO_URL || "https://mosion.app/mosion.png",
    betaUrl: process.env.WAITLIST_BETA_URL || "https://mosion.app"
  };
}

function getWaitlistConfirmationContent({
  source = "website",
  betaUrl,
  replyTo = process.env.WAITLIST_REPLY_TO,
  fromEmail = process.env.WAITLIST_FROM_EMAIL,
  fromName = process.env.WAITLIST_FROM_NAME || "MOSION"
} = {}) {
  const variant = getWaitlistVariant(source);
  const sender = parseMailbox(fromEmail, fromName);
  const replyToMailbox = parseMailbox(replyTo);
  const replyToAddress = replyToMailbox?.email || "";
  const resolvedBetaUrl = betaUrl || variant.betaUrl;
  const safeBetaUrl = escapeHtml(resolvedBetaUrl);
  const safeLogoUrl = escapeHtml(variant.logoUrl);
  const safeReplyToAddress = escapeHtml(replyToAddress);
  const subject = variant.subject;

  const text = [
    subject,
    "",
    variant.bodyCopy,
    "",
    `${variant.textDownloadLead}: ${resolvedBetaUrl}`,
    "",
    replyToAddress ? `Need help? Reply to ${replyToAddress}` : "Need help? Reply to this email.",
    "",
    "See you inside,",
    variant.signature
  ].join("\n");

  const supportCopy = replyToAddress
    ? `Need help or feedback? Reply to <a href="mailto:${safeReplyToAddress}" style="color:#0f172a;text-decoration:none;">${safeReplyToAddress}</a>.`
    : "Need help or feedback? Reply to this email.";

  const html = `
    <div style="margin:0;padding:0;background:#ffffff;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(variant.preheader)}
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:#ffffff;">
        <tr>
	          <td align="center" style="padding:32px 16px;">
	            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:460px;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden;text-align:center;">
		              <tr>
		                <td align="center" style="padding:28px 32px 32px;background:#ffffff;">
		                  <table role="presentation" width="460" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:460px;border-collapse:collapse;">
		                    <tr>
		                      <td align="left" style="padding:0 0 10px;text-align:left;">
		                        <img src="${safeLogoUrl}" alt="MOSION" width="46" style="display:block;width:36px;max-width:36px;height:auto;margin:0;" />
		                      </td>
		                    </tr>
		                    <tr>
		                      <td align="left" style="padding:12px 0 0;text-align:left;">
		                        <h1 style="margin:0;font-family:'Sora','DM Sans','Segoe UI',sans-serif;font-size:30px;font-weight:700;letter-spacing:-0.045em;line-height:1.05;color:#0f172a;text-align:left;">
		                          You're on the list!
		                        </h1>
		                        <p style="width:100%;max-width:460px;margin:18px 0 0;color:#475569;font-family:'DM Sans','Segoe UI',sans-serif;font-size:16px;font-weight:500;line-height:1.45;text-align:left;">
		                          ${escapeHtml(variant.bodyCopy)}
		                        </p>
		                      </td>
		                    </tr>
		                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 32px 28px;color:#64748b;font-family:'DM Sans','Segoe UI',sans-serif;font-size:13px;line-height:1.7;text-align:center;">
                  ${supportCopy}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return {
    source: variant.source,
    sender,
    replyToMailbox,
    betaUrl: resolvedBetaUrl,
    subject,
    text,
    html
  };
}

function renderWaitlistConfirmationPreviewPage(options = {}) {
  const { subject, html } = getWaitlistConfirmationContent(options);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)} Preview</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Sora:wght@600;700;800&display=swap"
      rel="stylesheet"
    />
    <style>
      html, body {
        margin: 0;
        min-height: 100%;
        background: #ffffff;
      }
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`;
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
  const { sender, replyToMailbox, subject, text, html } = getWaitlistConfirmationContent({ source });

  if (!sender) {
    throw createHttpError(
      500,
      "Waitlist registration is temporarily unavailable.",
      "Missing one or more required waitlist env vars: WAITLIST_FROM_EMAIL"
    );
  }

  try {
    const { error } = await getResendClient().emails.send({
      from: formatMailbox(sender),
      to: [email],
      replyTo: replyToMailbox ? replyToMailbox.email : undefined,
      subject,
      text,
      html
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
      source
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
