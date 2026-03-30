const fs = require("fs");
const path = require("path");
const {
  buildWaitlistConfirmationTemplate,
  renderWaitlistConfirmationPreviewDocument,
} = require("./emails/waitlist-confirmation");

const OUTPUT_DIR = path.join(__dirname, "preview");
const LOGO_PATH = path.join(__dirname, "public", "logo-wordmark.png");

function getMimeType(filePath) {
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

function getEmbeddedLogoSrc() {
  const content = fs.readFileSync(LOGO_PATH);
  const contentType = getMimeType(LOGO_PATH);
  return `data:${contentType};base64,${content.toString("base64")}`;
}

function writePreviewFile(source, filename) {
  const template = buildWaitlistConfirmationTemplate({
    source,
    logoSrc: getEmbeddedLogoSrc(),
    replyToAddress: process.env.WAITLIST_REPLY_TO || "waitlist@mosion.app",
  });

  const document = renderWaitlistConfirmationPreviewDocument(template);
  const outputPath = path.join(OUTPUT_DIR, filename);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(outputPath, document, "utf8");

  return outputPath;
}

function main() {
  const websitePreviewPath = writePreviewFile(
    "website",
    "waitlist-email-preview.html"
  );
  const studioPreviewPath = writePreviewFile(
    "studio",
    "waitlist-email-preview-studio.html"
  );

  console.log(`Website preview: ${websitePreviewPath}`);
  console.log(`Studio preview: ${studioPreviewPath}`);
}

main();
