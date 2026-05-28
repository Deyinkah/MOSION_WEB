(function initBlogData(window) {
  "use strict";

  const DATA_FILE_NAME = "blog-posts.json";
  const DEFAULT_CATEGORIES = [
    "All",
    "Product Updates",
    "Film Premieres",
    "Creator Stories",
    "African Cinema Insights",
    "How to Watch",
    "Community Updates",
  ];

  function normalizePathname(pathname) {
    return String(pathname || "").replace(/\/+$/, "") || "/";
  }

  function getPublicBasePath(pathname) {
    const normalized = normalizePathname(pathname);

    if (normalized === "/public" || normalized.startsWith("/public/")) {
      return "/public";
    }

    return "";
  }

  function getBlogDataUrl() {
    const basePath = getPublicBasePath(window.location.pathname);
    return `${basePath}/${DATA_FILE_NAME}`;
  }

  function getDefaultPayload() {
    return {
      blogPosts: [],
      categories: DEFAULT_CATEGORIES.slice(),
    };
  }

  function validatePayload(payload) {
    if (!payload || typeof payload !== "object") {
      return getDefaultPayload();
    }

    const blogPosts = Array.isArray(payload.blogPosts) ? payload.blogPosts : [];
    const categories = Array.isArray(payload.categories)
      ? payload.categories
      : DEFAULT_CATEGORIES.slice();

    return {
      blogPosts,
      categories,
    };
  }

  async function load() {
    try {
      const response = await fetch(getBlogDataUrl(), {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return getDefaultPayload();
      }

      const raw = await response.text();

      if (!raw.trim()) {
        return getDefaultPayload();
      }

      const payload = JSON.parse(raw);
      return validatePayload(payload);
    } catch (error) {
      return getDefaultPayload();
    }
  }

  window.MosionBlogData = Object.freeze({
    load,
  });
})(window);
