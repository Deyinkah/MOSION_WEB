"use client";

import { useEffect, useMemo, useRef } from "react";

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

const basePath = "/assets/img/";

export default function HomePage() {
  const rowRefs = useRef([]);

  const allRows = useMemo(() => {
    const primaryRows = [[], []];
    bannerFiles.forEach((fileName, index) => {
      primaryRows[index % 2].push({
        fileName,
        bannerNumber: index + 1
      });
    });

    return [primaryRows[0], primaryRows[1], primaryRows[0], primaryRows[1]];
  }, []);

  useEffect(() => {
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

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const cleanups = [];

    rowRefs.current.forEach((row, index) => {
      if (!row) {
        return;
      }

      row.style.scrollSnapType = "none";
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
        singleTrackWidth = row.scrollWidth / 2;
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

          row.scrollLeft = position;
        }

        lastFrameTime = now;
        rafId = requestAnimationFrame(tick);
      };

      const start = () => {
        if (!measureTrack()) {
          startAttempts += 1;
          if (startAttempts <= 30) {
            rafId = requestAnimationFrame(start);
          }
          return;
        }

        position = direction < 0 ? singleTrackWidth : 0;
        row.scrollLeft = position;
        lastFrameTime = performance.now();

        row.addEventListener("wheel", pauseAuto, { passive: true });
        row.addEventListener("touchstart", pauseAuto, { passive: true });
        row.addEventListener("pointerdown", pauseAuto, { passive: true });

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
          row.scrollLeft = position;
        }
      };

      window.addEventListener("resize", onResize);

      rafId = requestAnimationFrame(start);

      cleanups.push(() => {
        cancelAnimationFrame(rafId);
        row.removeEventListener("wheel", pauseAuto);
        row.removeEventListener("touchstart", pauseAuto);
        row.removeEventListener("pointerdown", pauseAuto);
        window.removeEventListener("resize", onResize);
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [allRows]);

  const handleApkDownload = async (event) => {
    event.preventDefault();

    const source = event.currentTarget.getAttribute("href") || "/mosion.apk";
    const fileName = event.currentTarget.getAttribute("download") || "Mosion.apk";

    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`APK not found at ${source}`);
      }

      const apkBlob = await response.blob();
      const objectUrl = URL.createObjectURL(apkBlob);
      const tempLink = document.createElement("a");
      tempLink.href = objectUrl;
      tempLink.download = fileName;
      document.body.appendChild(tempLink);
      tempLink.click();
      tempLink.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
      alert("APK file is not available yet. Add mosition.apk to the project root.");
    }
  };

  const renderBannerImage = (banner, decorative = false) => {
    const baseName = banner.fileName.replace(/\.[^.]+$/, "");
    const encodedBaseSrc = `${basePath}${encodeURIComponent(baseName)}`;
    const encodedJpegSrc = `${basePath}${encodeURIComponent(banner.fileName)}`;

    return (
      <picture>
        <source srcSet={`${encodedBaseSrc}.avif`} type="image/avif" />
        <source srcSet={`${encodedBaseSrc}.webp`} type="image/webp" />
        <img
          src={encodedJpegSrc}
          alt={decorative ? "" : `Movie banner ${banner.bannerNumber}`}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </picture>
    );
  };

  return (
    <>
      <div className="logo-overlay" aria-label="Mosion logo">
        <div className="logo-container">
          <img className="logo-image" src="/logo.png" alt="Mosion logo" draggable={false} />
          <h2 className="logo-caption">
            Watch cinema movies
            <br />
            anywhere from the
            <br />
            comfort of your
            <br />
            home.
          </h2>
        </div>
      </div>

      <main className="page">
        <section className="movie-grid" aria-label="Movie banners">
          <div className="banner-overlay-box" aria-hidden="true"></div>
          {rowMeta.slice(0, 2).map((row, rowIndex) => (
            <div
              key={row.id}
              className="movie-row"
              id={row.id}
              aria-label={row.label}
              ref={(el) => {
                rowRefs.current[rowIndex] = el;
              }}
            >
              {allRows[rowIndex].map((banner) => (
                <figure className="banner-card" key={`${row.id}-${banner.fileName}`}>
                  {renderBannerImage(banner)}
                </figure>
              ))}
              {allRows[rowIndex].map((banner, duplicateIndex) => (
                <figure
                  className="banner-card"
                  key={`${row.id}-${banner.fileName}-copy-${duplicateIndex}`}
                  aria-hidden="true"
                >
                  {renderBannerImage(banner, true)}
                </figure>
              ))}
            </div>
          ))}
        </section>
      </main>

      <section className="extra-movie-section" aria-label="More movie banners">
        <div className="extra-movie-grid">
          {rowMeta.slice(2).map((row, metaIndex) => {
            const rowIndex = metaIndex + 2;
            return (
              <div
                key={row.id}
                className="movie-row"
                id={row.id}
                aria-label={row.label}
                ref={(el) => {
                  rowRefs.current[rowIndex] = el;
                }}
              >
                {allRows[rowIndex].map((banner) => (
                  <figure className="banner-card" key={`${row.id}-${banner.fileName}`}>
                    {renderBannerImage(banner)}
                  </figure>
                ))}
                {allRows[rowIndex].map((banner, duplicateIndex) => (
                  <figure
                    className="banner-card"
                    key={`${row.id}-${banner.fileName}-copy-${duplicateIndex}`}
                    aria-hidden="true"
                  >
                    {renderBannerImage(banner, true)}
                  </figure>
                ))}
              </div>
            );
          })}
        </div>

        <section className="download-section" aria-label="Download apps">
          <div className="download-inner">
            <p className="download-kicker">
              <span className="download-kicker-text">
                <span>Stay in motion</span>
                <span>with</span>
              </span>
              <img
                className="download-kicker-logo"
                src="/mosion.png"
                alt="Mosion"
                draggable={false}
              />
            </p>
            <div className="store-badges">
              <a className="store-link" href="#" aria-label="Download on the App Store">
                <img
                  src="/appstore-badge.svg"
                  alt="Download on the App Store"
                  draggable={false}
                />
              </a>
              <a className="store-link" href="#" aria-label="Get it on Google Play">
                <img src="/playstore-badge.svg" alt="Get it on Google Play" draggable={false} />
              </a>
            </div>
            <a
              className="apk-button"
              href="/mosion.apk"
              download="Mosion.apk"
              aria-label="Download APK"
              onClick={handleApkDownload}
            >
              Download APK
            </a>
          </div>
        </section>
      </section>

      <p className="copyright-text">&copy; 2026 Mosion. All rights reserved.</p>
    </>
  );
}
