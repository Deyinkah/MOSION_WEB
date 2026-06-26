const DEFAULT_LOGO_URL = "https://mosion.app/logo-wordmark.png";
const DEFAULT_WAITLIST_BETA_URL =
  "https://play.google.com/store/apps/details?id=app.mosion.mobile";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getWaitlistVariant(environment = process.env) {
  return {
    source: "website",
    preheader: "Your Mosion early access is ready.",
    subject: "You're in — Mosion early access",
    bodyCopy:
      "You're in. <strong>Mosion</strong> for Android is ready for you — get it on Google Play below.",
    bodyCopy2:
      "During early access you can explore the app freely: preview titles with trailers, and try checkout with test purchases at no charge. Reply any time with feedback — we read every message.",
    ctaLabel: "Get it on Google Play",
    textDownloadLead: "Get it on Google Play",
    signature: "Mosion",
    logoUrl: DEFAULT_LOGO_URL,
    betaUrl: environment.WAITLIST_BETA_URL || DEFAULT_WAITLIST_BETA_URL,
  };
}

function buildSupportCopy(replyToAddress) {
  if (!replyToAddress) {
    return {
      html: "Need help or have feedback? Reply to this email.",
      text: "Need help or have feedback? Reply to this email.",
    };
  }

  const safeReplyToAddress = escapeHtml(replyToAddress);

  return {
    html: `Need help or have feedback? Reply to <a href="mailto:${safeReplyToAddress}" style="color:#d4a843;text-decoration:none;">${safeReplyToAddress}</a>`,
    text: `Need help or have feedback? Reply to ${replyToAddress}`,
  };
}

function buildWaitlistConfirmationHtml({ variant, logoSrc, replyToAddress = "", resolvedBetaUrl }) {
  const safeLogoSrc = escapeHtml(logoSrc || variant.logoUrl);
  const safeResolvedBetaUrl = escapeHtml(resolvedBetaUrl);
  const safeCtaLabel = escapeHtml(variant.ctaLabel);
  const supportCopy = buildSupportCopy(replyToAddress);
  const hasCta = Boolean(variant.ctaLabel && resolvedBetaUrl);
  const privacyUrl = "https://mosion.app/privacy";

  return `
    <div style="margin:0;padding:0;background:#f0ede8;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(variant.preheader)}
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:#f0ede8;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;border-collapse:separate;border-spacing:0;background:#ffffff;border-top:3px solid #d4a843;text-align:left;">

              <!-- Logo header -->
              <tr>
                <td align="left" style="padding:28px 36px 24px;border-bottom:1px solid #e8e3db;">
                  <img src="${safeLogoSrc}" alt="MOSION" width="120" style="display:block;width:120px;max-width:120px;height:auto;margin:0;" />
                </td>
              </tr>

              <!-- Greeting -->
              <tr>
                <td style="padding:32px 36px 0;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
                  <p style="margin:0;color:#1a1a1a;font-size:16px;line-height:1.6;">Hello,</p>
                </td>
              </tr>

              <!-- Body paragraph 1 -->
              <tr>
                <td style="padding:16px 36px 0;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
                  <p style="margin:0;color:#3a3a3a;font-size:16px;line-height:1.65;">${variant.bodyCopy}</p>
                </td>
              </tr>

              <!-- Body paragraph 2 -->
              <tr>
                <td style="padding:16px 36px 0;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
                  <p style="margin:0;color:#3a3a3a;font-size:16px;line-height:1.65;">${escapeHtml(variant.bodyCopy2)}</p>
                </td>
              </tr>

              ${hasCta ? `
              <!-- CTA button -->
              <tr>
                <td style="padding:28px 36px 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background:#d4a843;border-radius:4px;">
                        <a href="${safeResolvedBetaUrl}" style="display:inline-block;padding:13px 28px;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">${safeCtaLabel}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>` : ""}

              <!-- Divider -->
              <tr>
                <td style="padding:32px 36px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="border-top:1px solid #e8e3db;font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Support copy -->
              <tr>
                <td style="padding:24px 36px 0;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:14px;color:#6b6b6b;line-height:1.6;">
                  ${supportCopy.html}
                </td>
              </tr>

              <!-- Signature -->
              <tr>
                <td style="padding:20px 36px 36px;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:14px;color:#6b6b6b;line-height:1.8;">
                  See you inside,<br /><strong style="color:#1a1a1a;">The ${escapeHtml(variant.signature)} Team</strong>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9f7f4;border-top:1px solid #e8e3db;padding:18px 36px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:12px;color:#9a9a9a;line-height:1.7;">
                        Mosion Digital Entertainment Ltd.<br />
                        <a href="${escapeHtml(privacyUrl)}" style="color:#d4a843;text-decoration:none;">Privacy Policy</a>
                      </td>
                    </tr>
                  </table>
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
  betaUrl,
  logoSrc,
  replyToAddress = "",
  environment = process.env,
} = {}) {
  const variant = getWaitlistVariant(environment);
  const resolvedBetaUrl = betaUrl || variant.betaUrl;
  const supportCopy = buildSupportCopy(replyToAddress);
  const hasCta = Boolean(variant.textDownloadLead && resolvedBetaUrl);

  const text = [
    variant.subject,
    "",
    variant.bodyCopy.replace(/<[^>]+>/g, ""),
    variant.bodyCopy2,
    ...(hasCta ? ["", `${variant.textDownloadLead}: ${resolvedBetaUrl}`] : []),
    "",
    supportCopy.text,
    "",
    "See you inside,",
    `The ${variant.signature} Team`,
  ].join("\n");

  return {
    source: "website",
    betaUrl: resolvedBetaUrl,
    subject: variant.subject,
    text,
    html: buildWaitlistConfirmationHtml({ variant, logoSrc, replyToAddress, resolvedBetaUrl }),
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
        background: #f0ede8;
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
