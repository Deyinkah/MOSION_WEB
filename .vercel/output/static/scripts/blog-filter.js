(function () {
  "use strict";

  var categoryBtns = document.querySelectorAll(".blog-filter-btn[data-category]");
  var featured = document.querySelector(".blog-featured-article[data-category]");
  var cards = document.querySelectorAll(".blog-post-card[data-category]");

  if (!categoryBtns.length) return;

  function filterPosts(category) {
    categoryBtns.forEach(function (btn) {
      var isActive = btn.getAttribute("data-category") === category;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (featured) {
      var featuredMatch = category === "All" || featured.getAttribute("data-category") === category;
      featured.hidden = !featuredMatch;
    }

    cards.forEach(function (card) {
      var match = category === "All" || card.getAttribute("data-category") === category;
      card.hidden = !match;
    });
  }

  categoryBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterPosts(btn.getAttribute("data-category") || "All");
    });
  });
})();
