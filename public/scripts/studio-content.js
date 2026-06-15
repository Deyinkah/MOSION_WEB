(function initStudioContentPage(window, document, Site) {
  "use strict";

  if (!Site) {
    return;
  }

  const COPY = {
    defaultFormNote:
      "Applications are reviewed manually. Access is granted only to approved partners.",
    waitlistError: "We could not submit your application.",
    waitlistSubmitting: "Submitting...",
  };

  function flashInvalidInputs(inputs) {
    inputs.forEach((input) => {
      input.classList.add("is-invalid");
    });

    window.setTimeout(() => {
      inputs.forEach((input) => {
        input.classList.remove("is-invalid");
      });
    }, 2000);
  }

  function isValidUrl(value) {
    if (!value) {
      return true;
    }

    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  function initMobileFormToggle() {
    const applySection = document.getElementById("apply");
    const formArea = applySection
      ? applySection.querySelector(".waitlist-form-area")
      : null;
    const closeButton = document.getElementById("studioFormCancel");
    const emailInput = document.getElementById("email");
    const applyLinks = Array.from(
      document.querySelectorAll("a[href='#studioWaitlistForm']")
    );

    if (!applySection || !formArea || !closeButton || !emailInput || !applyLinks.length) {
      return;
    }

    const mobileMedia = window.matchMedia("(max-width: 640px)");
    const desktopMedia = window.matchMedia("(min-width: 1025px)");
    let focusTimer = null;
    let mobileFormOpen = false;

    const focusEmail = () => {
      if (focusTimer) {
        window.clearTimeout(focusTimer);
      }

      focusTimer = window.setTimeout(() => {
        emailInput.focus();
      }, 420);
    };

    const syncMobileState = () => {
      const isOpen = mobileMedia.matches && mobileFormOpen;

      applySection.classList.toggle("is-mobile-form-open", isOpen);
      document.body.classList.toggle("studio-form-modal-open", isOpen);
      formArea.setAttribute("aria-hidden", String(mobileMedia.matches ? !isOpen : false));
    };

    const openMobileForm = () => {
      if (!mobileMedia.matches) {
        return;
      }

      mobileFormOpen = true;
      syncMobileState();
    };

    const closeMobileForm = () => {
      if (!mobileMedia.matches) {
        return;
      }

      mobileFormOpen = false;
      syncMobileState();

      if (document.activeElement && formArea.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    };

    applyLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        if (mobileMedia.matches) {
          event.preventDefault();
          openMobileForm();
          focusEmail();
          return;
        }

        if (!desktopMedia.matches) {
          return;
        }

        event.preventDefault();
        Site.scrollToHash("#studioWaitlistForm");
        focusEmail();
      });
    });

    closeButton.addEventListener("click", closeMobileForm);

    const handleMobileMediaChange = () => {
      mobileFormOpen = false;
      syncMobileState();
    };

    if (typeof mobileMedia.addEventListener === "function") {
      mobileMedia.addEventListener("change", handleMobileMediaChange);
    } else if (typeof mobileMedia.addListener === "function") {
      mobileMedia.addListener(handleMobileMediaChange);
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mobileMedia.matches && mobileFormOpen) {
        closeMobileForm();
      }
    });

    window.addEventListener("resize", syncMobileState, { passive: true });
    syncMobileState();

    const shouldAutoFocusWaitlist =
      String(window.location.hash || "").trim() === "#studioWaitlistForm";

    if (shouldAutoFocusWaitlist) {
      if (mobileMedia.matches) {
        openMobileForm();
      } else {
        Site.scrollToHash("#studioWaitlistForm");
      }
      focusEmail();
    }
  }

  function initApplicationForm() {
    const form = document.getElementById("studioWaitlistForm");
    const formArea = document.getElementById("waitlistFormArea");
    const formContent = document.getElementById("applicationFormContent");
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("email");
    const companyWebsiteInput = document.getElementById("companyWebsite");
    const filmNameInput = document.getElementById("filmName");
    const originInput = document.getElementById("origin");
    const rightsStatusInput = document.getElementById("rightsStatus");
    const releaseStageInput = document.getElementById("releaseStage");
    const territoryFocusInput = document.getElementById("territoryFocus");
    const screenerUrlInput = document.getElementById("screenerUrl");
    const submissionSummaryInput = document.getElementById("submissionSummary");
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
      !companyWebsiteInput ||
      !filmNameInput ||
      !originInput ||
      !rightsStatusInput ||
      !releaseStageInput ||
      !territoryFocusInput ||
      !screenerUrlInput ||
      !submissionSummaryInput ||
      !formArea ||
      !formContent ||
      !successState ||
      !note ||
      !submitButton
    ) {
      return;
    }

    const defaultButton = submitButton.innerHTML;

    function revealSubmittedState(options = {}) {
      const fallbackCopy =
        "Your application was received. We could not send the confirmation email yet, but your details are in review.";
      const shouldUseFallbackCopy = options.confirmationSent === false;

      formContent.classList.add("is-hidden");
      formArea.classList.add("is-success");
      successState.classList.add("show");

      if (successSub) {
        successSub.textContent = shouldUseFallbackCopy
          ? fallbackCopy
          : "We'll review your details and reach out if there is fit for partner onboarding. Studio access and title listing are both subject to review.";
      }

      requestAnimationFrame(() => {
        successState.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      note.textContent = COPY.defaultFormNote;
      note.classList.remove("is-error");

      const firstName = firstNameInput.value.trim();
      const lastName = lastNameInput.value.trim();
      const email = emailInput.value.trim().toLowerCase();
      const companyWebsite = companyWebsiteInput.value.trim();
      const filmName = filmNameInput.value.trim();
      const origin = originInput.value.trim();
      const rightsStatus = rightsStatusInput.value.trim();
      const releaseStage = releaseStageInput.value.trim();
      const territoryFocus = territoryFocusInput.value.trim();
      const screenerUrl = screenerUrlInput.value.trim();
      const submissionSummary = submissionSummaryInput.value.trim();

      const invalidInputs = [];

      if (!firstName) {
        invalidInputs.push(firstNameInput);
      }

      if (!Site.isValidEmail(email)) {
        invalidInputs.push(emailInput);
      }

      if (!filmName) {
        invalidInputs.push(filmNameInput);
      }

      if (!origin) {
        invalidInputs.push(originInput);
      }

      if (!rightsStatus) {
        invalidInputs.push(rightsStatusInput);
      }

      if (!releaseStage) {
        invalidInputs.push(releaseStageInput);
      }

      if (!territoryFocus) {
        invalidInputs.push(territoryFocusInput);
      }

      if (!submissionSummary) {
        invalidInputs.push(submissionSummaryInput);
      }

      if (!isValidUrl(companyWebsite)) {
        invalidInputs.push(companyWebsiteInput);
      }

      if (!isValidUrl(screenerUrl)) {
        invalidInputs.push(screenerUrlInput);
      }

      if (invalidInputs.length) {
        flashInvalidInputs(invalidInputs);
        invalidInputs[0].focus();
        return;
      }

      submitButton.disabled = true;
      submitButton.innerHTML = COPY.waitlistSubmitting;

      try {
        const result = await Site.submitWaitlistSignup(
          {
            email,
            companyWebsite,
            filmName,
            firstName,
            lastName,
            origin,
            releaseStage,
            rightsStatus,
            screenerUrl,
            source: "studio",
            submissionSummary,
            territoryFocus,
          },
          { fallbackError: COPY.waitlistError }
        );

        revealSubmittedState({ confirmationSent: result.confirmationSent });
      } catch (error) {
        note.textContent = error.message || COPY.waitlistError;
        note.classList.add("is-error");
        flashInvalidInputs([emailInput]);
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = defaultButton;
      }
    });
  }

  function boot() {
    initMobileFormToggle();
    initApplicationForm();
  }

  Site.ready(boot);
})(window, document, window.MosionSite);
