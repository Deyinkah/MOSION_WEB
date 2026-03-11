"use strict";

const bannerFiles = [
  "banner-01.jpeg",
  "banner-02.jpeg",
  "banner-03.jpeg",
  "banner-04.jpeg",
  "banner-05.jpeg",
  "banner-06.jpeg",
  "banner-07.jpeg",
  "banner-08.jpeg",
  "banner-09.jpeg",
  "banner-10.jpeg",
  "banner-11.jpeg",
  "banner-12.jpeg",
  "banner-13.jpeg",
  "banner-14.jpeg",
  "banner-15.jpeg",
  "banner-16.jpeg",
  "banner-17.jpeg",
  "banner-18.jpeg",
  "banner-19.jpeg",
  "banner-20.jpeg",
  "banner-21.jpeg",
  "banner-22.jpeg",
  "banner-23.jpeg",
  "banner-24.jpeg",
  "banner-25.jpeg",
  "banner-26.jpeg",
  "banner-27.jpeg",
  "banner-28.jpeg",
  "banner-29.jpeg",
  "banner-30.jpeg",
  "banner-31.jpeg",
  "banner-32.jpeg"
];

const basePath = "./assets/img/";
const apkDownloadUrl = document.body?.dataset?.apkUrl || "./mosion.apk";

function getEventElementTarget(event) {
  if (event.target instanceof Element) {
    return event.target;
  }

  if (event.target && event.target.parentElement instanceof Element) {
    return event.target.parentElement;
  }

  return null;
}

function getBannerRows() {
  return Array.from(document.querySelectorAll(".movie-row[data-banner-row]"));
}

function distributeBanners(rowCount) {
  if (!rowCount) {
    return [];
  }

  const rows = Array.from({ length: rowCount }, () => []);
  bannerFiles.forEach((fileName, index) => {
    rows[index % rowCount].push({
      fileName,
      bannerNumber: index + 1
    });
  });
  return rows;
}

function createBannerPicture(banner, decorative) {
  const baseName = banner.fileName.replace(/\.[^.]+$/, "");
  const encodedBaseSrc = `${basePath}${encodeURIComponent(baseName)}`;
  const encodedJpegSrc = `${basePath}${encodeURIComponent(banner.fileName)}`;

  const picture = document.createElement("picture");

  const avifSource = document.createElement("source");
  avifSource.srcset = `${encodedBaseSrc}.avif`;
  avifSource.type = "image/avif";
  picture.appendChild(avifSource);

  const webpSource = document.createElement("source");
  webpSource.srcset = `${encodedBaseSrc}.webp`;
  webpSource.type = "image/webp";
  picture.appendChild(webpSource);

  const image = document.createElement("img");
  image.src = encodedJpegSrc;
  image.alt = decorative ? "" : `Movie banner ${banner.bannerNumber}`;
  image.loading = "lazy";
  image.decoding = "async";
  image.draggable = false;
  picture.appendChild(image);

  return picture;
}

function renderRows() {
  const rowElements = getBannerRows();
  const distributedRows = distributeBanners(rowElements.length);

  rowElements.forEach((rowElement, index) => {
    rowElement.innerHTML = "";
    const rowBanners = distributedRows[index] || [];
    if (!rowBanners.length) {
      return;
    }

    const duplicated = [...rowBanners, ...rowBanners];
    duplicated.forEach((banner, duplicateIndex) => {
      const figure = document.createElement("figure");
      figure.className = "banner-card";

      if (duplicateIndex >= rowBanners.length) {
        figure.setAttribute("aria-hidden", "true");
      }

      figure.appendChild(createBannerPicture(banner, duplicateIndex >= rowBanners.length));
      rowElement.appendChild(figure);
    });
  });
}

function disableImageContextActions() {
  const onContextMenu = (event) => {
    const target = getEventElementTarget(event);
    if (target && target.closest("img")) {
      event.preventDefault();
    }
  };

  const onDragStart = (event) => {
    const target = getEventElementTarget(event);
    if (target && target.closest("img")) {
      event.preventDefault();
    }
  };

  document.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("dragstart", onDragStart);
}

