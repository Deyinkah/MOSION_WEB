(function initAboutPage(window, document, Site) {
  "use strict";

  function boot() {
    Site.initReveal({
      selector: ".reveal",
      visibleClass: "visible",
      threshold: 0.08,
    });
  }

  if (!Site) {
    return;
  }

  Site.ready(boot);
})(window, document, window.MosionSite);
