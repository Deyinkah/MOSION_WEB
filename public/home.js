document.documentElement.classList.add("has-reveal");

const TRENDING_ROTATION_DELAY = 5000;

function getWaitlistEndpoint() {
  const host = window.location.hostname.toLowerCase();

  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
    return "/api/waitlist";
  }

  return "https://api.mosion.app/api/waitlist";
}

const browseMovies = [
  {
    title: "Oversabi Aunty",
    genre: "comedy",
    genreLabel: "Comedy",
    year: 2025,
    image: "./trending/oversabi-aunty.jpeg"
  },
  {
    title: "Scream 7",
    genre: "thriller",
    genreLabel: "Thriller",
    year: 2025,
    image: "./trending/scream-7.webp"
  },
  {
    title: "Onobiren",
    genre: "drama",
    genreLabel: "Drama",
    year: 2024,
    image: "./trending/banner-01.jpeg"
  },
  {
    title: "A Country Called Ghana",
    genre: "adventure",
    genreLabel: "Adventure",
    year: 2024,
    image: "./trending/banner-03.jpeg"
  },
  {
    title: "The Housemaid",
    genre: "thriller",
    genreLabel: "Thriller",
    year: 2025,
    image: "./trending/banner-06.jpeg"
  },
  {
    title: "Silence",
    genre: "drama",
    genreLabel: "Drama",
    year: 2024,
    image: "./trending/banner-23.jpeg"
  },
  {
    title: "Everybody Loves Jenifa",
    genre: "comedy",
    genreLabel: "Comedy",
    year: 2024,
    image: "./trending/banner-31.jpeg"
  }
];

