(function () {
  /* ─── HTML ────────────────────────────────────────────────────── */

  const NAV_HTML = `
<nav>
  <a href="/" class="logo">
    <img src="./logo-wordmark.png?v=20260329f" alt="MOSION" class="logo-wordmark" />
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
        <a href="https://studio.mosion.app" data-studio-link data-local-href="/studio" target="_blank" rel="noopener noreferrer">Studio Platform</a>
        <a href="/#download">Get the App</a>
      </div>
    </div>
  </div>
</nav>`;

  const FOOTER_HTML = `
<footer>
  <div class="f-brand">
    <div class="f-logo"><img src="./logo-wordmark.png?v=20260329f" alt="MOSION" class="logo-wordmark" /></div>
    <div class="f-mission">MOSION is building the infrastructure for African cinema distribution, starting in your pocket.</div>
  </div>
  <ul class="f-links">
    <li><a href="/about">About</a></li>
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
    <button type="button" class="coming-soon-close" data-modal-close>Close</button>
    <h3 class="coming-soon-title" id="comingSoonTitle">Application coming soon</h3>
    <p class="coming-soon-copy" id="comingSoonCopy">We are preparing the release. Join the waitlist and we will let you know as soon as it is ready.</p>
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
  <p class="prototype-notice-copy" id="prototypeNoticeCopy">
    Titles, artwork, and pricing shown across this site are demo content. The live MOSION catalog will be built through licensed studio partnerships.
  </p>
</aside>`;

  /* ─── CSS (injected only on pages that don't load home.css) ─────── */

  const LAYOUT_CSS = `
:root {
  --layout-amber: #d4a843;
  --layout-amber2: #f0c96a;
  --layout-ink: #06060a;
  --layout-cream: #f0ede6;
  --layout-muted2: rgba(240,237,230,0.28);
  --layout-border: rgba(255,255,255,0.06);
  --layout-border2: rgba(255,255,255,0.1);
}
nav{
  position:fixed;top:0;left:0;right:0;z-index:200;
  display:flex;align-items:center;justify-content:space-between;
  padding-top:calc(20px + env(safe-area-inset-top,0px));
  padding-right:calc(48px + env(safe-area-inset-right,0px));
  padding-bottom:20px;
  padding-left:calc(48px + env(safe-area-inset-left,0px));
  background:linear-gradient(to bottom,rgba(6,6,10,.98) 0%,transparent 100%);
}
.logo{
  text-decoration:none;
  display:inline-flex;align-items:center;
}
.logo-wordmark{
  height:clamp(24px,2vw,34px);
  width:auto;
  display:block;
  object-fit:contain;
}
.f-logo .logo-wordmark{
  height:clamp(22px,1.6vw,30px);
}
.nav-r{display:flex;align-items:center;gap:0}
.nav-menu{position:relative}
.nav-btn{
  background:var(--layout-amber)!important;color:var(--layout-ink)!important;
  padding:8px 16px;border-radius:2px;
  font-weight:700!important;transition:background .2s!important;
}
.nav-btn:hover{background:var(--layout-amber2)!important}
.nav-menu-toggle{
  display:inline-flex;align-items:center;gap:10px;
  border:0;cursor:pointer;
  font-family:'Space Mono',monospace;font-size:14px;
  letter-spacing:.2em;text-transform:uppercase;
}
.nav-menu-toggle svg{width:12px;height:12px;transition:transform .2s ease}
.nav-menu.is-open .nav-menu-toggle svg{transform:rotate(180deg)}
.nav-dropdown{
  position:absolute;top:calc(100% + 12px);right:0;
  min-width:220px;padding:10px;display:none;gap:6px;
  background:rgba(12,12,18,.96);
  border:1px solid rgba(255,255,255,.08);
  box-shadow:0 24px 70px rgba(0,0,0,.45);
  backdrop-filter:blur(16px);
}
.nav-menu.is-open .nav-dropdown{display:grid}
.nav-dropdown[hidden]{display:none!important}
.nav-dropdown a{
  display:block;padding:12px 14px;border-radius:2px;
  font-family:'Space Mono',monospace;font-size:10px;
  letter-spacing:.18em;text-transform:uppercase;
  color:var(--layout-cream);text-decoration:none;
  transition:background .2s,color .2s;
}
.nav-dropdown a:hover{background:rgba(212,168,67,.14);color:var(--layout-cream)}
footer{
  border-top:1px solid var(--layout-border);
  padding:44px 56px;
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:28px 48px;
  align-items:start;
}
.f-brand{display:grid;gap:14px;max-width:420px}
.f-logo{display:flex;align-items:center}
.f-links{
  display:flex;gap:28px;list-style:none;
  flex-wrap:wrap;justify-self:end;justify-content:flex-end;
}
.f-links a{
  font-family:'Space Mono',monospace;font-size:9px;
  letter-spacing:.18em;text-transform:uppercase;
  color:var(--layout-muted2);text-decoration:none;transition:color .2s;
}
.f-links a:hover{color:var(--layout-cream)}
.f-mission{
  font-family:'Space Mono',monospace;font-size:9px;
  letter-spacing:.08em;color:var(--layout-muted2);line-height:1.8;
}
.f-copy{
  grid-column:1 / -1;padding-top:18px;
  border-top:1px solid var(--layout-border);
  font-family:'Space Mono',monospace;font-size:8px;
  letter-spacing:.15em;color:var(--layout-muted2);
}
.coming-soon-modal{
  position:fixed;inset:0;z-index:10050;
  display:grid;place-items:center;padding:24px;
  opacity:0;transition:opacity .18s ease;
}
.coming-soon-modal[hidden]{display:none!important}
.coming-soon-modal.is-open{opacity:1}
.coming-soon-backdrop{
  position:absolute;inset:0;
  background:rgba(6,6,10,.78);backdrop-filter:blur(18px);
}
.coming-soon-dialog{
  position:relative;z-index:1;width:min(460px,100%);
  background:linear-gradient(180deg,rgba(16,16,24,.98) 0%,rgba(9,9,14,.98) 100%);
  border:1px solid rgba(255,255,255,.08);
  box-shadow:0 28px 80px rgba(0,0,0,.45);
  padding:32px 30px 28px;
  transform:translateY(16px);transition:transform .18s ease;
}
.coming-soon-modal.is-open .coming-soon-dialog{transform:translateY(0)}
.coming-soon-close{
  position:absolute;top:16px;right:16px;
  padding:8px 12px;border-radius:999px;
  border:1px solid var(--layout-border2);
  background:rgba(255,255,255,.02);
  color:var(--layout-muted2);
  font-family:'Space Mono',monospace;font-size:8px;
  letter-spacing:.18em;text-transform:uppercase;
  cursor:pointer;appearance:none;
}
.coming-soon-close:hover{
  border-color:rgba(212,168,67,.35);color:var(--layout-cream);
  background:rgba(212,168,67,.06);
}
.coming-soon-title{
  font-family:'Cormorant Garamond',serif;
  font-size:clamp(34px,4vw,48px);
  line-height:.95;letter-spacing:-.02em;margin-bottom:16px;
}
.coming-soon-copy{
  font-size:14px;line-height:1.8;
  color:rgba(240,237,230,0.5);font-weight:300;max-width:34ch;
}
.prototype-notice{
  position:fixed;
  right:24px;
  bottom:24px;
  z-index:10020;
  width:min(420px,calc(100vw - 32px));
  padding:18px 20px 18px 18px;
  border:1px solid rgba(212,168,67,.18);
  background:
    linear-gradient(160deg,rgba(212,168,67,.11),transparent 40%),
    linear-gradient(180deg,rgba(15,15,21,.96) 0%,rgba(8,8,12,.94) 100%);
  box-shadow:0 28px 80px rgba(0,0,0,.34);
  backdrop-filter:blur(18px);
  opacity:0;
  visibility:hidden;
  transform:translateY(22px);
  transition:opacity .28s ease,transform .28s ease,visibility .28s ease;
}
.prototype-notice::before{
  content:"";
  position:absolute;
  inset:0;
  border-left:2px solid rgba(212,168,67,.7);
  pointer-events:none;
}
.prototype-notice.is-visible{
  opacity:1;
  visibility:visible;
  transform:translateY(0);
}
.prototype-notice-close{
  position:absolute;
  top:14px;
  right:14px;
  width:32px;
  height:32px;
  display:grid;
  place-items:center;
  border:0;
  background:none;
  color:var(--layout-muted2);
  cursor:pointer;
}
.prototype-notice-close:hover{color:var(--layout-cream)}
.prototype-notice-close svg{
  width:14px;
  height:14px;
}
.prototype-notice-kicker{
  margin:0 0 12px;
  font-family:'Space Mono',monospace;
  font-size:8px;
  letter-spacing:.22em;
  text-transform:uppercase;
  color:rgba(212,168,67,.88);
}
.prototype-notice-title{
  margin:0 0 10px;
  font-family:'Cormorant Garamond',serif;
  font-size:1.4rem;
  line-height:1;
  color:var(--layout-cream);
}
.prototype-notice-copy{
  max-width:34ch;
  color:rgba(240,237,230,.68);
  font-size:13px;
  line-height:1.7;
}
body.modal-open{overflow:hidden}
@media(max-width:640px){
  nav{
    padding-top:calc(18px + env(safe-area-inset-top,0px));
    padding-right:calc(1.25rem + env(safe-area-inset-right,0px));
    padding-bottom:18px;
    padding-left:calc(1.25rem + env(safe-area-inset-left,0px));
  }
  .logo-wordmark{height:17px}
  footer{padding:32px 24px;grid-template-columns:1fr}
  .f-links{justify-self:start;justify-content:flex-start}
  .prototype-notice{
    right:16px;
    bottom:16px;
    width:calc(100vw - 32px);
    padding:16px 16px 16px 15px;
  }
  .prototype-notice-copy{max-width:none}
}`;

  /* ─── JS ──────────────────────────────────────────────────────── */

  function initNavMenu() {
    const menu = document.getElementById("navMenu");
    const toggle = document.getElementById("navMenuToggle");
    const dropdown = document.getElementById("navDropdown");
    const logo = document.querySelector(".logo");

    if (!menu || !toggle || !dropdown) return;

    const studioLink = dropdown.querySelector("[data-studio-link]");
    if (studioLink) {
      const host = window.location.hostname;
      const isLocal =
        host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
      if (isLocal) {
        const localHref = studioLink.getAttribute("data-local-href");
        if (localHref) studioLink.setAttribute("href", localHref);
      }
    }

    const setOpen = (open) => {
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      dropdown.hidden = !open;
    };

    setOpen(false);

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(dropdown.hidden);
    });

    if (logo) {
      logo.addEventListener("click", (e) => {
        if (window.location.pathname === "/") {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        setOpen(false);
      });
    }

    dropdown.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        const hash = href && href.includes("#") ? href.slice(href.indexOf("#")) : null;
        const target = hash ? document.querySelector(hash) : null;
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setOpen(false);
      });
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target)) setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 640) setOpen(false);
    });
  }

  function initComingSoonModal() {
    const modal = document.getElementById("comingSoonModal");
    const title = document.getElementById("comingSoonTitle");
    const copy = document.getElementById("comingSoonCopy");
    if (!modal || !title || !copy) return;

    const closeButton = modal.querySelector(".coming-soon-close");
    const closeTriggers = modal.querySelectorAll("[data-modal-close]");
    const triggers = document.querySelectorAll("[data-coming-soon-title]");
    if (!triggers.length) return;

    let lastTrigger = null;
    let closeTimer = null;

    const openModal = (trigger, heading, body) => {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      lastTrigger = trigger;
      title.textContent = heading || "Coming soon";
      copy.textContent = body || "This page is being prepared and will be available soon.";
      modal.hidden = false;
      document.body.classList.add("modal-open");
      requestAnimationFrame(() => {
        modal.classList.add("is-open");
        if (closeButton) closeButton.focus();
      });
    };

    const closeModal = () => {
      if (modal.hidden) return;
      modal.classList.remove("is-open");
      document.body.classList.remove("modal-open");
      closeTimer = setTimeout(() => {
        modal.hidden = true;
        if (lastTrigger) lastTrigger.focus();
      }, 180);
    };

    triggers.forEach((t) => {
      t.addEventListener("click", (e) => {
        e.preventDefault();
        openModal(t, t.getAttribute("data-coming-soon-title"), t.getAttribute("data-coming-soon-copy"));
      });
    });

    closeTriggers.forEach((t) => t.addEventListener("click", closeModal));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  function initPrototypeNotice() {
    const notice = document.getElementById("prototypeNotice");
    const closeButton = document.getElementById("prototypeNoticeClose");
    const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
    const isAboutPage = pathname === "/about" || pathname === "/about.html";
    if (!notice || !closeButton || isAboutPage) return;

    let cycleTimer = null;
    let hideTimer = null;
    let isVisible = false;
    let isHovered = false;

    const nextDelay = () => 21000 + Math.floor(Math.random() * 10001);

    const clearTimers = () => {
      if (cycleTimer) {
        window.clearTimeout(cycleTimer);
        cycleTimer = null;
      }
      if (hideTimer) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const scheduleNext = (delay = nextDelay()) => {
      if (document.hidden) return;
      cycleTimer = window.setTimeout(showNotice, delay);
    };

    const hideNotice = (schedule = true) => {
      if (!isVisible) {
        if (schedule) scheduleNext();
        return;
      }

      isVisible = false;
      notice.classList.remove("is-visible");
      document.body.classList.remove("prototype-notice-open");
      window.setTimeout(() => {
        if (!isVisible) {
          notice.hidden = true;
        }
      }, 280);

      if (schedule) scheduleNext();
    };

    const showNotice = () => {
      clearTimers();

      if (document.hidden || document.body.classList.contains("modal-open")) {
        scheduleNext(8000);
        return;
      }

      isVisible = true;
      notice.hidden = false;
      document.body.classList.add("prototype-notice-open");
      window.requestAnimationFrame(() => {
        notice.classList.add("is-visible");
      });

      hideTimer = window.setTimeout(() => {
        if (!isHovered) hideNotice(true);
      }, 9000);
    };

    notice.addEventListener("mouseenter", () => {
      isHovered = true;
      if (hideTimer) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
    });

    notice.addEventListener("mouseleave", () => {
      isHovered = false;
      if (isVisible && !hideTimer) {
        hideTimer = window.setTimeout(() => hideNotice(true), 3500);
      }
    });

    closeButton.addEventListener("click", () => {
      clearTimers();
      hideNotice(true);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearTimers();
        hideNotice(false);
        return;
      }

      clearTimers();
      scheduleNext(6000);
    });

    scheduleNext(12000);
  }

  /* ─── Boot ────────────────────────────────────────────────────── */

  document.addEventListener("DOMContentLoaded", function () {
    // Inject CSS only on pages that don't already load home.css
    const hasHomeCSS = !!document.querySelector('link[href*="home.css"]');
    if (!hasHomeCSS) {
      const style = document.createElement("style");
      style.textContent = LAYOUT_CSS;
      document.head.appendChild(style);
    }

    // Inject nav
    const navSlot = document.getElementById("site-nav");
    if (navSlot) {
      navSlot.outerHTML = NAV_HTML;
    }

    // Inject footer + modal
    const footerSlot = document.getElementById("site-footer");
    if (footerSlot) {
      footerSlot.outerHTML = FOOTER_HTML;
    }

    initNavMenu();
    initComingSoonModal();
    initPrototypeNotice();
  });
})();
