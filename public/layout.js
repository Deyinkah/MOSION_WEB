(function initSharedLayout(window, document, Site) {
  "use strict";

  if (!Site) {
    return;
  }

  const ASSETS = {
    wordmark: "./logo-wordmark.png?v=20260329f",
  };

  const ROUTES = {
    about: "/about",
    accessibility: "/accessibility",
    contact: "mailto:info@mosion.app",
    home: "/",
    instagram: "https://www.instagram.com/mosionhq",
    localAbout: "/about.html",
    localAccessibility: "/accessibility.html",
    localHome: "/index.html",
    localPrivacy: "/privacy.html",
    localStudio: "/studio/",
    privacy: "/privacy",
    studio: "https://studio.mosion.app",
    support: "mailto:support@mosion.app?subject=MOSION%20Support",
    x: "https://x.com/mosionhq",
  };

  const COPY = {
    defaultModalBody: "This page is being prepared and will be available soon.",
    defaultModalTitle: "Coming soon",
    footerMission:
      "Mosion is building the infrastructure for African cinema distribution, starting in your pocket.",
    prototypeNotice:
      "Banner artwork and sample film titles shown are for interface demonstration only. Final catalog will reflect licensed partner content.",
  };

  function normalizePathname(pathname) {
    return pathname.replace(/\/+$/, "") || "/";
  }

  function isAboutPage() {
    const pathname = normalizePathname(window.location.pathname);
    return (
      pathname === "/about" ||
      pathname === "/about.html" ||
      pathname.endsWith("/about.html")
    );
  }

  function isAccessibilityPage() {
    const pathname = normalizePathname(window.location.pathname);
    return (
      pathname === "/accessibility" ||
      pathname === "/accessibility.html" ||
      pathname.endsWith("/accessibility.html")
    );
  }

  function isHomePage() {
    const pathname = normalizePathname(window.location.pathname);
    return (
      pathname === "/" ||
      pathname === "/index.html" ||
      pathname.endsWith("/index.html")
    );
  }

  function isPrivacyPage() {
    const pathname = normalizePathname(window.location.pathname);
    return (
      pathname === "/privacy" ||
      pathname === "/privacy.html" ||
      pathname.endsWith("/privacy.html")
    );
  }

  function isLocalHost(hostname) {
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".localhost")
    );
  }

  function createNavMarkup() {
    return `
<nav class="site-nav" aria-label="Primary">
  <a href="${ROUTES.home}" class="logo">
    <img src="${ASSETS.wordmark}" alt="MOSION" class="logo-wordmark" width="168" height="20" />
  </a>
  <div class="nav-r">
    <div class="nav-menu" id="navMenu">
      <button
        class="nav-btn nav-menu-toggle"
        id="navMenuToggle"
        type="button"
        aria-expanded="false"
        aria-haspopup="true"
        aria-controls="navDropdown"
      >
        Menu
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M2 5l5 5 5-5" />
        </svg>
      </button>
      <div class="nav-dropdown" id="navDropdown" hidden>
        <a href="/#how" data-home-hash="#how">How it Works</a>
        <a href="${ROUTES.studio}" data-studio-link data-local-href="${ROUTES.localStudio}" target="_blank" rel="noopener noreferrer">Studio Platform</a>
        <a href="/#download" data-home-hash="#download">Get the App</a>
      </div>
    </div>
  </div>
</nav>`;
  }

  function createFooterMarkup() {
    return `
<footer class="site-footer">
  <div class="footer-brand">
    <a href="${ROUTES.home}" class="footer-logo" data-home-link>
      <img src="${ASSETS.wordmark}" alt="Mosion" class="footer-logo-image" width="168" height="20" />
    </a>
    <div class="footer-mission">${COPY.footerMission}</div>
  </div>
  <nav class="footer-nav" aria-label="Footer">
    <div class="footer-group">
      <div class="footer-heading">Platform</div>
      <ul class="footer-list">
        <li><a href="/#how" data-home-hash="#how">How it works</a></li>
        <li><a href="/#download" data-home-hash="#download">Get the app</a></li>
        <li><a href="${ROUTES.studio}" data-footer-studio-link target="_blank" rel="noopener noreferrer">Studio</a></li>
      </ul>
    </div>
    <div class="footer-group">
      <div class="footer-heading">Company</div>
      <ul class="footer-list">
        <li><a href="${ROUTES.about}" data-about-link>About</a></li>
        <li><a href="${ROUTES.support}">Support</a></li>
        <li><a href="${ROUTES.contact}">Contact</a></li>
      </ul>
    </div>
    <div class="footer-group">
      <div class="footer-heading">Legal</div>
      <ul class="footer-list">
        <li><a href="${ROUTES.privacy}" data-privacy-link>Privacy</a></li>
        <li><a href="${ROUTES.privacy}#storage" data-privacy-storage-link>Cookies</a></li>
        <li><a href="${ROUTES.privacy}#terms" data-privacy-terms-link>Terms</a></li>
        <li><a href="${ROUTES.accessibility}" data-accessibility-link>Accessibility</a></li>
      </ul>
    </div>
  </nav>
  <div class="footer-meta">
    <div class="footer-copy">&copy; 2026 Mosion. All rights reserved.</div>
    <div class="footer-social" aria-label="Mosion social links">
      <a
        href="${ROUTES.x}"
        class="footer-social-link"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow Mosion on X"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M18.244 2H21.5l-7.114 8.13L22.75 22h-6.547l-5.126-7.092L4.871 22H1.613l7.608-8.696L1.25 2h6.713l4.633 6.463L18.244 2Zm-1.142 18.067h1.804L6.978 3.838H5.043l12.059 16.229Z" fill="currentColor"/>
        </svg>
      </a>
      <a
        href="${ROUTES.instagram}"
        class="footer-social-link"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow Mosion on Instagram"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
          <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.7"/>
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/>
        </svg>
      </a>
    </div>
  </div>
</footer>

<div class="coming-soon-modal" id="comingSoonModal" hidden>
  <div class="coming-soon-backdrop" data-modal-close></div>
  <div
    class="coming-soon-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="comingSoonTitle"
    aria-describedby="comingSoonCopy"
  >
    <button type="button" class="coming-soon-close" data-modal-close aria-label="Close popup">
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
    <h3 class="coming-soon-title" id="comingSoonTitle">${COPY.defaultModalTitle}</h3>
    <p class="coming-soon-copy" id="comingSoonCopy">${COPY.defaultModalBody}</p>
  </div>
</div>

<aside
  class="prototype-notice"
  id="prototypeNotice"
  hidden
  aria-live="polite"
  aria-labelledby="prototypeNoticeTitle"
  aria-describedby="prototypeNoticeCopy"
>
  <button type="button" class="prototype-notice-close" id="prototypeNoticeClose" aria-label="Dismiss catalog preview notice">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  </button>
  <div class="prototype-notice-kicker">Preview Notice</div>
  <div class="prototype-notice-title" id="prototypeNoticeTitle">Catalog preview shown</div>
  <p class="prototype-notice-copy" id="prototypeNoticeCopy">${COPY.prototypeNotice}</p>
</aside>`;
  }

  function injectLayout() {
    const navSlot = document.getElementById("site-nav");
    const footerSlot = document.getElementById("site-footer");

    if (navSlot) {
      navSlot.outerHTML = createNavMarkup();
    }

    if (footerSlot) {
      footerSlot.outerHTML = createFooterMarkup();
    }
  }

  function initNavMenu() {
    const menu = document.getElementById("navMenu");
    const toggle = document.getElementById("navMenuToggle");
    const dropdown = document.getElementById("navDropdown");
    const logo = document.querySelector(".logo");

    if (!menu || !toggle || !dropdown) {
      return;
    }

    const studioLink = dropdown.querySelector("[data-studio-link]");

    if (studioLink && isLocalHost(window.location.hostname)) {
      const localHref = studioLink.getAttribute("data-local-href");

      if (localHref) {
        studioLink.setAttribute("href", localHref);
      }
    }

    const setOpen = (open) => {
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      dropdown.hidden = !open;
    };

    setOpen(false);

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setOpen(dropdown.hidden);
    });

    if (logo) {
      logo.addEventListener("click", (event) => {
        if (isHomePage()) {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }

        setOpen(false);
      });
    }

    dropdown.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href") || "";
        const hashIndex = href.indexOf("#");
        const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";

        if (hash && Site.scrollToHash(hash)) {
          event.preventDefault();
        }

        setOpen(false);
      });
    });

    document.addEventListener("click", (event) => {
      if (!menu.contains(event.target)) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 640) {
        setOpen(false);
      }
    });
  }

  function applyLocalPreviewRoutes() {
    if (!isLocalHost(window.location.hostname)) {
      return;
    }

    const logo = document.querySelector(".logo");
    const footerHomeLink = document.querySelector("[data-home-link]");
    const aboutLink = document.querySelector("[data-about-link]");
    const accessibilityLink = document.querySelector("[data-accessibility-link]");
    const privacyLink = document.querySelector("[data-privacy-link]");
    const privacyStorageLink = document.querySelector("[data-privacy-storage-link]");
    const privacyTermsLink = document.querySelector("[data-privacy-terms-link]");
    const studioLink = document.querySelector("[data-studio-link]");
    const footerStudioLink = document.querySelector("[data-footer-studio-link]");

    if (logo) {
      logo.setAttribute("href", ROUTES.localHome);
    }

    if (footerHomeLink) {
      footerHomeLink.setAttribute("href", ROUTES.localHome);
    }

    if (aboutLink) {
      aboutLink.setAttribute("href", ROUTES.localAbout);
    }

    if (privacyLink) {
      privacyLink.setAttribute("href", ROUTES.localPrivacy);
    }

    if (privacyStorageLink) {
      privacyStorageLink.setAttribute("href", `${ROUTES.localPrivacy}#storage`);
    }

    if (privacyTermsLink) {
      privacyTermsLink.setAttribute("href", `${ROUTES.localPrivacy}#terms`);
    }

    if (accessibilityLink) {
      accessibilityLink.setAttribute("href", ROUTES.localAccessibility);
    }

    if (studioLink) {
      studioLink.setAttribute("href", ROUTES.localStudio);
    }

    if (footerStudioLink) {
      footerStudioLink.setAttribute("href", ROUTES.localStudio);
      footerStudioLink.removeAttribute("target");
      footerStudioLink.removeAttribute("rel");
    }

    document.querySelectorAll("[data-home-hash]").forEach((link) => {
      const hash = link.getAttribute("data-home-hash") || "";
      link.setAttribute("href", `${ROUTES.localHome}${hash}`);
    });
  }

  function applyCurrentPageState() {
    const aboutLink = document.querySelector("[data-about-link]");
    const accessibilityLink = document.querySelector("[data-accessibility-link]");
    const privacyLink = document.querySelector("[data-privacy-link]");

    if (aboutLink && isAboutPage()) {
      aboutLink.setAttribute("aria-current", "page");
    }

    if (privacyLink && isPrivacyPage()) {
      privacyLink.setAttribute("aria-current", "page");
    }

    if (accessibilityLink && isAccessibilityPage()) {
      accessibilityLink.setAttribute("aria-current", "page");
    }
  }

  function initPrototypeNotice() {
    Site.initTimedNotice({
      noticeId: "prototypeNotice",
      closeButtonId: "prototypeNoticeClose",
      isEligible: () =>
        !isAboutPage() && !isPrivacyPage() && !isAccessibilityPage(),
      shouldPause: () => document.body.classList.contains("modal-open"),
      initialDelay: 300000,
      persistenceKey: "mosion_prototype_notice_seen_v1",
    });
  }

  function boot() {
    injectLayout();
    applyLocalPreviewRoutes();
    applyCurrentPageState();

    initNavMenu();

    Site.initModal({
      modalId: "comingSoonModal",
      titleId: "comingSoonTitle",
      copyId: "comingSoonCopy",
      defaultTitle: COPY.defaultModalTitle,
      defaultCopy: COPY.defaultModalBody,
    });

    initPrototypeNotice();
  }

  Site.ready(boot);
})(window, document, window.MosionSite);
