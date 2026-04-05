const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const fragmentPath = path.join(projectRoot, "shared", "privacy-policy-fragment.html");
const publicOutputPath = path.join(projectRoot, "public", "privacy.html");
const studioOutputPath = path.join(projectRoot, "studio-site", "privacy.html");

const fragment = fs.readFileSync(fragmentPath, "utf8").trim();

function renderPublicPage(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#080808" />
<title>Privacy Policy | MOSION</title>
<meta name="description" content="Privacy Policy for MOSION and MOSION Studio, covering the public waitlist, Studio applications, Studio accounts, and browser storage used across the service." />
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
<link rel="canonical" href="https://mosion.app/privacy" />
<link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png?v=20260329h" />
<link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png?v=20260329h" />
<link rel="shortcut icon" href="./favicon.ico?v=20260329h" />
<link rel="manifest" href="./site.webmanifest?v=20260329h" />
<link rel="apple-touch-icon" href="./apple-touch-icon.png?v=20260329h" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="./layout.css?v=20260405-footer1" />
<link rel="stylesheet" href="./privacy.css?v=20260405-privacy3" />
</head>
<body class="policy-page">
  <!-- Generated from shared/privacy-policy-fragment.html via scripts/render-privacy-pages.js -->
  <div id="site-nav"></div>

  <main class="policy-page-shell">
    ${content}
  </main>

  <div id="site-footer"></div>

  <script src="./site-core.js?v=20260405-notice1" defer></script>
  <script src="./layout.js?v=20260405-privacy2" defer></script>
</body>
</html>
`;
}

function renderStudioPage(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Privacy Policy | MOSION Studio</title>
<meta name="description" content="Privacy Policy for MOSION and MOSION Studio, covering the public site, Studio applications, Studio accounts, and browser storage used across the service." />
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
<link rel="canonical" href="https://studio.mosion.app/privacy" />
<link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png?v=20260329h" />
<link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png?v=20260329h" />
<link rel="shortcut icon" href="./favicon.ico?v=20260329h" />
<link rel="apple-touch-icon" href="./apple-touch-icon.png?v=20260329h" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="./privacy.css?v=20260405-privacy5" />
</head>
<body>
  <!-- Generated from shared/privacy-policy-fragment.html via scripts/render-privacy-pages.js -->
  <div class="page-shell">
    <nav class="page-nav" aria-label="Studio privacy page">
      <a href="./" class="nav-logo" aria-label="MOSION Studio home">
        <img class="nav-logo-image" src="./logo-wordmark.png" alt="MOSION" width="168" height="20" />
        <span class="nav-logo-tag">Studio</span>
      </a>
      <div class="page-crumb" aria-hidden="true">
        <a href="./" class="back-link">Home</a>
        <span>/</span>
        <span class="page-crumb-current" aria-current="page">Privacy</span>
      </div>
    </nav>

    <main class="page-main">
      ${content}

      <footer class="site-footer">
        <ul class="footer-links">
          <li><a href="mailto:partners@mosion.app?subject=Studio%20Support">Support</a></li>
          <li><a href="#terms">Terms</a></li>
          <li><a href="#privacyTitle" aria-current="page">Privacy</a></li>
          <li><a href="mailto:partners@mosion.app">Contact</a></li>
        </ul>

        <div class="footer-brand">
          <a href="./" class="footer-logo" aria-label="MOSION Studio home">
            <img class="footer-logo-image" src="./logo-wordmark.png" alt="MOSION" width="168" height="20" />
            <span class="nav-logo-tag">Studio</span>
          </a>
          <p class="footer-mission">MOSION Studio is the curated distribution infrastructure African cinema has always deserved.</p>
        </div>

        <div class="footer-copy">&copy; 2026 Mosion. All rights reserved.</div>
      </footer>
    </main>
  </div>
</body>
</html>
`;
}

fs.writeFileSync(publicOutputPath, renderPublicPage(fragment));
fs.writeFileSync(studioOutputPath, renderStudioPage(fragment));

console.log("Rendered privacy pages:");
console.log(`- ${path.relative(projectRoot, publicOutputPath)}`);
console.log(`- ${path.relative(projectRoot, studioOutputPath)}`);
