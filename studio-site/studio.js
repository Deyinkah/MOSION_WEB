window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        mosion: {
          bg: "#070B14",
          surface: "#0B0F1C",
          accent: "#00B7FF",
          text: "#F5F7FA",
          muted: "#AEB7C2",
        },
      },
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
    },
  },
};

const films = [
  { title: "Oversabi Aunty", genre: "Comedy", year: "2025", image: "./trending/oversabi-aunty.jpeg" },
  { title: "Scream 7", genre: "Thriller", year: "2025", image: "./trending/scream-7.webp" },
  { title: "Onobiren", genre: "Drama", year: "2024", image: "./trending/banner-01.jpeg" },
  { title: "A Country Called Ghana", genre: "Adventure", year: "2024", image: "./trending/banner-03.jpeg" },
  { title: "The Housemaid", genre: "Thriller", year: "2025", image: "./trending/banner-06.jpeg" },
  { title: "Everybody Loves Jenifa", genre: "Comedy", year: "2024", image: "./trending/banner-31.jpeg" },
];

const defaultConfig = {
  background_color: "#070B14",
  surface_color: "#0B0F1C",
  accent_color: "#00B7FF",
  text_color: "#F5F7FA",
  muted_color: "#AEB7C2",
  font_family: "Bebas Neue",
  font_size: 16,
  hero_headline: "Release your film to the world.",
  hero_subheadline: "MOSION Studio helps filmmakers launch cinema premieres directly on mobile.",
  hero_description: "Upload, distribute, and monetize your films through MOSION - the mobile cinema platform.",
  primary_cta_text: "Submit Your Film",
  secondary_cta_text: "Join Waitlist",
  trust_item_1: "Secure DRM Playback",
  trust_item_2: "Mobile-First Distribution",
  trust_item_3: "Pay-Per-View Monetization",
  trust_item_4: "Submission Review Support",
  outcomes_headline: "Why MOSION Studio Is Built for Filmmakers",
  outcome_1: "Reach mobile audiences directly without traditional theater dependence",
  outcome_2: "Retain more release flexibility with independent distribution options",
  outcome_3: "Access performance visibility and viewer engagement metrics instantly",
  outcome_4: "Earn revenue while building direct relationships with global film audiences",
  vision_text: "MOSION is reshaping cinema distribution - enabling filmmakers to premiere directly to mobile audiences globally, capturing the moment when smartphones became the primary cinema platform.",
  final_cta_headline: "Ready to release your film?",
  final_cta_subheadline: "Join MOSION Studio and bring your film to audiences everywhere.",
};

let themeToggle;
let themeIconMoon;
let themeIconSun;

