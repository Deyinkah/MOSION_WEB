(function initBlogPage(window, document, Site, BlogData) {
  "use strict";

  if (!Site || !BlogData || typeof BlogData.load !== "function") {
    return;
  }

  const WAITLIST_ERROR = "We could not complete your waitlist signup.";
  const EMAIL_ERROR = "Enter a valid email address.";
  const JOINING_LABEL = "Joining...";
  const DEFAULT_VISIBLE_POSTS = 4;

  const state = {
    activeCategory: "All",
    visiblePosts: DEFAULT_VISIBLE_POSTS,
  };

  function normalizePathname(pathname) {
    return String(pathname || "").replace(/\/+$/, "") || "/";
  }

  function getRuntimePathname() {
    return normalizePathname(window.location.pathname);
  }

  function getPublicBasePath(pathname) {
    const normalized = normalizePathname(pathname);

    if (normalized === "/public" || normalized.startsWith("/public/")) {
      return "/public";
    }

    return "";
  }

  function shouldUseQueryRouting(pathname) {
    const normalized = normalizePathname(pathname);
    return (
      getPublicBasePath(normalized) === "/public" ||
      normalized.endsWith(".html")
    );
  }

  function isBlogIndexPath(pathname) {
    return (
      pathname === "/blog" ||
      pathname === "/blog.html" ||
      pathname === "/public/blog" ||
      pathname === "/public/blog.html"
    );
  }

  function getSlugFromPath(pathname) {
    const match = pathname.match(/^\/(?:public\/)?blog\/([^/]+)$/);

    if (!match) {
      return null;
    }

    return decodeURIComponent(match[1]);
  }

  function getSlugFromSearch(search) {
    const params = new URLSearchParams(search || "");
    const value = params.get("slug");
    return value ? value.trim() : "";
  }

  function getActiveSlug(pathname, search) {
    const querySlug = getSlugFromSearch(search);

    if (querySlug) {
      return querySlug;
    }

    if (isBlogIndexPath(pathname)) {
      return null;
    }

    return getSlugFromPath(pathname);
  }

  function escapeHtml(value) {
    const source = String(value || "");
    return source
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getBlogIndexUrl(pathname) {
    const normalized = normalizePathname(pathname);
    const basePath = getPublicBasePath(normalized);

    if (shouldUseQueryRouting(normalized)) {
      return `${basePath}/blog.html`;
    }

    return "/blog";
  }

  function getWaitlistUrl(pathname) {
    const basePath = getPublicBasePath(pathname);
    return `${basePath}/#download`;
  }

  function getBlogPostUrl(slug, pathname) {
    const normalized = normalizePathname(pathname);

    if (shouldUseQueryRouting(normalized)) {
      return `${getBlogIndexUrl(normalized)}?slug=${encodeURIComponent(slug)}`;
    }

    return `/blog/${encodeURIComponent(slug)}`;
  }

  function ArticleMeta(post, compact) {
    return `
      <div class="blog-article-meta${compact ? " is-compact" : ""}">
        <span>${escapeHtml(post.publishedAt)}</span>
        <span>${escapeHtml(post.readingTime)}</span>
        ${compact ? "" : `<span>${escapeHtml(post.author)}</span>`}
      </div>
    `;
  }

  function ShareRow(post) {
    return `
      <div class="blog-share-row" data-share-row data-share-title="${escapeHtml(post.title)}">
        <span>Share:</span>
        <button type="button" data-share-type="x" aria-label="Share on X">X</button>
        <button type="button" data-share-type="linkedin" aria-label="Share on LinkedIn">in</button>
        <button type="button" data-share-type="copy" aria-label="Copy link">↗</button>
      </div>
    `;
  }

  function BlogHero(pathname) {
    return `
      <section class="blog-index-hero">
        <div class="blog-index-hero__content">
          <p class="blog-eyebrow">The MOSION Blog</p>
          <h1>Stories Behind African Cinema</h1>
          <p>
            Insights, announcements, creator stories, and product updates from
            MOSION: the mobile-first way to watch African cinema premieres
            without subscriptions.
          </p>
        </div>
        <div class="blog-index-hero__visual" aria-hidden="true">
          <div class="blog-phone-mockup">
            <div class="blog-phone-mockup__topbar">MOSION</div>
            <div class="blog-phone-mockup__poster">PREMIERE</div>
            <a href="${getWaitlistUrl(pathname)}" class="blog-primary-button">Join Waitlist</a>
          </div>
        </div>
      </section>
    `;
  }

  function CategoryFilter(categories, activeCategory) {
    return `
      <div class="blog-category-filter" aria-label="Blog categories">
        ${categories
          .map((category) => {
            const isActive = category === activeCategory;
            return `
              <button
                type="button"
                class="${isActive ? "is-active" : ""}"
                data-blog-category="${escapeHtml(category)}"
              >
                ${escapeHtml(category)}
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function FeaturedPostCard(post, pathname) {
    if (!post) {
      return "";
    }

    return `
      <article class="blog-featured-post-card">
        <img src="${escapeHtml(post.image)}" alt="" loading="lazy" />
        <div class="blog-featured-post-card__content">
          <p class="blog-eyebrow">${escapeHtml(post.category)}</p>
          <h2>${escapeHtml(post.title)}</h2>
          <p>${escapeHtml(post.excerpt)}</p>
          <div class="blog-card-footer-row">
            ${ArticleMeta(post, true)}
            <a class="blog-text-link" href="${getBlogPostUrl(post.slug, pathname)}">Read More</a>
          </div>
        </div>
      </article>
    `;
  }

  function BlogPostRow(post, pathname) {
    return `
      <article class="blog-post-row">
        <img src="${escapeHtml(post.image)}" alt="" loading="lazy" />
        <div class="blog-post-row__content">
          <p class="blog-eyebrow">${escapeHtml(post.category)}</p>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.excerpt)}</p>
          <div class="blog-card-footer-row">
            ${ArticleMeta(post, true)}
            <a class="blog-text-link" href="${getBlogPostUrl(post.slug, pathname)}">Read More</a>
          </div>
        </div>
      </article>
    `;
  }

  function BlogPostCard(post, pathname) {
    return `
      <article class="blog-post-card">
        <img src="${escapeHtml(post.image)}" alt="" loading="lazy" />
        <div>
          <p class="blog-eyebrow">${escapeHtml(post.category)}</p>
          <h3>${escapeHtml(post.title)}</h3>
          ${ArticleMeta(post, true)}
          <a class="blog-text-link" href="${getBlogPostUrl(post.slug, pathname)}">Read More</a>
        </div>
      </article>
    `;
  }

  function BlogSidebar(posts, pathname) {
    const popularPosts = posts.slice(1, 4);

    return `
      <aside class="blog-sidebar">
        <div class="blog-sidebar-card blog-about-card">
          <h3>About MOSION</h3>
          <p>
            MOSION is a mobile-first cinema platform bringing African movie premieres
            to your pocket. No subscriptions. Pay for the film you want. Press play.
          </p>
        </div>

        <div class="blog-sidebar-card">
          <h3>Popular Posts</h3>
          <div class="blog-popular-posts-list">
            ${popularPosts
              .map(
                (post) => `
                  <a class="blog-popular-post-item" href="${getBlogPostUrl(post.slug, pathname)}">
                    <img src="${escapeHtml(post.image)}" alt="" loading="lazy" />
                    <div>
                      <h4>${escapeHtml(post.title)}</h4>
                      <span>${escapeHtml(post.publishedAt)}</span>
                    </div>
                  </a>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="blog-sidebar-card blog-dark-cta-card">
          <h3>
            Cinema,
            <br /> in your <span>pocket.</span>
          </h3>
          <p>Join the waitlist and be first to experience MOSION.</p>
          <form class="blog-newsletter-form" data-blog-waitlist-form data-source="blog_sidebar" novalidate>
            <input type="email" data-blog-email placeholder="Enter your email" aria-label="Email" required />
            <button type="submit" data-blog-submit>Join</button>
            <p class="blog-newsletter-note" data-blog-note>Get premiere updates and product news.</p>
          </form>
          <p class="blog-newsletter-success" data-blog-success hidden>You're on the list. Check your inbox.</p>
        </div>
      </aside>
    `;
  }

  function BlogContentRenderer(content, pathname) {
    return content
      .map((block) => {
        if (block.type === "paragraph") {
          return `<p>${escapeHtml(block.text)}</p>`;
        }

        if (block.type === "heading") {
          return `<h2>${escapeHtml(block.text)}</h2>`;
        }

        if (block.type === "list") {
          return `
            <ul class="blog-article-list">
              ${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          `;
        }

        if (block.type === "steps") {
          return `
            <div class="blog-article-steps-grid">
              ${block.items
                .map(
                  (step) => `
                    <div class="blog-article-step">
                      <span>${escapeHtml(step.icon)}</span>
                      <h3>${escapeHtml(step.title)}</h3>
                      <p>${escapeHtml(step.text)}</p>
                    </div>
                  `
                )
                .join("")}
            </div>
          `;
        }

        if (block.type === "quote") {
          return `
            <blockquote>
              <p>"${escapeHtml(block.text)}"</p>
              <cite>${escapeHtml(block.author)}</cite>
            </blockquote>
          `;
        }

        if (block.type === "cta") {
          const ctaLink =
            block.buttonLink === "/#download"
              ? getWaitlistUrl(pathname)
              : block.buttonLink;

          return `
            <div class="blog-article-cta">
              <div>
                <h3>${escapeHtml(block.title)}</h3>
                <p>${escapeHtml(block.text)}</p>
              </div>
              <a href="${escapeHtml(ctaLink)}" class="blog-primary-button">
                ${escapeHtml(block.buttonText)}
              </a>
            </div>
          `;
        }

        return "";
      })
      .join("");
  }

  function createFallbackContent(post) {
    return [
      {
        type: "paragraph",
        text: post.excerpt,
      },
      {
        type: "heading",
        text: "Why this story matters",
      },
      {
        type: "paragraph",
        text: "Mosion exists to bring African cinema closer to audiences. Every story on the blog should help viewers, creators, and partners understand the films, people, and product decisions shaping the platform.",
      },
      {
        type: "cta",
        title: "Ready to watch African cinema on your phone?",
        text: "Join the MOSION waitlist and get early access to the beta app.",
        buttonText: "Join the Waitlist",
        buttonLink: "/#download",
      },
    ];
  }

  function BlogIndexPage(data, pathname) {
    const {
      categories,
      posts,
      featuredPost,
      rowPosts,
      activeCategory,
      hasMoreRows,
    } = data;

    return `
      ${BlogHero(pathname)}
      <section class="blog-main-content">
        ${CategoryFilter(categories, activeCategory)}
        <div class="blog-layout-grid">
          <section class="blog-posts-column">
            ${featuredPost ? FeaturedPostCard(featuredPost, pathname) : ""}
            ${
              rowPosts.length
                ? `
                  <div class="blog-list-stack">
                    ${rowPosts.map((post) => BlogPostRow(post, pathname)).join("")}
                  </div>
                `
                : `
                  <div class="blog-empty-state">
                    <h2>No posts in this category yet.</h2>
                    <p>Try another category or check back soon for new stories.</p>
                  </div>
                `
            }
            ${
              hasMoreRows
                ? `
                  <div class="blog-load-more-wrap">
                    <button type="button" class="blog-outline-button" data-blog-load-more>
                      Load More Posts
                    </button>
                  </div>
                `
                : ""
            }
          </section>
          ${BlogSidebar(posts, pathname)}
        </div>
      </section>
    `;
  }

  function RelatedPosts(posts, pathname) {
    return `
      <section class="blog-related-posts-section">
        <div class="blog-section-heading-row">
          <div>
            <h2>More on the Blog</h2>
            <p>Explore more stories, updates, and insights.</p>
          </div>
          <a class="blog-text-link" href="${getBlogIndexUrl(pathname)}">View All Posts</a>
        </div>
        <div class="blog-related-posts-grid">
          ${posts.map((post) => BlogPostCard(post, pathname)).join("")}
        </div>
      </section>
    `;
  }

  function BlogArticlePage(post, relatedPosts, pathname) {
    const content = post.content || createFallbackContent(post);

    return `
      <article class="blog-article-page">
        <section class="blog-article-hero">
          <div class="blog-article-hero__content">
            <a class="blog-breadcrumb-link" href="${getBlogIndexUrl(pathname)}">
              Home / Blog / ${escapeHtml(post.category)}
            </a>
            <p class="blog-eyebrow">${escapeHtml(post.category)}</p>
            <h1>${escapeHtml(post.title)}</h1>
            <p>${escapeHtml(post.excerpt)}</p>
            ${ArticleMeta(post, false)}
            ${ShareRow(post)}
          </div>
          <div class="blog-article-hero__image-wrap">
            <img src="${escapeHtml(post.image)}" alt="" class="blog-article-hero__image" />
          </div>
        </section>

        <section class="blog-article-body-wrap">
          <div class="blog-article-body">
            ${BlogContentRenderer(content, pathname)}
          </div>
        </section>

        ${RelatedPosts(relatedPosts, pathname)}
      </article>
    `;
  }

  function BlogNotFoundPage(slug, pathname) {
    return `
      <section class="blog-not-found">
        <p class="blog-eyebrow">Blog</p>
        <h1>Post not found</h1>
        <p>We could not find a post for "${escapeHtml(slug)}".</p>
        <a href="${getBlogIndexUrl(pathname)}" class="blog-primary-button">Back to Blog</a>
      </section>
    `;
  }

  function BlogLoadErrorPage(message, pathname) {
    return `
      <section class="blog-not-found">
        <p class="blog-eyebrow">Blog</p>
        <h1>Could not load blog data</h1>
        <p>${escapeHtml(message)}</p>
        <a href="${getBlogIndexUrl(pathname)}" class="blog-primary-button">Retry</a>
      </section>
    `;
  }

  function setPageMeta(title, description, canonicalPath) {
    document.title = title;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    const canonical = document.querySelector('link[rel="canonical"]');
    const absoluteUrl = `${window.location.origin}${canonicalPath}`;

    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", description);
    }

    if (ogTitle) {
      ogTitle.setAttribute("content", title);
    }

    if (ogDescription) {
      ogDescription.setAttribute("content", description);
    }

    if (ogUrl) {
      ogUrl.setAttribute("content", absoluteUrl);
    }

    if (twitterTitle) {
      twitterTitle.setAttribute("content", title);
    }

    if (twitterDescription) {
      twitterDescription.setAttribute("content", description);
    }

    if (canonical) {
      canonical.setAttribute("href", absoluteUrl);
    }
  }

  function initShareButtons(post) {
    const shareRow = document.querySelector("[data-share-row]");

    if (!shareRow || !post) {
      return;
    }

    const url = window.location.href;
    const title = post.title;

    shareRow.querySelectorAll("[data-share-type]").forEach((button) => {
      button.addEventListener("click", async () => {
        const type = button.getAttribute("data-share-type");

        if (type === "x") {
          const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
          window.open(xUrl, "_blank", "noopener,noreferrer");
          return;
        }

        if (type === "linkedin") {
          const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
          window.open(linkedInUrl, "_blank", "noopener,noreferrer");
          return;
        }

        try {
          await window.navigator.clipboard.writeText(url);
          button.textContent = "Copied";

          window.setTimeout(() => {
            button.textContent = "↗";
          }, 1400);
        } catch (error) {
          window.prompt("Copy this link:", url);
        }
      });
    });
  }

  function initWaitlistForms() {
    const forms = Array.from(document.querySelectorAll("[data-blog-waitlist-form]"));

    forms.forEach((form) => {
      if (form.getAttribute("data-wired") === "true") {
        return;
      }

      const input = form.querySelector("[data-blog-email]");
      const submit = form.querySelector("[data-blog-submit]");
      const note = form.querySelector("[data-blog-note]");
      const success = form.parentElement.querySelector("[data-blog-success]");
      const defaultNote = note ? note.textContent : "";
      const defaultLabel = submit ? submit.textContent : "";

      if (!input || !submit || !note || !success) {
        return;
      }

      form.setAttribute("data-wired", "true");

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = input.value.trim().toLowerCase();

        note.classList.remove("is-error");
        input.classList.remove("is-error");
        note.textContent = defaultNote;

        if (!Site.isValidEmail(email)) {
          input.classList.add("is-error");
          note.classList.add("is-error");
          note.textContent = EMAIL_ERROR;
          input.focus();
          return;
        }

        submit.disabled = true;
        submit.textContent = JOINING_LABEL;

        try {
          await Site.submitWaitlistSignup(
            {
              email,
              source: form.getAttribute("data-source") || "blog",
            },
            { fallbackError: WAITLIST_ERROR }
          );

          form.hidden = true;
          success.hidden = false;
        } catch (error) {
          input.classList.add("is-error");
          note.classList.add("is-error");
          note.textContent = error.message || WAITLIST_ERROR;
        } finally {
          submit.disabled = false;
          submit.textContent = defaultLabel;
        }
      });
    });
  }

  function getFilteredPosts(allPosts, activeCategory) {
    if (activeCategory === "All") {
      return allPosts;
    }

    return allPosts.filter((post) => post.category === activeCategory);
  }

  function getPostBySlug(posts, slug) {
    return posts.find((post) => post.slug === slug) || null;
  }

  function getRelatedPosts(posts, currentSlug, limit) {
    return posts
      .filter((post) => post.slug !== currentSlug)
      .slice(0, limit);
  }

  function renderBlogIndex(root, allPosts, categories, pathname) {
    const filteredPosts = getFilteredPosts(allPosts, state.activeCategory);
    const featuredPost =
      filteredPosts.find((post) => post.featured) || filteredPosts[0] || null;
    const visibleRowPosts = filteredPosts
      .filter((post) => !featuredPost || post.slug !== featuredPost.slug)
      .slice(0, state.visiblePosts);
    const totalRowPosts = filteredPosts.filter(
      (post) => !featuredPost || post.slug !== featuredPost.slug
    );
    const hasMoreRows = totalRowPosts.length > visibleRowPosts.length;

    root.innerHTML = BlogIndexPage(
      {
        categories,
        posts: allPosts,
        featuredPost,
        rowPosts: visibleRowPosts,
        activeCategory: state.activeCategory,
        hasMoreRows,
      },
      pathname
    );

    root.querySelectorAll("[data-blog-category]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextCategory = button.getAttribute("data-blog-category") || "All";

        if (nextCategory === state.activeCategory) {
          return;
        }

        state.activeCategory = nextCategory;
        state.visiblePosts = DEFAULT_VISIBLE_POSTS;
        renderBlogIndex(root, allPosts, categories, pathname);
      });
    });

    const loadMoreButton = root.querySelector("[data-blog-load-more]");

    if (loadMoreButton) {
      loadMoreButton.addEventListener("click", () => {
        state.visiblePosts += DEFAULT_VISIBLE_POSTS;
        renderBlogIndex(root, allPosts, categories, pathname);
      });
    }

    initWaitlistForms();
  }

  function renderBlogArticle(root, post, allPosts, pathname) {
    const relatedPosts = getRelatedPosts(allPosts, post.slug, 3);
    root.innerHTML = BlogArticlePage(post, relatedPosts, pathname);
    initShareButtons(post);
  }

  async function boot() {
    const root = document.getElementById("blogRoot");

    if (!root) {
      return;
    }

    const pathname = getRuntimePathname();
    const search = window.location.search || "";

    let payload;

    try {
      payload = await BlogData.load();
    } catch (error) {
      root.innerHTML = BlogLoadErrorPage(
        error && error.message ? error.message : "Try reloading the page.",
        pathname
      );
      return;
    }

    const allPosts = payload.blogPosts.slice();
    const categories = payload.categories.slice();
    const slug = getActiveSlug(pathname, search);

    if (slug) {
      const post = getPostBySlug(allPosts, slug);
      const slugCanonicalPath = shouldUseQueryRouting(pathname)
        ? `${getBlogIndexUrl(pathname)}?slug=${encodeURIComponent(slug)}`
        : pathname;

      if (!post && allPosts.length === 0) {
        setPageMeta(
          "MOSION Blog | Stories Behind African Cinema",
          "Insights, announcements, creator stories, and product updates from MOSION.",
          shouldUseQueryRouting(pathname) ? getBlogIndexUrl(pathname) : "/blog"
        );
        renderBlogIndex(root, allPosts, categories, pathname);
        return;
      }

      if (!post) {
        setPageMeta(
          "Post Not Found | MOSION Blog",
          "The blog post you are looking for could not be found.",
          slugCanonicalPath
        );
        root.innerHTML = BlogNotFoundPage(slug, pathname);
        return;
      }

      setPageMeta(`${post.title} | MOSION Blog`, post.excerpt, slugCanonicalPath);
      renderBlogArticle(root, post, allPosts, pathname);
      return;
    }

    setPageMeta(
      "MOSION Blog | Stories Behind African Cinema",
      "Insights, announcements, creator stories, and product updates from MOSION.",
      shouldUseQueryRouting(pathname) ? getBlogIndexUrl(pathname) : "/blog"
    );
    renderBlogIndex(root, allPosts, categories, pathname);
  }

  Site.ready(() => {
    boot().catch(() => {
      const root = document.getElementById("blogRoot");

      if (!root) {
        return;
      }

      root.innerHTML = BlogLoadErrorPage(
        "Unexpected error while loading blog content.",
        getRuntimePathname()
      );
    });
  });
})(window, document, window.MosionSite, window.MosionBlogData);
