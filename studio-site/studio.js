(function initStudioPage(window, document, Site) {
  "use strict";

  if (!Site) {
    return;
  }

  const COPY = {
    defaultFormNote:
      "You'll be notified when filmmaker onboarding opens. No spam, ever.",
    iosBetaCopy:
      "The MOSION Studio beta application is being prepared for release. Join the waitlist and we will reach out as soon as the build is ready.",
    iosBetaTitle: "Studio beta coming soon",
    waitlistError: "We could not complete your waitlist signup.",
    waitlistSubmitting: "Requesting...",
  };

  function initNav() {
    const nav = document.querySelector("nav");
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");

    if (!nav || !toggle || !links) {
      return;
    }

    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    setOpen(false);

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setOpen(!links.classList.contains("is-open"));
    });

    links.querySelectorAll("a[href^='#']").forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");

        if (href && Site.scrollToHash(href)) {
          event.preventDefault();
        }

        setOpen(false);
      });
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target)) {
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

  function initComingSoonModal() {
    const modalControls = Site.initModal({
      modalId: "comingSoonModal",
      titleId: "comingSoonTitle",
      copyId: "comingSoonCopy",
      defaultTitle: COPY.iosBetaTitle,
      defaultCopy: COPY.iosBetaCopy,
    });

    if (!modalControls) {
      return;
    }

    const betaApkLink = document.querySelector("[data-beta-apk-link]");

    if (!betaApkLink) {
      return;
    }

    betaApkLink.addEventListener("click", (event) => {
      if (!Site.isIosDevice()) {
        return;
      }

      event.preventDefault();
      modalControls.open(
        betaApkLink,
        betaApkLink.getAttribute("data-ios-modal-title"),
        betaApkLink.getAttribute("data-ios-modal-copy")
      );
    });
  }

  function initPrototypeNotice() {
    const heroRight = document.querySelector(".hero-right");

    if (!heroRight) {
      return;
    }

    const desktopMedia = window.matchMedia("(min-width: 1025px)");
    const canShowNotice = () =>
      desktopMedia.matches && window.getComputedStyle(heroRight).display !== "none";

    const noticeControls = Site.initTimedNotice({
      noticeId: "prototypeNotice",
      closeButtonId: "prototypeNoticeClose",
      isEligible: canShowNotice,
      shouldPause: () => document.body.classList.contains("modal-open"),
    });

    if (!noticeControls) {
      return;
    }

    const refreshEligibility = () => {
      noticeControls.refresh(6000);
    };

    if (typeof desktopMedia.addEventListener === "function") {
      desktopMedia.addEventListener("change", refreshEligibility);
    } else if (typeof desktopMedia.addListener === "function") {
      desktopMedia.addListener(refreshEligibility);
    }

    window.addEventListener("resize", refreshEligibility, { passive: true });
  }

  function flashInvalidInputs(inputs) {
    inputs.forEach((input) => {
      input.style.borderColor = "#e03e3e";
    });

    window.setTimeout(() => {
      inputs.forEach((input) => {
        input.style.borderColor = "";
      });
    }, 2000);
  }

  function initWaitlistForm() {
    const form = document.getElementById("studioWaitlistForm");
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("email");
    const filmNameInput = document.getElementById("filmName");
    const originInput = document.getElementById("origin");
    const successState = document.getElementById("successState");
    const successSub = successState
      ? successState.querySelector(".success-sub")
      : null;
    const note = document.getElementById("studioFormNote");
    const submitButton = document.getElementById("studioSubmitButton");

    if (
      !form ||
      !firstNameInput ||
      !lastNameInput ||
      !emailInput ||
      !filmNameInput ||
      !originInput ||
      !successState ||
      !note ||
      !submitButton
    ) {
      return;
    }

    const defaultButton = submitButton.innerHTML;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      note.textContent = COPY.defaultFormNote;
      note.style.color = "";

      const firstName = firstNameInput.value.trim();
      const lastName = lastNameInput.value.trim();
      const email = emailInput.value.trim().toLowerCase();
      const filmName = filmNameInput.value.trim();
      const origin = originInput.value.trim();

      const invalidInputs = [];

      if (!firstName) {
        invalidInputs.push(firstNameInput);
      }

      if (!Site.isValidEmail(email)) {
        invalidInputs.push(emailInput);
      }

      if (invalidInputs.length) {
        flashInvalidInputs(invalidInputs);
        return;
      }

      submitButton.disabled = true;
      submitButton.innerHTML = COPY.waitlistSubmitting;

      try {
        const result = await Site.submitWaitlistSignup(
          {
            email,
            filmName,
            firstName,
            lastName,
            origin,
            source: "studio",
          },
          { fallbackError: COPY.waitlistError }
        );

        form.style.display = "none";
        successState.classList.add("show");

        if (result.confirmationSent === false && successSub) {
          successSub.textContent =
            "Your access request is saved. We could not send the confirmation email yet, but your details are on the list.";
        }
      } catch (error) {
        note.textContent = error.message || COPY.waitlistError;
        note.style.color = "#e03e3e";
        flashInvalidInputs([emailInput]);
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = defaultButton;
      }
    });
  }

  function boot() {
    Site.initCursor({
      cursorId: "cursor",
      ringId: "cursorRing",
    });

    Site.initReveal({
      selector: ".reveal",
      visibleClass: "visible",
      threshold: 0.12,
    });

    initNav();
    initComingSoonModal();
    initPrototypeNotice();
    initWaitlistForm();
  }

  Site.ready(boot);
})(window, document, window.MosionSite);
