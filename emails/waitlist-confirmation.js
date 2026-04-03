const DEFAULT_LOGO_URL = "https://mosion.app/logo-wordmark.png";
const DEFAULT_WAITLIST_BETA_URL = "https://www.mosion.app/api/download-apk";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeVariantSource(source) {
  const value = typeof source === "string" ? source.trim().toLowerCase() : "";

  if (value === "studio" || value === "studio-site" || value === "filmmaker") {
    return "studio";
  }

  return "website";
}

function getWaitlistVariant(source, environment = process.env) {
  const waitlistSource = normalizeVariantSource(source);
  const logoUrl = DEFAULT_LOGO_URL;

  if (waitlistSource === "studio") {
    return {
      source: "studio",
      preheader: "Your Mosion Studio application has been received.",
      subject: "We received your Mosion Studio application",
      bodyCopy:
        "Your Mosion Studio application has been received. Our team will review your partner details, rights position, and release fit before granting access. Studio access does not guarantee title approval or listing.",
      ctaLabel: "",
      textDownloadLead: "",
      signature: "Mosion Studio",
      logoUrl,
      betaUrl: "",
    };
  }

  return {
    source: "website",
    preheader: "Your Mosion waitlist registration is confirmed.",
    subject: "You're on the Mosion waitlist",
    bodyCopy:
      "Your Mosion waitlist registration is confirmed. You're now one of the early users to have access to the Mosion app before the wider rollout.",
    ctaLabel: "Download the Beta App",
    textDownloadLead: "Download the Beta App",
    signature: "Mosion",
    logoUrl,
    betaUrl: environment.WAITLIST_BETA_URL || DEFAULT_WAITLIST_BETA_URL,
  };
}

function buildSupportCopy(replyToAddress) {
  if (!replyToAddress) {
    return {
      html: "Need help or feedback? Reply to this email.",
      text: "Need help? Reply to this email.",
    };
  }

  const safeReplyToAddress = escapeHtml(replyToAddress);

  return {
    html: `Need help or feedback? Reply to <a href="mailto:${safeReplyToAddress}" style="color:#0f172a;text-decoration:none;">${safeReplyToAddress}</a>.`,
    text: `Need help? Reply to ${replyToAddress}`,
  };
}

function buildWaitlistConfirmationHtml({
  variant,
  logoSrc,
  replyToAddress = "",
  resolvedBetaUrl,
}) {
  const safeBodyCopy = escapeHtml(variant.bodyCopy);
  const safeLogoSrc = escapeHtml(logoSrc || variant.logoUrl);
  const safeResolvedBetaUrl = escapeHtml(resolvedBetaUrl);
  const safeSignature = escapeHtml(variant.signature);
  const safeCtaLabel = escapeHtml(variant.ctaLabel);
  const supportCopy = buildSupportCopy(replyToAddress);
  const hasCta = Boolean(variant.ctaLabel && resolvedBetaUrl);

  return `
    <div style="margin:0;padding:0;background:#f3f4f6;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(variant.preheader)}
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:#f3f4f6;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:520px;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 12px 30px rgba(15,23,42,0.08);text-align:left;">
              <tr>
                <td align="left" style="padding:28px 32px 22px;text-align:left;border-bottom:1px solid #eceff3;">
                  <img src="${safeLogoSrc}" alt="${safeSignature}" width="154" style="display:block;width:154px;max-width:154px;height:auto;margin:0;" />
                </td>
              </tr>
              <tr>
                <td align="left" style="padding:30px 32px 0;text-align:left;">
                  <p style="margin:0;color:#4b5563;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:17px;font-weight:400;line-height:1.55;">
                    ${safeBodyCopy}
                  </p>
                </td>
              </tr>
              ${hasCta
                ? `<tr>
                <td align="left" style="padding:26px 32px 0;text-align:left;">
                  <a href="${safeResolvedBetaUrl}" style="color:#1d4ed8;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:15px;font-weight:400;line-height:1.5;text-decoration:none;">
                    ${safeCtaLabel}
                  </a>
                </td>
              </tr>`
                : ""}
              <tr>
                <td style="padding:42px 32px 0;color:#6b7280;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:14px;line-height:1.6;text-align:left;">
                  ${supportCopy.html}
                </td>
              </tr>
              <tr>
                <td style="padding:18px 32px 32px;color:#6b7280;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:14px;line-height:1.6;text-align:left;">
                  See you inside,<br />
                  ${safeSignature}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function buildWaitlistConfirmationTemplate({
  source = "website",
  betaUrl,
  logoSrc,
  replyToAddress = "",
  environment = process.env,
} = {}) {
  const variant = getWaitlistVariant(source, environment);
  const resolvedBetaUrl = betaUrl || variant.betaUrl;
  const supportCopy = buildSupportCopy(replyToAddress);
  const hasCta = Boolean(variant.textDownloadLead && resolvedBetaUrl);

  const text = [
    variant.subject,
    "",
    variant.bodyCopy,
    ...(hasCta ? ["", `${variant.textDownloadLead}: ${resolvedBetaUrl}`] : []),
    supportCopy.text,
    "",
    "See you inside,",
    variant.signature,
  ].join("\n");

  return {
    source: variant.source,
    betaUrl: resolvedBetaUrl,
    subject: variant.subject,
    text,
    html: buildWaitlistConfirmationHtml({
      variant,
      logoSrc,
      replyToAddress,
      resolvedBetaUrl,
    }),
  };
}

function renderWaitlistConfirmationPreviewDocument({ subject, html }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)} Preview</title>
    <style>
      html, body {
        margin: 0;
        min-height: 100%;
        background: #f3f4f6;
      }
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`;
}

module.exports = {
  buildWaitlistConfirmationTemplate,
  getWaitlistVariant,
  renderWaitlistConfirmationPreviewDocument,
};
