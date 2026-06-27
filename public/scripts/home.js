(function initHomePage(window, document, Site) {
  "use strict";

  if (!Site) {
    return;
  }

  const WAITLIST_ERROR = "We could not complete your waitlist signup.";
  const EMAIL_ERROR = "Enter a valid email address.";
  const JOINING_LABEL = "Joining...";
  const ERROR_RESET_DELAY = 3200;
  const WAITLIST_COUNT_TARGET = 200;
  const WAITLIST_COUNT_DURATION_MS = 1400;

  const MOBILE_FILM_CARD_QUERY = "(max-width: 640px)";

  function initFilmCards() {
    const cards = Array.from(document.querySelectorAll(".film-card"));

    if (!cards.length) {
      return;
    }

    const mobileQuery = window.matchMedia(MOBILE_FILM_CARD_QUERY);

    const collapseAll = (exceptCard = null) => {
      cards.forEach((card) => {
        if (card !== exceptCard) {
          card.classList.remove("is-active");
        }
      });
    };

    cards.forEach((card) => {
      card.addEventListener("click", (event) => {
        if (!mobileQuery.matches) {
          return;
        }

        event.preventDefault();
        const nextState = !card.classList.contains("is-active");
        collapseAll(card);
        card.classList.toggle("is-active", nextState);
      });
    });

    document.addEventListener("click", (event) => {
      if (!mobileQuery.matches || event.target.closest(".film-card")) {
        return;
      }

      collapseAll();
    });

    const resetCards = () => {
      if (!mobileQuery.matches) {
        collapseAll();
      }
    };

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", resetCards);
    } else if (typeof mobileQuery.addListener === "function") {
      mobileQuery.addListener(resetCards);
    }
  }

  function initWaitlist() {
    const form = document.getElementById("wlForm");
    const input = document.getElementById("wlEmail");
    const submitButton = document.getElementById("wlSubmit");
    const note = document.getElementById("wlNote");
    const successState = document.getElementById("wlSuccess");
    const successCopy = document.getElementById("wlSuccessCopy");

    // `note` is optional — the form works without an on-screen note element. When it's
    // absent, errors are surfaced via the input's `is-error` style (and its title).
    if (
      !form ||
      !input ||
      !submitButton ||
      !successState ||
      !successCopy
    ) {
      return;
    }

    const defaultNote = note ? note.textContent : "";
    const defaultLabel = submitButton.textContent;
    let errorTimer = null;

    const clearErrorState = () => {
      if (errorTimer) {
        window.clearTimeout(errorTimer);
        errorTimer = null;
      }

      input.classList.remove("is-error");
      input.removeAttribute("title");
      if (note) {
        note.classList.remove("is-error");
        note.textContent = defaultNote;
      }
    };

    const showError = (message) => {
      clearErrorState();
      input.classList.add("is-error");
      if (note) {
        note.classList.add("is-error");
        note.textContent = message;
      } else {
        // No note element — surface the error on the input itself.
        input.setAttribute("title", message);
      }

      errorTimer = window.setTimeout(() => {
        clearErrorState();
      }, ERROR_RESET_DELAY);
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearErrorState();

      const email = input.value.trim().toLowerCase();

      if (!Site.isValidEmail(email)) {
        showError(EMAIL_ERROR);
        input.focus();
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = JOINING_LABEL;

      try {
        const result = await Site.submitWaitlistSignup(
          {
            email,
            source: "website",
          },
          { fallbackError: WAITLIST_ERROR }
        );

        form.hidden = true;
        successState.classList.add("show");

        if (result.confirmationSent === false) {
          successCopy.textContent =
            "You're on the waitlist. We could not send the confirmation email yet, but your signup was saved.";
        }
      } catch (error) {
        showError(error.message || WAITLIST_ERROR);
        input.focus();
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = defaultLabel;
      }
    });
  }

  function initWaitlistCounter() {
    const waitlistSection =
      document.querySelector(".waitlist-box") || document.getElementById("download");
    const countElement = document.querySelector("[data-waitlist-count]");
    const suffixElement = document.querySelector("[data-waitlist-count-suffix]");

    if (!waitlistSection || !countElement || !suffixElement) {
      return;
    }

    let animationFrameId = null;
    let isAnimating = false;
    let isReadyToTrigger = true;

    const renderCount = (value, showPlus) => {
      countElement.textContent = String(value);
      suffixElement.textContent = showPlus ? "+" : "";
    };

    const animateCount = () => {
      if (isAnimating) {
        return;
      }

      isAnimating = true;
      renderCount(0, false);

      let startTimestamp = null;

      const tick = (timestamp) => {
        if (startTimestamp === null) {
          startTimestamp = timestamp;
        }

        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / WAITLIST_COUNT_DURATION_MS, 1);
        const value = Math.floor(progress * WAITLIST_COUNT_TARGET);
        const isDone = progress >= 1;

        renderCount(isDone ? WAITLIST_COUNT_TARGET : value, isDone);

        if (!isDone) {
          animationFrameId = window.requestAnimationFrame(tick);
          return;
        }

        animationFrameId = null;
        isAnimating = false;
      };

      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(tick);
    };

    renderCount(0, false);

    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (isReadyToTrigger) {
              animateCount();
              isReadyToTrigger = false;
            }
            return;
          }

          isReadyToTrigger = true;
        });
      },
      {
        threshold: 0.45,
      }
    );

    observer.observe(waitlistSection);
  }

  function boot() {
    Site.initReveal({
      selector: ".r",
      visibleClass: "v",
    });

    initFilmCards();
    initWaitlistCounter();
    initWaitlist();
  }

  Site.ready(boot);
})(window, document, window.MosionSite);