function getPosterUrl(card) {
  const backgroundImage = window.getComputedStyle(card).backgroundImage;
  const match = backgroundImage.match(/url\((['"]?)(.*?)\1\)/);

  return match ? match[2] : "";
}

function getPosterTitle(card) {
  const label = card.getAttribute("aria-label") || "";

  return label.replace(/\s*poster$/i, "").toUpperCase();
}

function setSvgHref(node, value) {
  if (!node || !value) {
    return;
  }

  node.setAttribute("href", value);
  node.setAttributeNS("http://www.w3.org/1999/xlink", "href", value);
}

function syncTrendingToPhonePreview() {
  const cards = Array.from(document.querySelectorAll("#trending .poster-card"));

  if (cards.length < 4) {
    return;
  }

  const nowPlayingImage = document.getElementById("phone-now-playing-image");
  const nowPlayingTitle = document.getElementById("phone-now-playing-title");
  const upNextImages = [
    document.getElementById("phone-up-next-1"),
    document.getElementById("phone-up-next-2"),
    document.getElementById("phone-up-next-3")
  ];

  const [firstCard, secondCard, thirdCard, fourthCard] = cards;

  setSvgHref(nowPlayingImage, getPosterUrl(firstCard));

  if (nowPlayingTitle) {
    nowPlayingTitle.textContent = getPosterTitle(firstCard);
  }

  [secondCard, thirdCard, fourthCard].forEach((card, index) => {
    setSvgHref(upNextImages[index], getPosterUrl(card));
  });
}

function getTrendingOffset(index, activeIndex, total) {
  let offset = index - activeIndex;

  if (offset > total / 2) {
    offset -= total;
  } else if (offset < -total / 2) {
    offset += total;
  }

  return offset;
}

function initTrendingCarousel() {
  const row = document.querySelector("#trending .poster-row");
  const cards = Array.from(document.querySelectorAll("#trending .poster-card"));

  if (!row || !cards.length) {
    return;
  }

  let activeIndex = 0;
  let rotationTimer = null;
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hoverPauseQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  const applyState = () => {
    cards.forEach((card, index) => {
      const offset = getTrendingOffset(index, activeIndex, cards.length);
      const distance = Math.abs(offset);

      card.style.setProperty("--offset", String(offset));
      card.style.setProperty("--distance", String(distance));
      card.style.zIndex = String(cards.length - distance);
      card.classList.toggle("is-active", offset === 0);
    });

  };

  const stopRotation = () => {
    if (rotationTimer) {
      window.clearInterval(rotationTimer);
      rotationTimer = null;
    }
  };

  const startRotation = () => {
    stopRotation();

    if (cards.length < 2 || reducedMotionQuery.matches) {
      return;
    }

    rotationTimer = window.setInterval(() => {
      activeIndex = (activeIndex + 1) % cards.length;
      applyState();
    }, TRENDING_ROTATION_DELAY);
  };

  applyState();
  startRotation();

  if (hoverPauseQuery.matches) {
    row.addEventListener("mouseenter", stopRotation);
    row.addEventListener("mouseleave", startRotation);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopRotation();
      return;
    }

    startRotation();
  });

  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", startRotation);
  } else if (typeof reducedMotionQuery.addListener === "function") {
    reducedMotionQuery.addListener(startRotation);
  }
}

function createMovieCard(movie, index) {
  const card = document.createElement("article");
  card.className = "movie-card";
  card.style.animationDelay = `${index * 0.05}s`;

  card.innerHTML = `
    <div class="movie-card__poster">
      <img src="${movie.image}" alt="${movie.title} poster" loading="lazy" />
      <span class="movie-card__play" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="presentation">
          <path d="M8 6.8v10.4L17 12 8 6.8Z"></path>
        </svg>
      </span>
    </div>
    <div class="movie-card__body">
      <h2 class="movie-card__title">${movie.title}</h2>
      <p class="movie-card__meta"><span class="movie-card__genre">${movie.genreLabel}</span> &middot; ${movie.year}</p>
    </div>
  `;

  return card;
}

function renderBrowseMovies(filter) {
  const grid = document.getElementById("movies-grid");

  if (!grid) {
    return;
  }

  const filteredMovies = filter === "all"
    ? browseMovies
    : browseMovies.filter((movie) => movie.genre === filter);

  grid.innerHTML = "";

  if (!filteredMovies.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "movie-empty";
    emptyState.textContent = "No movies match this filter yet.";
    grid.appendChild(emptyState);
    return;
  }

  filteredMovies.forEach((movie, index) => {
    grid.appendChild(createMovieCard(movie, index));
  });
}

function setActiveBrowseFilter(button) {
  document.querySelectorAll(".filter-btn").forEach((filterButton) => {
    const isActive = filterButton === button;
    filterButton.classList.toggle("is-active", isActive);
    filterButton.setAttribute("aria-pressed", String(isActive));
  });
}

function initBrowseMovies() {
  const buttons = Array.from(document.querySelectorAll(".filter-btn"));

  if (buttons.length) {
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter || "all";
        setActiveBrowseFilter(button);
        renderBrowseMovies(filter);
      });
    });
  }

  const activeFilter = buttons.find((button) => button.classList.contains("is-active"))?.dataset.filter || "all";
  renderBrowseMovies(activeFilter);
}

function closeMobileMenu() {
  const mobileNav = document.querySelector(".mobile-nav");

  if (mobileNav) {
    mobileNav.open = false;
  }
}

function setBrowseMode(isBrowseMode) {
  const landingContent = document.getElementById("landing-content");
  const browseSection = document.getElementById("browse-movies");
  const footer = document.querySelector(".site-footer");

  if (!landingContent || !browseSection) {
    return;
  }

  document.body.classList.toggle("browse-mode", isBrowseMode);
  landingContent.hidden = isBrowseMode;
  landingContent.setAttribute("aria-hidden", String(isBrowseMode));
  browseSection.hidden = !isBrowseMode;
  browseSection.setAttribute("aria-hidden", String(!isBrowseMode));

  if (footer) {
    footer.hidden = isBrowseMode;
  }

  if (isBrowseMode) {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

function syncViewToHash() {
  const { hash } = window.location;
  const isBrowseMode = hash === "#browse-movies";

  setBrowseMode(isBrowseMode);

  if (!isBrowseMode && hash.length > 1) {
    const target = document.querySelector(hash);

    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView();
      });
    }
  }
}

