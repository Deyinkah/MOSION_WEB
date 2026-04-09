(function initHomePage(window, document, Site) {
  "use strict";

  const WAITLIST_ERROR = "We could not complete your waitlist signup.";
  const EMAIL_ERROR = "Enter a valid email address.";
  const JOINING_LABEL = "Joining...";
  const ERROR_RESET_DELAY = 3200;

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

    if (
      !form ||
      !input ||
      !submitButton ||
      !note ||
      !successState ||
      !successCopy
    ) {
      return;
    }

    const defaultNote = note.textContent;
    const defaultLabel = submitButton.innerHTML;
    let errorTimer = null;

    const clearErrorState = () => {
      if (errorTimer) {
        window.clearTimeout(errorTimer);
        errorTimer = null;
      }

      input.classList.remove("is-error");
      note.classList.remove("is-error");
      note.textContent = defaultNote;
    };

    const showError = (message) => {
      clearErrorState();
      input.classList.add("is-error");
      note.classList.add("is-error");
      note.textContent = message;

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
      submitButton.innerHTML = JOINING_LABEL;

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
        submitButton.innerHTML = defaultLabel;
      }
    });
  }

  function boot() {
    Site.initReveal({
      selector: ".r",
      visibleClass: "v",
      threshold: 0.1,
    });

    initFilmCards();
    initWaitlist();
  }

  if (!Site) {
    return;
  }

  Site.ready(boot);
})(window, document, window.MosionSite);
