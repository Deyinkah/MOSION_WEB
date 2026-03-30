(function bootstrapSiteCore(window, document) {
  "use strict";

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const IOS_DEVICE_PATTERN = /iPad|iPhone|iPod/i;
  const DEFAULT_WAITLIST_ERROR = "We could not complete your waitlist signup.";
  const DEFAULT_INTERACTIVE_SELECTOR = "a,button,input,select";

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

  function initCursor(config = {}) {
    const {
      cursorId,
      ringId,
      interactiveSelector = DEFAULT_INTERACTIVE_SELECTOR,
      defaultCursorSize = 10,
      defaultRingSize = 36,
      activeCursorSize = 6,
      activeRingSize = 52,
      easing = 0.12,
    } = config;

    const cursor = document.getElementById(cursorId);
    const ring = document.getElementById(ringId);

    if (!cursor || !ring) {
      return null;
    }

    let pointerX = -100;
    let pointerY = -100;
    let ringX = -100;
    let ringY = -100;
    let animationFrameId = null;

    const setSizes = (cursorSize, ringSize) => {
      cursor.style.width = `${cursorSize}px`;
      cursor.style.height = `${cursorSize}px`;
      ring.style.width = `${ringSize}px`;
      ring.style.height = `${ringSize}px`;
    };

    const updatePointer = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const grow = () => {
      setSizes(activeCursorSize, activeRingSize);
    };

    const reset = () => {
      setSizes(defaultCursorSize, defaultRingSize);
    };

    const interactiveElements = Array.from(
      document.querySelectorAll(interactiveSelector)
    );

    document.addEventListener("pointermove", updatePointer, { passive: true });
    document.addEventListener("mousemove", updatePointer, { passive: true });

    interactiveElements.forEach((element) => {
      element.addEventListener("mouseenter", grow);
      element.addEventListener("mouseleave", reset);
    });

    const animate = () => {
      cursor.style.left = `${pointerX}px`;
      cursor.style.top = `${pointerY}px`;
      ringX += (pointerX - ringX) * easing;
      ringY += (pointerY - ringY) * easing;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      animationFrameId = window.requestAnimationFrame(animate);
    };

    reset();
    animate();

    return {
      destroy() {
        if (animationFrameId) {
          window.cancelAnimationFrame(animationFrameId);
        }

        document.removeEventListener("pointermove", updatePointer);
        document.removeEventListener("mousemove", updatePointer);

        interactiveElements.forEach((element) => {
          element.removeEventListener("mouseenter", grow);
          element.removeEventListener("mouseleave", reset);
        });
      },
    };
  }

  function initReveal(config = {}) {
    const {
      selector,
      visibleClass,
      threshold = 0.1,
    } = config;

    const elements = Array.from(document.querySelectorAll(selector));

    if (!elements.length) {
      return null;
    }

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add(visibleClass));
      return null;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add(visibleClass);
          observer.unobserve(entry.target);
        });
      },
      { threshold }
    );

    elements.forEach((element) => observer.observe(element));
    return observer;
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
      minDelay = 21000,
      maxDelay = 31000,
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

    const nextDelay = () =>
      minDelay + Math.floor(Math.random() * (maxDelay - minDelay + 1));

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
      if (document.hidden || !isEligible()) {
        return;
      }

      cycleTimer = window.setTimeout(show, delay);
    };

    const hide = (shouldReschedule = true) => {
      if (!isVisible) {
        if (shouldReschedule && isEligible()) {
          scheduleNext();
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

      if (shouldReschedule && isEligible()) {
        scheduleNext();
      }
    };

    const show = () => {
      clearTimers();

      if (document.hidden || shouldPause() || !isEligible()) {
        if (isEligible()) {
          scheduleNext(retryDelay);
        }
        return;
      }

      isVisible = true;
      notice.hidden = false;

      window.requestAnimationFrame(() => {
        notice.classList.add(visibleClass);
      });

      hideTimer = window.setTimeout(() => {
        if (!isHovered) {
          hide(true);
        }
      }, visibleDuration);
    };

    const refresh = (delay = resumeDelay) => {
      clearTimers();

      if (!isEligible()) {
        hide(false);
        return;
      }

      if (!isVisible) {
        scheduleNext(delay);
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
        hideTimer = window.setTimeout(() => hide(true), hoverHideDelay);
      }
    });

    closeButton.addEventListener("click", () => {
      clearTimers();
      hide(true);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearTimers();
        hide(false);
        return;
      }

      refresh(resumeDelay);
    });

    if (isEligible()) {
      scheduleNext(initialDelay);
    }

    return {
      clear: clearTimers,
      hide,
      refresh,
      show,
    };
  }

  window.MosionSite = Object.freeze({
    initCursor,
    initModal,
    initReveal,
    initTimedNotice,
    isIosDevice,
    isValidEmail,
    ready,
    scrollToHash,
    submitWaitlistSignup,
  });
})(window, document);
