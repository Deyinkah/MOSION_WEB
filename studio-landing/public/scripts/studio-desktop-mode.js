(function initDesktopModeBridge(window, document) {
  "use strict";

  var nav = window.navigator;
  var ua = window.navigator.userAgent || "";
  var platform = nav.platform || "";
  var viewportWidth = Math.max(
    window.innerWidth || 0,
    document.documentElement.clientWidth || 0
  );
  var hasTouch =
    (nav.maxTouchPoints || 0) > 0 || "ontouchstart" in window;
  var desktopUaLike =
    /Macintosh|Windows NT|X11; Linux x86_64|CrOS/i.test(ua) &&
    !/iPhone|iPod|Mobile/i.test(ua);
  var isDesktopPlatform =
    /Win32|Win64|MacIntel|Linux x86_64|Linux i686|CrOS/i.test(platform) &&
    !(platform === "MacIntel" && hasTouch);
  var desktopModeLikely =
    !isDesktopPlatform && hasTouch && (desktopUaLike || viewportWidth >= 900);

  if (!desktopModeLikely) {
    return;
  }

  document.documentElement.classList.add("force-desktop-mode");

  var viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement("meta");
    viewport.setAttribute("name", "viewport");
    document.head.prepend(viewport);
  }

  viewport.setAttribute("content", "width=1366, initial-scale=1, viewport-fit=cover");
})(window, document);
