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
    home: "/",
    localStudio: "/studio",
    studio: "https://studio.mosion.app",
  };

  const COPY = {
    defaultModalBody: "This page is being prepared and will be available soon.",
    defaultModalTitle: "Coming soon",
    footerMission:
      "MOSION is building the infrastructure for African cinema distribution, starting in your pocket.",
    prototypeNotice:
      "Titles, artwork, and pricing shown across this site are demo content. The live MOSION catalog will be built through licensed studio partnerships.",
  };

  function normalizePathname(pathname) {
    return pathname.replace(/\/+$/, "") || "/";
  }

  function isAboutPage() {
    const pathname = normalizePathname(window.location.pathname);
    return pathname === "/about" || pathname === "/about.html";
  }

  function isHomePage() {
    const pathname = normalizePathname(window.location.pathname);
    return pathname === "/" || pathname === "/index.html";
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
<nav>
  <a href="${ROUTES.home}" class="logo">
    <img src="${ASSETS.wordmark}" alt="MOSION" class="logo-wordmark" />
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
        <a href="/#how">How it Works</a>
        <a href="${ROUTES.studio}" data-studio-link data-local-href="${ROUTES.localStudio}" target="_blank" rel="noopener noreferrer">Studio Platform</a>
        <a href="/#download">Get the App</a>
      </div>
    </div>
  </div>
</nav>`;
  }

  function createFooterMarkup() {
    return `
<footer>
  <div class="f-brand">
    <div class="f-logo"><img src="${ASSETS.wordmark}" alt="MOSION" class="logo-wordmark" /></div>
    <div class="f-mission">${COPY.footerMission}</div>
  </div>
  <ul class="f-links">
    <li><a href="${ROUTES.about}">About</a></li>
    <li><a href="#" data-coming-soon-title="Terms &amp; Conditions" data-coming-soon-copy="The Terms &amp; Conditions page is being prepared and will be available soon.">Terms</a></li>
    <li><a href="#" data-coming-soon-title="Privacy Policy" data-coming-soon-copy="The Privacy Policy page is being prepared and will be available soon.">Privacy</a></li>
    <li><a href="#" data-coming-soon-title="Support" data-coming-soon-copy="The Support page is being prepared and will be available soon.">Support</a></li>
    <li><a href="#" data-coming-soon-title="Contact" data-coming-soon-copy="The Contact page is being prepared and will be available soon.">Contact</a></li>
  </ul>
  <div class="f-copy">&copy; 2026 Mosion. All rights reserved.</div>
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
  <button type="button" class="prototype-notice-close" id="prototypeNoticeClose" aria-label="Dismiss prototype notice">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  </button>
  <div class="prototype-notice-kicker">Prototype Notice</div>
  <div class="prototype-notice-title" id="prototypeNoticeTitle">Sample interface only</div>
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

  function initPrototypeNotice() {
    Site.initTimedNotice({
      noticeId: "prototypeNotice",
      closeButtonId: "prototypeNoticeClose",
      isEligible: () => !isAboutPage(),
      shouldPause: () => document.body.classList.contains("modal-open"),
    });
  }

  function boot() {
    injectLayout();

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