function enableAutoScroll() {
  const rowElements = getBannerRows();
  if (!rowElements.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  rowElements.forEach((rowElement, index) => {
    if (!rowElement.children.length) {
      return;
    }

    const direction = index % 2 === 0 ? 1 : -1;
    let pauseUntil = 0;
    let lastFrameTime = performance.now();
    let position = 0;
    let singleTrackWidth = 0;
    let startAttempts = 0;

    const pauseAuto = () => {
      pauseUntil = performance.now() + 2200;
    };

    const measureTrack = () => {
      singleTrackWidth = rowElement.scrollWidth / 2;
      return singleTrackWidth > 0;
    };

    const normalizePosition = () => {
      if (!singleTrackWidth) {
        return;
      }

      if (position >= singleTrackWidth) {
        position -= singleTrackWidth;
      } else if (position < 0) {
        position += singleTrackWidth;
      }
    };

    const tick = (now) => {
      if (now >= pauseUntil) {
        if (!measureTrack()) {
          requestAnimationFrame(tick);
          return;
        }

        const deltaSeconds = (now - lastFrameTime) / 1000;
        position += direction * 64 * deltaSeconds;
        normalizePosition();
        rowElement.scrollLeft = position;
      }

      lastFrameTime = now;
      requestAnimationFrame(tick);
    };

    const start = () => {
      if (!measureTrack()) {
        startAttempts += 1;
        if (startAttempts <= 60) {
          requestAnimationFrame(start);
        }
        return;
      }

      position = direction < 0 ? singleTrackWidth : 0;
      rowElement.scrollLeft = position;
      lastFrameTime = performance.now();

      rowElement.addEventListener("wheel", pauseAuto, { passive: true });
      rowElement.addEventListener("touchstart", pauseAuto, { passive: true });
      rowElement.addEventListener("pointerdown", pauseAuto, { passive: true });
      rowElement.addEventListener("focusin", pauseAuto);

      requestAnimationFrame(tick);
    };

    const onResize = () => {
      const previousTrackWidth = singleTrackWidth;
      if (!measureTrack()) {
        return;
      }

      if (previousTrackWidth > 0 && previousTrackWidth !== singleTrackWidth) {
        position = (position / previousTrackWidth) * singleTrackWidth;
        normalizePosition();
        rowElement.scrollLeft = position;
      }
    };

    window.addEventListener("resize", onResize);
    requestAnimationFrame(start);
  });
}

function applyApkLinks() {
  document.querySelectorAll("[data-apk-link]").forEach((link) => {
    link.setAttribute("href", apkDownloadUrl);
  });
}

function initSiteMenu() {
  const menuRoots = Array.from(document.querySelectorAll("[data-site-menu]"));
  if (!menuRoots.length) {
    return;
  }

  menuRoots.forEach((menuRoot) => {
    const toggle = menuRoot.querySelector("[data-menu-toggle]");
    const panel = menuRoot.querySelector("[data-menu-panel]");

    if (!toggle || !panel) {
      return;
    }

    const closeMenu = () => {
      menuRoot.dataset.open = "false";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    };

    const openMenu = () => {
      menuRoot.dataset.open = "true";
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");
    };

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      if (toggle.getAttribute("aria-expanded") === "true") {
        closeMenu();
        return;
      }
      openMenu();
    });

    panel.addEventListener("click", (event) => {
      const target = getEventElementTarget(event);
      if (target && target.closest("a")) {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      const target = getEventElementTarget(event);
      if (!target || !menuRoot.contains(target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    window.addEventListener("resize", closeMenu);
    closeMenu();
  });
}

function init() {
  renderRows();
  disableImageContextActions();
  applyApkLinks();
  initSiteMenu();
  enableAutoScroll();
}

document.addEventListener("DOMContentLoaded", init);