function initViewToggles() {
  document.querySelectorAll('a[href="#browse-movies"]').forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu();
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const href = link.getAttribute("href");

    if (!href || href === "#" || href === "#browse-movies") {
      return;
    }

    link.addEventListener("click", () => {
      closeMobileMenu();
      setBrowseMode(false);
    });
  });

  window.addEventListener("hashchange", syncViewToHash);
  syncViewToHash();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function submitWaitlistSignup(email) {
  const response = await fetch(getWaitlistEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ email, source: "website" })
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

function initHeroWaitlist() {
  const toggle = document.getElementById("hero-waitlist-toggle");
  const form = document.getElementById("hero-waitlist-form");
  const emailInput = document.getElementById("hero-waitlist-email");
  const status = document.getElementById("hero-waitlist-status");
  const thanks = document.getElementById("hero-waitlist-thanks");
  const celebration = document.getElementById("hero-celebration");

  if (!toggle || !form || !emailInput || !status || !thanks) {
    return;
  }

  const setStatus = (message, type = "") => {
    setWaitlistStatus(status, message, type);
  };

  const playCelebration = () => {
    if (!celebration) {
      return;
    }

    celebration.classList.remove("is-active");
    void celebration.offsetWidth;
    celebration.classList.add("is-active");
  };

  const showForm = () => {
    toggle.hidden = true;
    toggle.setAttribute("aria-expanded", "true");
    form.hidden = false;
    thanks.hidden = true;
    celebration?.classList.remove("is-active");
    form.classList.remove("is-submitting");
    setStatus("");
    requestAnimationFrame(() => {
      emailInput.focus();
    });
  };

  toggle.addEventListener("click", showForm);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();

    if (!isValidEmail(email)) {
      setStatus("Enter a valid email address.", "error");
      emailInput.focus();
      return;
    }

    form.classList.add("is-submitting");
    setStatus("");

    try {
      await Promise.all([
        submitWaitlistSignup(email),
        delay(1000)
      ]);

      form.reset();
      form.hidden = true;
      thanks.hidden = false;
      playCelebration();
      setStatus("");
    } catch (error) {
      setStatus(error.message || "We could not complete your waitlist signup.", "error");
      emailInput.focus();
    } finally {
      form.classList.remove("is-submitting");
    }
  });
}

function initWaitlistModal() {
  const modal = document.getElementById("waitlist-modal");
  const form = document.getElementById("waitlist-form");
  const emailInput = document.getElementById("waitlist-email");
  const status = document.getElementById("waitlist-status");
  const openButtons = Array.from(document.querySelectorAll("[data-waitlist-open]"));
  const closeButtons = Array.from(document.querySelectorAll("[data-waitlist-close]"));

  if (!modal || !form || !emailInput || !status || !openButtons.length) {
    return;
  }

  let lastActiveElement = null;

  const setStatus = (message, type = "") => {
    setWaitlistStatus(status, message, type);
  };

  const openModal = () => {
    lastActiveElement = document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    setStatus("");
    requestAnimationFrame(() => {
      emailInput.focus();
    });
  };

  const closeModal = () => {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    form.classList.remove("is-submitting");
    form.reset();
    setStatus("");

    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
      lastActiveElement.focus();
    }
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openModal();
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeModal();
    });
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
      setStatus("Enter a valid email address.", "error");
      emailInput.focus();
      return;
    }

    form.classList.add("is-submitting");
    setStatus("Joining the waitlist...");

    try {
      await submitWaitlistSignup(email);
      form.reset();
      setStatus("Thank you for joining the waitlist.", "success");
    } catch (error) {
      setStatus(error.message || "We could not complete your waitlist signup.", "error");
    } finally {
      form.classList.remove("is-submitting");
    }
  });
}

function initScrollReveal() {
  const revealTargets = Array.from(document.querySelectorAll(".page-section, .reveal"));

  if (!revealTargets.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => {
      target.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.14,
    rootMargin: "0px 0px -10% 0px"
  });

  revealTargets.forEach((target) => {
    observer.observe(target);
  });
}

function initHomePage() {
  initBrowseMovies();
  syncTrendingToPhonePreview();
  initTrendingCarousel();
  initViewToggles();
  initScrollReveal();
  initHeroWaitlist();
  initWaitlistModal();
}

window.addEventListener("DOMContentLoaded", initHomePage);
