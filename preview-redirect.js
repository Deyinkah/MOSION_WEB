(function redirectPreviewPage(window, document) {
  "use strict";

  var currentScript = document.currentScript;
  var relativeTarget = currentScript
    ? currentScript.getAttribute("data-redirect-path")
    : "";

  if (!relativeTarget) {
    return;
  }

  var target = new URL(relativeTarget, window.location.href);
  target.search = window.location.search;
  target.hash = window.location.hash;
  window.location.replace(target.href);
})(window, document);
