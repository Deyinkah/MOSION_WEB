"use strict";

const bannerFiles = [
  "WhatsApp Image 2026-03-05 at 2.30.54 PM.jpeg",
  "WhatsApp Image 2026-03-05 at 2.30.54 PM (1).jpeg",
  "WhatsApp Image 2026-03-05 at 2.30.53 PM.jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.49 PM.jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.49 PM (3).jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.49 PM (2).jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.49 PM (1).jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.48 PM.jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.48 PM (2).jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.48 PM (1).jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.47 PM.jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.47 PM (2).jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.47 PM (1).jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.46 PM.jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.46 PM (4).jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.46 PM (3).jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.46 PM (2).jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.46 PM (1).jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.45 PM.jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.44 PM.jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.43 PM.jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.43 PM (1).jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.42 PM.jpeg",
  "WhatsApp Image 2026-03-05 at 2.27.39 PM.jpeg",
  "WhatsApp Image 2026-02-28 at 1.33.06 AM.jpeg",
  "WhatsApp Image 2026-02-28 at 1.33.06 AM (1).jpeg",
  "WhatsApp Image 2026-02-28 at 1.33.05 AM.jpeg",
  "WhatsApp Image 2026-02-28 at 1.33.04 AM.jpeg",
  "WhatsApp Image 2026-02-26 at 11.51.36 PM.jpeg",
  "WhatsApp Image 2026-02-26 at 11.51.32 PM.jpeg",
  "WhatsApp Image 2026-02-26 at 11.51.31 PM.jpeg",
  "WhatsApp Image 2026-02-26 at 11.51.29 PM.jpeg"
];

const rowDirections = [1, -1, 1, -1];
const rowMeta = [
  { id: "row-1", label: "Movie row 1" },
  { id: "row-2", label: "Movie row 2" },
  { id: "row-4", label: "Movie row 4" },
  { id: "row-5", label: "Movie row 5" }
];

const basePath = "/public/assets/img/";
const apkDownloadUrl = document.body?.dataset?.apkUrl || "/mosion.apk";

const distributedRows = [[], [], [], []];
bannerFiles.forEach((fileName, index) => {
  distributedRows[index % 4].push({
    fileName,
    bannerNumber: index + 1
  });
});

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
  rowMeta.forEach((row, index) => {
    const rowElement = document.getElementById(row.id);
    if (!rowElement) {
      return;
    }

    rowElement.innerHTML = "";
    const rowBanners = distributedRows[index] || [];
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
    if (event.target.closest("img")) {
      event.preventDefault();
    }
  };

  const onDragStart = (event) => {
    if (event.target.closest("img")) {
      event.preventDefault();
    }
  };

  document.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("dragstart", onDragStart);
}

function enableAutoScroll() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  rowMeta.forEach((row, index) => {
    const rowElement = document.getElementById(row.id);
    if (!rowElement) {
      return;
    }

    rowElement.style.scrollSnapType = "none";
    const direction = rowDirections[index] ?? 1;
    let rafId = 0;
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
          rafId = requestAnimationFrame(tick);
          return;
        }

        const dt = (now - lastFrameTime) / 1000;
        position += direction * 72 * dt;
        normalizePosition();
        rowElement.scrollLeft = position;
      }

      lastFrameTime = now;
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!measureTrack()) {
        startAttempts += 1;
        if (startAttempts <= 60) {
          rafId = requestAnimationFrame(start);
        }
        return;
      }

      position = direction < 0 ? singleTrackWidth : 0;
      rowElement.scrollLeft = position;
      lastFrameTime = performance.now();

      rowElement.addEventListener("wheel", pauseAuto, { passive: true });
      rowElement.addEventListener("touchstart", pauseAuto, { passive: true });
      rowElement.addEventListener("pointerdown", pauseAuto, { passive: true });

      rafId = requestAnimationFrame(tick);
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
    rafId = requestAnimationFrame(start);
  });
}

function applyApkLink() {
  const apkButton = document.getElementById("apk-download");
  if (!apkButton) {
    return;
  }
  apkButton.setAttribute("href", apkDownloadUrl);
}

function init() {
  renderRows();
  disableImageContextActions();
  applyApkLink();
  enableAutoScroll();
}

document.addEventListener("DOMContentLoaded", init);
