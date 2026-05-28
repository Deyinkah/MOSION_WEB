(function bootstrapSiteCore(window, document) {
  "use strict";

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const IOS_DEVICE_PATTERN = /iPad|iPhone|iPod/i;
  const DEFAULT_WAITLIST_ERROR = "We could not complete your waitlist signup.";
  const SHARED_COOKIE_DOMAIN = ".mosion.app";
  const DEFAULT_PERSISTENCE_MAX_AGE = 60 * 60 * 24 * 365;

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function isValidEmail(email) {
    return EMAIL_PATTERN.test(String(email || "").trim());
  }

  function isIosDevice() {
    const platform = window.navigator.platform || "";
    const userAgent = window.navigator.userAgent || "";
    const isAppleMobile = IOS_DEVICE_PATTERN.test(userAgent);
    const isIpadDesktopMode =
      platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

    return isAppleMobile || isIpadDesktopMode;
  }

  function getCookieDomain() {
    const host = window.location.hostname.toLowerCase();

    if (host === "mosion.app" || host.endsWith(".mosion.app")) {
      return SHARED_COOKIE_DOMAIN;
    }

    return "";
  }

  function readCookie(name) {
    const cookiePrefix = `${name}=`;
    const cookies = String(document.cookie || "").split("; ");

    for (const cookie of cookies) {
      if (cookie.startsWith(cookiePrefix)) {
        return cookie.slice(cookiePrefix.length);
      }
    }

    return "";
  }

  function hasPersistentFlag(persistenceKey) {
    if (!persistenceKey) {
      return false;
    }

    const cookieValue = readCookie(persistenceKey);

    if (cookieValue === "1") {
      return true;
    }

    try {
      return window.localStorage.getItem(persistenceKey) === "1";
    } catch (error) {
      return false;
    }
  }

  function writePersistentFlag(
    persistenceKey,
    value = "1",
    cookieMaxAge = DEFAULT_PERSISTENCE_MAX_AGE
  ) {
    if (!persistenceKey) {
      return;
    }

    const expiresAt = new Date(Date.now() + cookieMaxAge * 1000).toUTCString();
    const domain = getCookieDomain();
    const domainSegment = domain ? `; domain=${domain}` : "";
    document.cookie = `${persistenceKey}=${value}; expires=${expiresAt}; path=/; SameSite=Lax${domainSegment}`;

    try {
      window.localStorage.setItem(persistenceKey, value);
    } catch (error) {
      return;
    }
  }

  async function submitWaitlistSignup(payload, options = {}) {
    const response = await fetch(options.endpoint || "/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || options.fallbackError || DEFAULT_WAITLIST_ERROR);
    }

    return result;
  }

  function initReveal(config = {}) {
    const {
      selector,
      visibleClass,
    } = config;

    const elements = Array.from(document.querySelectorAll(selector));

    if (!elements.length) {
      return null;
    }

    elements.forEach((element) => element.classList.add(visibleClass));
    return null;
  }

  function scrollToHash(hash, options = {}) {
    if (!hash) {
      return false;
    }

    const target = document.querySelector(hash);

    if (!target) {
      return false;
    }

    target.scrollIntoView({
      behavior: options.behavior || "smooth",
      block: options.block || "start",
    });

    return true;
  }

  function initModal(config = {}) {
    const {
      modalId,
      titleId,
      copyId,
      triggerSelector = "[data-coming-soon-title]",
      closeSelector = "[data-modal-close]",
      openClass = "is-open",
      openBodyClass = "modal-open",
      closeDelay = 180,
      defaultTitle = "Coming soon",
      defaultCopy = "This page is being prepared and will be available soon.",
    } = config;

    const modal = document.getElementById(modalId);
    const title = document.getElementById(titleId);
    const copy = document.getElementById(copyId);

    if (!modal || !title || !copy) {
      return null;
    }

    const closeButton = modal.querySelector(".coming-soon-close");
    const closeTriggers = Array.from(modal.querySelectorAll(closeSelector));
    const triggers = triggerSelector
      ? Array.from(document.querySelectorAll(triggerSelector))
      : [];

    let lastTrigger = null;
    let closeTimer = null;

    const open = (trigger, heading = defaultTitle, body = defaultCopy) => {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }

      lastTrigger = trigger || null;
      title.textContent = heading || defaultTitle;
      copy.textContent = body || defaultCopy;
      modal.hidden = false;
      document.body.classList.add(openBodyClass);

      window.requestAnimationFrame(() => {
        modal.classList.add(openClass);

        if (closeButton) {
          closeButton.focus();
        }
      });
    };

    const close = () => {
      if (modal.hidden) {
        return;
      }

      modal.classList.remove(openClass);
      document.body.classList.remove(openBodyClass);

      closeTimer = window.setTimeout(() => {
        modal.hidden = true;

        if (lastTrigger && typeof lastTrigger.focus === "function") {
          lastTrigger.focus();
        }
      }, closeDelay);
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        open(
          trigger,
          trigger.getAttribute("data-coming-soon-title"),
          trigger.getAttribute("data-coming-soon-copy")
        );
      });
    });

    closeTriggers.forEach((trigger) => {
      trigger.addEventListener("click", close);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        close();
      }
    });

    return { open, close };
  }

  function initTimedNotice(config = {}) {
    const {
      noticeId,
      closeButtonId,
      visibleClass = "is-visible",
      isEligible = () => true,
      shouldPause = () => false,
      initialDelay = 12000,
      resumeDelay = 6000,
      retryDelay = 8000,
      visibleDuration = 9000,
      hoverHideDelay = 3500,
      transitionDuration = 280,
      persistenceKey = "",
      cookieMaxAge = DEFAULT_PERSISTENCE_MAX_AGE,
    } = config;

    const notice = document.getElementById(noticeId);
    const closeButton = document.getElementById(closeButtonId);

    if (!notice || !closeButton) {
      return null;
    }

    let cycleTimer = null;
    let hideTimer = null;
    let isVisible = false;
    let isHovered = false;
    let remainingDelay = initialDelay;
    let scheduledAt = null;
    let scheduledDelay = null;
    let isReadyToShow = false;

    const hasSeenNotice = () => {
      return hasPersistentFlag(persistenceKey);
    };

    const markNoticeSeen = () => {
      writePersistentFlag(persistenceKey, "1", cookieMaxAge);
    };

    const clearTimers = (preserveCountdown = false) => {
      if (cycleTimer) {
        if (
          preserveCountdown &&
          !isReadyToShow &&
          scheduledAt !== null &&
          scheduledDelay !== null
        ) {
          remainingDelay = Math.max(
            0,
            scheduledDelay - (Date.now() - scheduledAt)
          );
        }

        window.clearTimeout(cycleTimer);
        cycleTimer = null;
      }

      scheduledAt = null;
      scheduledDelay = null;

      if (hideTimer) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const scheduleNext = (delay = isReadyToShow ? 0 : remainingDelay) => {
      if (hasSeenNotice() || document.hidden || !isEligible()) {
        return;
      }

      scheduledAt = Date.now();
      scheduledDelay = Math.max(0, delay);
      cycleTimer = window.setTimeout(show, delay);
    };

    const hide = (shouldReschedule = false) => {
      if (!isVisible) {
        if (shouldReschedule && !hasSeenNotice() && isEligible()) {
          scheduleNext(isReadyToShow ? retryDelay : remainingDelay);
        }
        return;
      }

      isVisible = false;
      notice.classList.remove(visibleClass);

      window.setTimeout(() => {
        if (!isVisible) {
          notice.hidden = true;
        }
      }, transitionDuration);

      if (shouldReschedule && !hasSeenNotice() && isEligible()) {
        scheduleNext(isReadyToShow ? retryDelay : remainingDelay);
      }
    };

    const show = () => {
      clearTimers();

      if (!isReadyToShow) {
        isReadyToShow = true;
        remainingDelay = 0;
      }

      if (hasSeenNotice()) {
        return;
      }

      if (document.hidden || shouldPause() || !isEligible()) {
        if (isEligible() && !hasSeenNotice()) {
          scheduleNext(retryDelay);
        }
        return;
      }

      markNoticeSeen();
      isVisible = true;
      notice.hidden = false;

      window.requestAnimationFrame(() => {
        notice.classList.add(visibleClass);
      });

      hideTimer = window.setTimeout(() => {
        if (!isHovered) {
          hide(false);
        }
      }, visibleDuration);
    };

    const refresh = (delay = resumeDelay) => {
      clearTimers();

      if (hasSeenNotice()) {
        hide(false);
        return;
      }

      if (!isEligible()) {
        hide(false);
        return;
      }

      if (!isVisible) {
        scheduleNext(isReadyToShow ? 0 : remainingDelay || delay);
      }
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
        hideTimer = window.setTimeout(() => hide(false), hoverHideDelay);
      }
    });

    closeButton.addEventListener("click", () => {
      clearTimers();
      hide(false);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearTimers(true);
        hide(false);
        return;
      }

      refresh(resumeDelay);
    });

    if (!hasSeenNotice() && isEligible()) {
      scheduleNext(initialDelay);
    }

    return {
      clear: clearTimers,
      hide,
      refresh,
      show,
    };
  }

  function initPersistentNotice(config = {}) {
    const {
      noticeId,
      closeButtonId,
      visibleClass = "is-visible",
      isEligible = () => true,
      initialDelay = 1200,
      transitionDuration = 220,
      persistenceKey = "",
      cookieMaxAge = DEFAULT_PERSISTENCE_MAX_AGE,
    } = config;

    const notice = document.getElementById(noticeId);
    const closeButton = document.getElementById(closeButtonId);

    if (!notice || !closeButton) {
      return null;
    }

    let showTimer = null;
    let isVisible = false;

    const clearTimer = () => {
      if (showTimer) {
        window.clearTimeout(showTimer);
        showTimer = null;
      }
    };

    const hasDismissedNotice = () => hasPersistentFlag(persistenceKey);

    const show = () => {
      clearTimer();

      if (isVisible || document.hidden || !isEligible() || hasDismissedNotice()) {
        return;
      }

      isVisible = true;
      notice.hidden = false;

      window.requestAnimationFrame(() => {
        notice.classList.add(visibleClass);
      });
    };

    const hide = (persist = false) => {
      clearTimer();

      if (persist) {
        writePersistentFlag(persistenceKey, "1", cookieMaxAge);
      }

      if (!isVisible) {
        notice.hidden = true;
        return;
      }

      isVisible = false;
      notice.classList.remove(visibleClass);

      window.setTimeout(() => {
        if (!isVisible) {
          notice.hidden = true;
        }
      }, transitionDuration);
    };

    const refresh = (delay = initialDelay) => {
      clearTimer();

      if (hasDismissedNotice() || !isEligible()) {
        hide(false);
        return;
      }

      if (isVisible || document.hidden) {
        return;
      }

      showTimer = window.setTimeout(show, Math.max(0, delay));
    };

    closeButton.addEventListener("click", () => {
      hide(true);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearTimer();
        return;
      }

      refresh(0);
    });

    refresh(initialDelay);

    return {
      hide,
      refresh,
      show,
    };
  }

  window.MosionSite = Object.freeze({
    initModal,
    initPersistentNotice,
    initReveal,
    initTimedNotice,
    isIosDevice,
    isValidEmail,
    ready,
    scrollToHash,
    submitWaitlistSignup,
  });
})(window, document);
