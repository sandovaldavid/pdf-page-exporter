// Runs in the isolated world of the document viewer tab. Exposes
// window.__dpuPageDetector so capture.js can find and order page elements.
//
// Google's viewer DOM uses auto-generated, unstable class names that rotate
// across deploys, so detection is a cascade of heuristics rather than a
// single selector. See docs/selectors.md for verification status — this
// cascade has NOT yet been validated against a live document.
(function () {
  const MIN_PAGE_DIMENSION = 100; // px — filters out icons/thumbnails, not real pages

  function naturalSize(el) {
    if (el.tagName === "CANVAS") {
      return { width: el.width, height: el.height };
    }
    return { width: el.naturalWidth || el.width, height: el.naturalHeight || el.height };
  }

  function isPlausiblePage(el) {
    const { width, height } = naturalSize(el);
    return width >= MIN_PAGE_DIMENSION && height >= MIN_PAGE_DIMENSION;
  }

  // Cascade of detection strategies, most to least reliable.
  const STRATEGIES = [
    {
      name: "blob-image",
      find: () => Array.from(document.querySelectorAll('img[src^="blob:"]')).filter(isPlausiblePage),
    },
    {
      name: "canvas",
      find: () => Array.from(document.querySelectorAll("canvas")).filter(isPlausiblePage),
    },
    {
      name: "legacy-class-fragment",
      // Google's Drive viewer has historically prefixed internal doc-viewer
      // nodes with "ndfHFb"; the rest of the class rotates per deploy, so we
      // match on a substring. Low confidence — last resort only.
      find: () =>
        Array.from(document.querySelectorAll('[class*="ndfHFb"]'))
          .map((el) => (el.tagName === "IMG" ? el : el.querySelector("img")))
          .filter(Boolean)
          .filter(isPlausiblePage),
    },
  ];

  function detectPageElements() {
    for (const strategy of STRATEGIES) {
      const found = strategy.find();
      if (found.length > 0) {
        return { elements: found, strategyUsed: strategy.name };
      }
    }
    return { elements: [], strategyUsed: null };
  }

  function findScrollContainer(pageElements) {
    if (pageElements.length === 0) return null;
    let node = pageElements[0];
    while (node && node !== document.body) {
      if (node.scrollHeight > node.clientHeight + 10) return node;
      node = node.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  function orderByPosition(pageElements, scrollContainer) {
    const containerTop = scrollContainer ? scrollContainer.scrollTop : 0;
    return pageElements
      .map((el) => ({ el, top: el.getBoundingClientRect().top + containerTop }))
      .sort((a, b) => a.top - b.top)
      .map((entry) => entry.el);
  }

  // Best-effort: the viewer toolbar usually shows a "Page X of Y" style
  // label. Returns null (unknown) rather than guessing when not found — the
  // UI must never claim false certainty about the total page count.
  function detectExpectedPageCount() {
    const candidates = document.querySelectorAll('[aria-label*="page" i], [aria-label*="página" i]');
    for (const el of candidates) {
      const text = el.getAttribute("aria-label") || el.textContent || "";
      const match = text.match(/(\d+)\s*(?:\/|of|de)\s*(\d+)/i);
      if (match) return parseInt(match[2], 10);
    }
    return null;
  }

  function detectPages() {
    const { elements, strategyUsed } = detectPageElements();
    const scrollContainer = findScrollContainer(elements);
    return {
      pageElements: orderByPosition(elements, scrollContainer),
      scrollContainer,
      strategyUsed,
      expectedPageCount: detectExpectedPageCount(),
    };
  }

  window.__dpuPageDetector = { detectPages, naturalSize };
})();
