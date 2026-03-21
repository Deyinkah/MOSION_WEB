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

function initCursor() {
  const cursor = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");

  if (!cursor || !ring) {
    return;
  }

  let mx = -100;
  let my = -100;
  let rx = -100;
  let ry = -100;

  document.addEventListener("mousemove", (event) => {
    mx = event.clientX;
    my = event.clientY;
  });

  function animateCursor() {
    cursor.style.left = `${mx}px`;
    cursor.style.top = `${my}px`;
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = `${rx}px`;
    ring.style.top = `${ry}px`;
    requestAnimationFrame(animateCursor);
  }

  animateCursor();

  document.querySelectorAll("a, button, input, select").forEach((element) => {
    element.addEventListener("mouseenter", () => {
      cursor.style.width = "6px";
      cursor.style.height = "6px";
      ring.style.width = "52px";
      ring.style.height = "52px";
    });
    element.addEventListener("mouseleave", () => {
      cursor.style.width = "10px";
      cursor.style.height = "10px";
      ring.style.width = "36px";
      ring.style.height = "36px";
    });
  });
}

function initReveal() {
  const reveals = document.querySelectorAll(".reveal");

  if (!reveals.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    reveals.forEach((element) => element.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach((element) => observer.observe(element));
}

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
      const target = href ? document.querySelector(href) : null;

      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const formContent = document.getElementById("studioWaitlistForm");
  const successState = document.getElementById("successState");
  const successSub = successState ? successState.querySelector(".success-sub") : null;
  const note = document.getElementById("studioFormNote");
  const submitButton = document.getElementById("studioSubmitButton");

  if (
    !form ||
    !firstNameInput ||
    !lastNameInput ||
    !emailInput ||
    !filmNameInput ||
    !originInput ||
    !formContent ||
    !successState ||
    !note ||
    !submitButton
  ) {
    return;
  }

  const defaultNote = "You'll be notified when filmmaker onboarding opens. No spam, ever.";
  const defaultButton = submitButton.innerHTML;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    note.textContent = defaultNote;
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

    if (!isValidEmail(email)) {
      invalidInputs.push(emailInput);
    }

    if (invalidInputs.length) {
      flashInvalidInputs(invalidInputs);
      return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = "Requesting...";

    try {
      const result = await submitWaitlistSignup({
        email,
        source: "studio",
        firstName,
        lastName,
        filmName,
        origin,
      });

      formContent.style.display = "none";
      successState.classList.add("show");

      if (result.confirmationSent === false && successSub) {
        successSub.textContent =
          "Your access request is saved. We could not send the confirmation email yet, but your details are on the list.";
      }
    } catch (error) {
      note.textContent = error.message || "We could not complete your waitlist signup.";
      note.style.color = "#e03e3e";
      flashInvalidInputs([emailInput]);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = defaultButton;
    }
  });
}

function initStudioPage() {
  initCursor();
  initNav();
  initReveal();
  initWaitlistForm();
}

window.addEventListener("DOMContentLoaded", initStudioPage);