function renderFilmGrid() {
  const grid = document.getElementById("film-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = "";
  films.forEach((film, i) => {
    const card = document.createElement("div");
    card.className = `poster-card rounded-xl overflow-hidden cursor-pointer reveal reveal-delay-${Math.min(i % 5, 4)}`;
    card.innerHTML = `
      <div class="relative poster-media">
        <img src="${film.image}" alt="${film.title} poster" class="absolute inset-0 w-full h-full object-cover" loading="lazy">
        <div class="absolute top-3 right-3 z-10 rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[10px] font-medium tracking-wider text-white/88 backdrop-blur-sm">${film.year}</div>
        <div class="absolute top-3 left-3 z-10 rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[10px] font-medium tracking-wider text-mosion-accent backdrop-blur-sm uppercase">${film.genre}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function submitWaitlistSignup(email) {
  const response = await fetch("/api/waitlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ email, source: "studio" }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "We could not complete your waitlist signup.");
  }

  if (result.confirmationSent === false) {
    throw new Error("You joined the waitlist, but we couldn't send the confirmation email just now.");
  }

  return result;
}

function setWaitlistStatus(statusNode, message, type = "") {
  if (!statusNode) {
    return;
  }

  statusNode.textContent = message;
  statusNode.classList.remove("is-error", "is-success");

  if (type) {
    statusNode.classList.add(`is-${type}`);
  }
}

function initStudioWaitlist() {
  const modal = document.getElementById("studio-waitlist-modal");
  const dialog = modal?.querySelector(".studio-waitlist-modal__dialog");
  const heroCelebration = document.getElementById("studio-hero-celebration");
  const form = document.getElementById("studio-waitlist-form");
  const emailInput = document.getElementById("studio-waitlist-email");
  const status = document.getElementById("studio-waitlist-status");
  const submitButton = document.getElementById("studio-waitlist-submit");
  const formView = document.getElementById("studio-waitlist-form-view");
  const successView = document.getElementById("studio-waitlist-success");
  const openButtons = Array.from(document.querySelectorAll("[data-studio-waitlist-open]"));
  const closeButtons = Array.from(document.querySelectorAll("[data-studio-waitlist-close]"));

  if (
    !modal ||
    !dialog ||
    !form ||
    !emailInput ||
    !status ||
    !submitButton ||
    !formView ||
    !successView ||
    !openButtons.length
  ) {
    return;
  }

  let lastActiveElement = null;
  const defaultSubmitLabel = submitButton.textContent.trim();

  if (heroCelebration && !heroCelebration.childElementCount) {
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < 30; index += 1) {
      const piece = document.createElement("span");
      piece.className = "studio-hero-celebration__piece";
      fragment.appendChild(piece);
    }

    heroCelebration.appendChild(fragment);
  }

  const playHeroCelebration = () => {
    if (!heroCelebration) {
      return;
    }

    heroCelebration.classList.remove("is-active");
    void heroCelebration.offsetWidth;
    heroCelebration.classList.add("is-active");
  };

  const resetModalState = () => {
    form.reset();
    formView.hidden = false;
    successView.hidden = true;
    dialog.classList.remove("is-success");
    heroCelebration?.classList.remove("is-active");
    submitButton.disabled = false;
    submitButton.textContent = defaultSubmitLabel;
    setWaitlistStatus(status, "");
  };

  const openModal = (event) => {
    if (event) {
      event.preventDefault();
    }

    lastActiveElement = document.activeElement;
    resetModalState();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => {
      emailInput.focus();
    });
  };

  const closeModal = () => {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    resetModalState();

    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
      lastActiveElement.focus();
    }
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", openModal);
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();

    if (!isValidEmail(email)) {
      setWaitlistStatus(status, "Enter a valid email address.", "error");
      emailInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Joining...";
    setWaitlistStatus(status, "");

    try {
      await Promise.all([
        submitWaitlistSignup(email),
        delay(800),
      ]);

      formView.hidden = true;
      successView.hidden = false;
      dialog.classList.add("is-success");
      playHeroCelebration();
      setWaitlistStatus(status, "");
    } catch (error) {
      setWaitlistStatus(status, error.message || "We could not complete your waitlist signup.", "error");
      emailInput.focus();
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = defaultSubmitLabel;
    }
  });
}

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-theme", isLight);

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
  }

  if (themeIconMoon && themeIconSun) {
    themeIconMoon.classList.toggle("hidden", isLight);
    themeIconSun.classList.toggle("hidden", !isLight);
  }
}

async function onConfigChange(config) {
  const c = (key) => config[key] || defaultConfig[key];
  const font = c("font_family");
  const baseSize = c("font_size");
  const bodyFont = "DM Sans, sans-serif";
  const displayStack = `${font}, sans-serif`;

  document.querySelectorAll(".font-display").forEach((el) => {
    el.style.fontFamily = displayStack;
  });

  const heroH = document.getElementById("hero-headline");
  if (heroH) {
    heroH.textContent = c("hero_headline");
    heroH.style.fontFamily = displayStack;
  }

  const heroSub = document.getElementById("hero-subheadline");
  if (heroSub) {
    heroSub.textContent = c("hero_subheadline");
    heroSub.style.fontFamily = bodyFont;
    heroSub.style.fontSize = `${baseSize * 1.125}px`;
  }

  const heroDesc = document.getElementById("hero-description");
  if (heroDesc) {
    heroDesc.textContent = c("hero_description");
    heroDesc.style.fontFamily = bodyFont;
    heroDesc.style.fontSize = `${baseSize}px`;
  }

  const heroPrimary = document.getElementById("hero-primary-cta");
  if (heroPrimary) {
    heroPrimary.textContent = c("primary_cta_text");
    heroPrimary.style.fontSize = `${baseSize}px`;
  }

  const heroSecondary = document.getElementById("hero-secondary-cta");
  if (heroSecondary) {
    heroSecondary.textContent = c("secondary_cta_text");
    heroSecondary.style.fontSize = `${baseSize}px`;
  }

  const navSubmit = document.getElementById("nav-submit-btn");
  if (navSubmit) {
    navSubmit.textContent = c("primary_cta_text");
  }

  const trust1 = document.getElementById("trust-1");
  if (trust1) {
    trust1.textContent = c("trust_item_1");
  }

  const trust2 = document.getElementById("trust-2");
  if (trust2) {
    trust2.textContent = c("trust_item_2");
  }

  const trust3 = document.getElementById("trust-3");
  if (trust3) {
    trust3.textContent = c("trust_item_3");
  }

  const trust4 = document.getElementById("trust-4");
  if (trust4) {
    trust4.textContent = c("trust_item_4");
  }

  const outcomesH = document.getElementById("outcomes-headline");
  if (outcomesH) {
    outcomesH.textContent = c("outcomes_headline");
    outcomesH.style.fontFamily = displayStack;
  }

  const outcome1 = document.getElementById("outcome-1");
  if (outcome1) {
    outcome1.textContent = c("outcome_1");
  }

  const outcome2 = document.getElementById("outcome-2");
  if (outcome2) {
    outcome2.textContent = c("outcome_2");
  }

  const outcome3 = document.getElementById("outcome-3");
  if (outcome3) {
    outcome3.textContent = c("outcome_3");
  }

  const outcome4 = document.getElementById("outcome-4");
  if (outcome4) {
    outcome4.textContent = c("outcome_4");
  }

  const visionEl = document.getElementById("vision-text");
  if (visionEl) {
    visionEl.textContent = c("vision_text");
    visionEl.style.fontFamily = bodyFont;
    visionEl.style.fontSize = `${baseSize}px`;
  }

  const finalH = document.getElementById("final-cta-headline");
  if (finalH) {
    finalH.textContent = c("final_cta_headline");
    finalH.style.fontFamily = displayStack;
  }

  const finalSub = document.getElementById("final-cta-subheadline");
  if (finalSub) {
    finalSub.textContent = c("final_cta_subheadline");
    finalSub.style.fontFamily = bodyFont;
    finalSub.style.fontSize = `${baseSize}px`;
  }

  const finalPrimary = document.getElementById("final-primary-cta");
  if (finalPrimary) {
    finalPrimary.textContent = c("primary_cta_text");
  }

  const bg = c("background_color");
  const surface = c("surface_color");
  const accent = c("accent_color");
  const textCol = c("text_color");
  const muted = c("muted_color");

  document.body.style.background = bg;
  document.body.style.color = textCol;

  document.querySelectorAll(".text-mosion-accent").forEach((el) => {
    el.style.color = accent;
  });

  document.querySelectorAll(".bg-mosion-accent").forEach((el) => {
    el.style.backgroundColor = accent;
  });

  document.querySelectorAll(".bg-mosion-surface\\/50, .bg-mosion-surface\\/30, .bg-mosion-surface").forEach((el) => {
    el.style.backgroundColor = surface;
  });

  document.querySelectorAll(".text-mosion-muted").forEach((el) => {
    el.style.color = muted;
  });
}

function mapToCapabilities(config) {
  const c = (key) => config[key] || defaultConfig[key];
  return {
    recolorables: [
      { get: () => c("background_color"), set: (v) => { config.background_color = v; window.elementSdk.setConfig({ background_color: v }); } },
      { get: () => c("surface_color"), set: (v) => { config.surface_color = v; window.elementSdk.setConfig({ surface_color: v }); } },
      { get: () => c("text_color"), set: (v) => { config.text_color = v; window.elementSdk.setConfig({ text_color: v }); } },
      { get: () => c("accent_color"), set: (v) => { config.accent_color = v; window.elementSdk.setConfig({ accent_color: v }); } },
      { get: () => c("muted_color"), set: (v) => { config.muted_color = v; window.elementSdk.setConfig({ muted_color: v }); } },
    ],
    borderables: [],
    fontEditable: {
      get: () => c("font_family"),
      set: (v) => { config.font_family = v; window.elementSdk.setConfig({ font_family: v }); },
    },
    fontSizeable: {
      get: () => c("font_size"),
      set: (v) => { config.font_size = v; window.elementSdk.setConfig({ font_size: v }); },
    },
  };
}

function mapToEditPanelValues(config) {
  const c = (key) => config[key] || defaultConfig[key];
  return new Map([
    ["hero_headline", c("hero_headline")],
    ["hero_subheadline", c("hero_subheadline")],
    ["hero_description", c("hero_description")],
    ["primary_cta_text", c("primary_cta_text")],
    ["secondary_cta_text", c("secondary_cta_text")],
    ["trust_item_1", c("trust_item_1")],
    ["trust_item_2", c("trust_item_2")],
    ["trust_item_3", c("trust_item_3")],
    ["trust_item_4", c("trust_item_4")],
    ["outcomes_headline", c("outcomes_headline")],
    ["outcome_1", c("outcome_1")],
    ["outcome_2", c("outcome_2")],
    ["outcome_3", c("outcome_3")],
    ["outcome_4", c("outcome_4")],
    ["vision_text", c("vision_text")],
    ["final_cta_headline", c("final_cta_headline")],
    ["final_cta_subheadline", c("final_cta_subheadline")],
  ]);
}

function initStudioPage() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const downloadSection = document.getElementById("download");
  const navSubmit = document.getElementById("nav-submit-btn");
  const heroPrimary = document.getElementById("hero-primary-cta");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  document.querySelectorAll("#mobile-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileMenu) {
        mobileMenu.classList.add("hidden");
      }
    });
  });

  const scrollToDownload = (event) => {
    if (!downloadSection) {
      return;
    }

    event?.preventDefault();
    downloadSection.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  navSubmit?.addEventListener("click", scrollToDownload);
  heroPrimary?.addEventListener("click", scrollToDownload);

  themeToggle = document.getElementById("theme-toggle");
  themeIconMoon = document.getElementById("theme-icon-moon");
  themeIconSun = document.getElementById("theme-icon-sun");

  if (themeToggle) {
    applyTheme("dark");

    themeToggle.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("light-theme") ? "dark" : "light";
      applyTheme(nextTheme);
    });
  }

  renderFilmGrid();
  initStudioWaitlist();

  if (window.elementSdk) {
    window.elementSdk.init({
      defaultConfig,
      onConfigChange,
      mapToCapabilities,
      mapToEditPanelValues,
    });
  }

  setTimeout(() => {
    initScrollReveal();
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, 100);
}

document.addEventListener("DOMContentLoaded", initStudioPage);
