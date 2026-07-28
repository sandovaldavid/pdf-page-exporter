// Fase 0 diagnostic: paste this whole file into the DevTools console (F12)
// while a document is open in the Drive/Docs viewer. It only reads the DOM
// (no writes, no network calls, nothing leaves your machine) and prints a
// summary of what page-detector.js's strategies would find. Paste the
// printed summary back so docs/selectors.md can be updated with real data.
//
// This embeds the exact logic from src/content/page-detector.js — keep the
// two in sync if that file changes.
(function () {
  const MIN_PAGE_DIMENSION = 100;

  function naturalSize(el) {
    if (el.tagName === "CANVAS") return { width: el.width, height: el.height };
    return { width: el.naturalWidth || el.width, height: el.naturalHeight || el.height };
  }

  function isPlausiblePage(el) {
    const { width, height } = naturalSize(el);
    return width >= MIN_PAGE_DIMENSION && height >= MIN_PAGE_DIMENSION;
  }

  const STRATEGIES = [
    { name: "blob-image", find: () => Array.from(document.querySelectorAll('img[src^="blob:"]')).filter(isPlausiblePage) },
    { name: "canvas", find: () => Array.from(document.querySelectorAll("canvas")).filter(isPlausiblePage) },
    {
      name: "legacy-class-fragment",
      find: () =>
        Array.from(document.querySelectorAll('[class*="ndfHFb"]'))
          .map((el) => (el.tagName === "IMG" ? el : el.querySelector("img")))
          .filter(Boolean)
          .filter(isPlausiblePage),
    },
  ];

  function findScrollContainer(pageElements) {
    if (pageElements.length === 0) return null;
    let node = pageElements[0];
    while (node && node !== document.body) {
      if (node.scrollHeight > node.clientHeight + 10) return node;
      node = node.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  function detectExpectedPageCount() {
    const candidates = document.querySelectorAll('[aria-label*="page" i], [aria-label*="página" i]');
    for (const el of candidates) {
      const text = el.getAttribute("aria-label") || el.textContent || "";
      const match = text.match(/(\d+)\s*(?:\/|of|de)\s*(\d+)/i);
      if (match) return { count: parseInt(match[2], 10), source: text.trim().slice(0, 80) };
    }
    return null;
  }

  console.log("=== DPU Fase 0 diagnostic ===");
  console.log("URL:", location.href);
  console.log("Document title:", document.title);

  const results = {};
  for (const s of STRATEGIES) {
    const found = s.find();
    results[s.name] = found;
    const sizes = found.slice(0, 5).map((el) => {
      const { width, height } = naturalSize(el);
      return `${width}x${height}`;
    });
    console.log(
      `[${s.name}] matches: ${found.length}` + (found.length ? ` — first sizes: ${sizes.join(", ")}` : "")
    );
  }

  const winner = STRATEGIES.find((s) => results[s.name].length > 0);
  console.log("Winning strategy (what page-detector.js would use):", winner ? winner.name : "NONE — nothing detected");

  if (winner) {
    const container = findScrollContainer(results[winner.name]);
    console.log(
      "Scroll container:",
      container === document.scrollingElement ? "document.scrollingElement (fallback — no scrollable ancestor found)" : container,
      container ? `scrollHeight=${container.scrollHeight} clientHeight=${container.clientHeight}` : ""
    );
  }

  const expected = detectExpectedPageCount();
  console.log("Expected page count label found:", expected ? `${expected.count} (from: "${expected.source}")` : "none");

  console.log("=== end diagnostic — copy everything above and send it back ===");
})();
