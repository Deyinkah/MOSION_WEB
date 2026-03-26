function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function submitWaitlistSignup(payload) {
  const response = await fetch("/api/waitlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "We could not complete your waitlist signup.");
  }

  return result;
}

function isIosDevice() {
  const platform = window.navigator.platform || "";
  const userAgent = window.navigator.userAgent || "";
  const isAppleMobile = /iPad|iPhone|iPod/i.test(userAgent);
  const isIpadDesktopMode =
    platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return isAppleMobile || isIpadDesktopMode;
}

function initCursor() {
  const cur = document.getElementById("cur");
  const curR = document.getElementById("curR");

  if (!cur || !curR) {
    return;
  }

  let mx = -100;
  let my = -100;
  let rx = -100;
  let ry = -100;

  const updatePointer = (event) => {
    mx = event.clientX;
    my = event.clientY;
  };

  document.addEventListener("pointermove", updatePointer, { passive: true });
  document.addEventListener("mousemove", updatePointer, { passive: true });

  const grow = () => {
    cur.style.width = "6px";
    cur.style.height = "6px";
    curR.style.width = "52px";
    curR.style.height = "52px";
  };

  const reset = () => {
    cur.style.width = "10px";
    cur.style.height = "10px";
    curR.style.width = "36px";
    curR.style.height = "36px";
  };

  document.querySelectorAll("a,button,input,select").forEach((element) => {
    element.addEventListener("mouseenter", grow);
    element.addEventListener("mouseleave", reset);
  });

  const loop = () => {
    cur.style.left = `${mx}px`;
    cur.style.top = `${my}px`;
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    curR.style.left = `${rx}px`;
    curR.style.top = `${ry}px`;
    requestAnimationFrame(loop);
  };

  loop();
}

function initReveal() {
  const targets = document.querySelectorAll(".r");

  if (!targets.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("v"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("v");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1 }
  );

  targets.forEach((target) => observer.observe(target));
}

// Nav and coming-soon modal are handled by layout.js

function initWaitlist() {
  const form = document.getElementById("wlForm");
  const input = document.getElementById("wlEmail");
  const submit = document.getElementById("wlSubmit");
  const note = document.getElementById("wlNote");
  const success = document.getElementById("wlSuccess");
  const successCopy = document.getElementById("wlSuccessCopy");

  if (!form || !input || !submit || !note || !success || !successCopy) {
    return;
  }

  const defaultNote = note.textContent;
  const defaultLabel = submit.innerHTML;
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
    if (errorTimer) {
      window.clearTimeout(errorTimer);
    }

    input.classList.add("is-error");
    note.classList.add("is-error");
    note.textContent = message;

    errorTimer = window.setTimeout(() => {
      clearErrorState();
    }, 3200);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrorState();

    const email = input.value.trim().toLowerCase();

    if (!isValidEmail(email)) {
      showError("Enter a valid email address.");
      input.focus();
      return;
    }

    submit.disabled = true;
    submit.innerHTML = "Joining...";

    try {
      const result = await submitWaitlistSignup({
        email,
        source: "website",
      });

      form.style.display = "none";
      success.classList.add("show");

      if (result.confirmationSent === false) {
        successCopy.textContent =
          "You're on the waitlist. We could not send the confirmation email yet, but your signup was saved.";
      }
    } catch (error) {
      showError(error.message || "We could not complete your waitlist signup.");
      input.focus();
    } finally {
      submit.disabled = false;
      submit.innerHTML = defaultLabel;
    }
  });
}

function initHomePage() {
  initCursor();
  initReveal();
  initWaitlist();
}

window.addEventListener("DOMContentLoaded", initHomePage);
