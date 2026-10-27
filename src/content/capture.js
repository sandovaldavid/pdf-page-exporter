// Orchestrates auto-scroll capture and PDF assembly. Exposes
// window.__dpuStartCapture(payload) for the popup to invoke via
// chrome.scripting. Safe to inject into every frame — a frame with no
// detectable pages just stays silent and does nothing.
(function () {
  if (window.__dpuStartCapture) return; // already loaded in this frame

  const SCROLL_STEP_RATIO = 0.75;
  // jsPDF's `unit: "px"` multiplies by 96/72 when converting to the PDF's
  // internal point-based page size (verified empirically: a 600px input
  // becomes an 800pt MediaBox). Without correcting for that, every page
  // comes out ~33% larger than a normal 96dpi-screen-based page size.
  const PDF_UNIT_SCALE = 0.75;
  const RENDER_WAIT_TIMEOUT_MS = 4000;
  const RENDER_POLL_INTERVAL_MS = 100;
  const MAX_SCROLL_STEPS_WITHOUT_PROGRESS = 5;
  // Settle pass after scrolling stops: keep sweeping until no new page has
  // appeared for SETTLE_QUIET_MS, capped at SETTLE_MAX_MS.
  const SETTLE_POLL_MS = 150;
  const SETTLE_QUIET_MS = 500;
  const SETTLE_MAX_MS = 8000;

  // Pages are encoded by the canvas at capture time, so the preset drives
  // canvas.toDataURL directly instead of jsPDF's own re-compression.
  const QUALITY_PRESETS = {
    high: { pdfFormat: "PNG", mimeType: "image/png", encoderQuality: undefined },
    balanced: { pdfFormat: "JPEG", mimeType: "image/jpeg", encoderQuality: 0.82 },
    compact: { pdfFormat: "JPEG", mimeType: "image/jpeg", encoderQuality: 0.6 },
  };

  function sanitizeFilename(name) {
    const base = (name || "documento").trim().replace(/[\\/:*?"<>|]+/g, "_").slice(0, 150);
    return base.length > 0 ? base : "documento";
  }

  function createOverlay() {
    // Colors/radius mirror src/styles/tokens.css, which implements
    // docs/design-system.md. Font stacks use the same fallback chains as
    // --ds-font-body/--ds-font-heading, but not the bundled webfont files
    // themselves: this <style> renders inside the host page (Drive), and
    // loading a chrome-extension:// font from there would need a
    // web_accessible_resources entry just for a few seconds of UI.
    const style = document.createElement("style");
    style.textContent = `
      .dpu-overlay { position: fixed; inset: 0; z-index: 2147483647; background: rgba(2,4,8,.55);
        display: flex; align-items: center; justify-content: center;
        font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .dpu-card { background: #fff; border-radius: 12px; padding: 20px 24px; width: 300px;
        box-shadow: 0 4px 16px rgba(2,4,8,.3); border: 1px solid #cbd5e1; }
      .dpu-title { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, monospace;
        font-weight: 700; font-size: 14px; color: #0f172a; margin: 0 0 12px; }
      .dpu-bar-track { background: #e8eef9; border-radius: 999px; height: 8px; overflow: hidden; }
      .dpu-bar-fill { background: #0a5cd6; height: 100%; width: 0%; transition: width .15s ease; }
      .dpu-status { font-size: 12px; color: #475569; margin: 10px 0 14px; }
      .dpu-cancel { width: 100%; background: #fff; border: 1px solid #cbd5e1; color: #ff1744;
        padding: 8px; border-radius: 8px; cursor: pointer; font-weight: bold; }
      .dpu-cancel:hover { background: color-mix(in srgb, #ff1744 8%, transparent); }
      @media (prefers-reduced-motion: reduce) {
        .dpu-bar-fill { transition: none; }
      }
      @media (prefers-color-scheme: dark) {
        .dpu-card { background: #0a0d14; border-color: #1e293b; }
        .dpu-title { color: #f1f5f9; }
        .dpu-bar-track { background: #141b29; }
        .dpu-bar-fill { background: #00b0ff; }
        .dpu-status { color: #94a3b8; }
        .dpu-cancel { background: #0a0d14; border-color: #1e293b; }
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.className = "dpu-overlay";
    overlay.innerHTML = `
      <div class="dpu-card" role="dialog" aria-modal="true" aria-labelledby="dpu-title">
        <p class="dpu-title" id="dpu-title">Exportando PDF…</p>
        <div class="dpu-bar-track" role="progressbar" aria-labelledby="dpu-title"
             aria-valuemin="0" aria-valuemax="100"><div class="dpu-bar-fill"></div></div>
        <p class="dpu-status" role="status" aria-live="polite">Preparando…</p>
        <button class="dpu-cancel" type="button">Cancelar</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const fill = overlay.querySelector(".dpu-bar-fill");
    const track = overlay.querySelector(".dpu-bar-track");
    const status = overlay.querySelector(".dpu-status");
    const cancelBtn = overlay.querySelector(".dpu-cancel");
    let cancelled = false;

    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      status.textContent = "Cancelando…";
    };
    cancelBtn.addEventListener("click", cancel);
    // ponytail: Escape + initial focus, no full focus trap. The overlay holds a
    // single control, so tabbing out lands on the host page rather than
    // somewhere invisible. Add a trap if the overlay ever grows more controls.
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cancel();
      }
    };
    overlay.addEventListener("keydown", onKeyDown);
    cancelBtn.focus();

    return {
      get cancelled() {
        return cancelled;
      },
      update(captured, expected) {
        // Capturing more pages than the toolbar advertised means the detected
        // total was wrong, not that we are at 275% — drop the bogus total
        // rather than rendering "Página 33 de 12".
        const trustedTotal = expected && captured <= expected ? expected : null;
        const pct = trustedTotal ? Math.round((captured / trustedTotal) * 100) : 0;
        fill.style.width = pct + "%";
        track.setAttribute("aria-valuenow", String(pct));
        status.textContent = trustedTotal
          ? `Página ${captured} de ${trustedTotal}`
          : `Página ${captured} capturada`;
      },
      setStatus(text) {
        status.textContent = text;
      },
      remove() {
        overlay.remove();
        style.remove();
      },
    };
  }

  // Copy a page's pixels out of the viewer NOW, while the element is still
  // alive, and hand back only the encoded bytes.
  //
  // Holding the DOM element and rasterizing later is what made long documents
  // unsafe: the viewer virtualizes, and a page that scrolled out of view can
  // be detached and have its blob: URL revoked before assembly runs, which
  // silently yields a blank page. Encoding here also drops peak memory by
  // roughly an order of magnitude versus keeping every page as a live bitmap.
  function rasterize(el, naturalSize, quality, pageNumber) {
    const { width, height } = naturalSize(el);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    let dataUrl;
    try {
      ctx.drawImage(el, 0, 0, width, height);
      // drawImage does NOT throw on a cross-origin source — it silently taints
      // the canvas, and the SecurityError only surfaces inside toDataURL. Probe
      // one pixel so the failure names the page the user can act on.
      ctx.getImageData(0, 0, 1, 1);
      dataUrl = canvas.toDataURL(quality.mimeType, quality.encoderQuality);
    } catch {
      throw new Error(`No se pudo leer la página ${pageNumber}: el navegador bloqueó el acceso a la imagen.`);
    } finally {
      canvas.width = 0;
      canvas.height = 0; // release the backing pixel buffer right away
    }

    return { dataUrl, width, height };
  }

  function isRendered(el, naturalSize) {
    const { width, height } = naturalSize(el);
    if (width <= 0 || height <= 0) return false;
    if (el.tagName === "IMG") return el.complete;
    return true;
  }

  function waitFor(predicate, timeoutMs, pollMs) {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        const result = predicate();
        if (result || Date.now() - start > timeoutMs) {
          resolve(result);
          return;
        }
        setTimeout(tick, pollMs);
      };
      tick();
    });
  }

  // The popup may be closed and the service worker may be asleep or mid-restart;
  // a dropped progress report must never surface as an unhandled rejection in
  // the host page's console.
  function report(type, payload) {
    chrome.runtime.sendMessage({ type, payload }).catch(() => {});
  }

  const reportProgress = (capturedPages, expectedPageCount) =>
    report("DPU_EXPORT_PROGRESS", { capturedPages, expectedPageCount });
  const reportDone = (capturedPages, expectedPageCount) =>
    report("DPU_EXPORT_DONE", { capturedPages, expectedPageCount });
  const reportError = (errorMessage) => report("DPU_EXPORT_ERROR", { errorMessage });

  async function runCapture(payload, detector, initial) {
    const overlay = createOverlay();
    const quality = QUALITY_PRESETS[payload.quality] || QUALITY_PRESETS.balanced;
    const { naturalSize } = detector;

    try {
      const scrollContainer = initial.scrollContainer;
      // Read once — see detectExpectedPageCount()'s note in page-detector.js.
      const expectedPageCount = detector.detectExpectedPageCount();
      // Keyed by the page's position in the document, valued by its encoded
      // bytes. Position is the only stable identifier a virtualized viewer
      // offers:
      //
      // - Index is wrong. pageElements.slice(captured.length) assumed pages
      //   finish rendering in document order; a viewer decoding in parallel can
      //   finish page 16 before page 14, which slid 16 into slot 14 and then
      //   duplicated it.
      // - Element identity is wrong too. A page that scrolls away can be
      //   unmounted and remounted as a NEW element (captured twice), and a
      //   viewer that recycles one element for several pages would make
      //   different pages look like the same one (captured once).
      //
      // Rounded to 10px so sub-pixel layout jitter cannot split one page in two.
      const POSITION_TOLERANCE_PX = 10;
      const captured = new Map();
      let stepsWithoutProgress = 0;
      let consecutiveEmptySteps = 0;

      // Only meaningful when the toolbar gave us a total we trust.
      const pagesStillMissing = () => expectedPageCount != null && captured.size < expectedPageCount;

      const captureNewlyRenderedPages = () => {
        const { pageElements } = detector.detectPages();
        let capturedAny = false;
        for (const el of pageElements) {
          if (!isRendered(el, naturalSize)) continue; // not ready yet; a later sweep will pick it up
          const top = detector.absoluteTop(el, scrollContainer);
          const key = Math.round(top / POSITION_TOLERANCE_PX);
          if (captured.has(key)) continue;
          const page = rasterize(el, naturalSize, quality, captured.size + 1);
          page.top = top;
          captured.set(key, page);
          capturedAny = true;
        }
        return capturedAny;
      };

      captureNewlyRenderedPages();
      overlay.update(captured.size, expectedPageCount);
      reportProgress(captured.size, expectedPageCount);

      const canScroll =
        payload.autoScroll !== false && scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight + 10;

      if (canScroll) {
        while (!overlay.cancelled) {
          const before = scrollContainer.scrollTop;
          const step = scrollContainer.clientHeight * SCROLL_STEP_RATIO;
          const maxScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
          scrollContainer.scrollTop = Math.min(before + step, maxScrollTop);

          // After one empty step, back off: if nothing rendered within a full
          // wait, further waits at this scroll position essentially never help
          // and would otherwise burn a full RENDER_WAIT_TIMEOUT_MS on every
          // remaining step.
          //
          // While the toolbar says pages are still missing, back off to a
          // longer floor rather than the shortest one. 300ms is under the time
          // a slow page needs to decode, and a page skipped here is lost for
          // good once scrolling moves on and the viewer unmounts it. Do NOT
          // disable the backoff entirely in that case: pages are "missing" for
          // almost the whole document, so that turns every empty step into a
          // 4s stall and makes long exports take minutes.
          const emptyStepTimeout = pagesStillMissing() ? 1200 : 300;
          const timeout = consecutiveEmptySteps > 0 ? emptyStepTimeout : RENDER_WAIT_TIMEOUT_MS;
          const capturedSomething = await waitFor(captureNewlyRenderedPages, timeout, RENDER_POLL_INTERVAL_MS);
          consecutiveEmptySteps = capturedSomething ? 0 : consecutiveEmptySteps + 1;

          overlay.update(captured.size, expectedPageCount);
          reportProgress(captured.size, expectedPageCount);

          const reachedBottom =
            scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 2;
          const madeNoProgress = scrollContainer.scrollTop === before;

          stepsWithoutProgress = madeNoProgress ? stepsWithoutProgress + 1 : 0;

          if (reachedBottom || stepsWithoutProgress >= MAX_SCROLL_STEPS_WITHOUT_PROGRESS) break;
        }
      }

      // waitFor() resolves the moment ANY page is captured, and the loop above
      // then breaks immediately on reaching the bottom — so pages that were
      // still decoding at that instant were silently dropped, and the export
      // finished "successfully" with fewer pages than the document has. Give
      // the viewer a bounded chance to finish before assembling.
      let quietSince = Date.now();
      const settleDeadline = Date.now() + SETTLE_MAX_MS;
      while (Date.now() < settleDeadline && !overlay.cancelled) {
        await new Promise((r) => setTimeout(r, SETTLE_POLL_MS));
        if (captureNewlyRenderedPages()) {
          quietSince = Date.now();
          overlay.update(captured.size, expectedPageCount);
          reportProgress(captured.size, expectedPageCount);
        } else if (!pagesStillMissing() && Date.now() - quietSince >= SETTLE_QUIET_MS) {
          break; // nothing new for a while: the viewer has stopped producing pages
        }
      }

      if (overlay.cancelled) {
        overlay.setStatus("Cancelado");
        reportError("Exportación cancelada por el usuario");
        setTimeout(() => overlay.remove(), 1200);
        return;
      }

      if (captured.size === 0) {
        overlay.setStatus("No se detectaron páginas");
        reportError("No se detectaron páginas del documento");
        setTimeout(() => overlay.remove(), 2500);
        return;
      }

      overlay.setStatus("Generando PDF…");

      const { jsPDF } = window.jspdf;
      let doc = null;

      // Pages go into the PDF in document order, which is not the order they
      // finished rendering in. Nothing here touches the DOM any more: every
      // page was already encoded at capture time.
      const capturedCount = captured.size;
      const pages = Array.from(captured.values()).sort((a, b) => a.top - b.top);
      captured.clear(); // `pages` owns the encoded bytes from here on

      for (let i = 0; i < pages.length; i++) {
        if (overlay.cancelled) {
          overlay.setStatus("Cancelado");
          reportError("Exportación cancelada por el usuario");
          setTimeout(() => overlay.remove(), 1200);
          return;
        }

        const page = pages[i];
        const orientation = page.width >= page.height ? "landscape" : "portrait";
        const pdfWidth = page.width * PDF_UNIT_SCALE;
        const pdfHeight = page.height * PDF_UNIT_SCALE;
        const format = [pdfWidth, pdfHeight];

        if (!doc) {
          doc = new jsPDF({ unit: "px", orientation, format });
        } else {
          doc.addPage(format, orientation);
        }
        doc.addImage(page.dataUrl, quality.pdfFormat, 0, 0, pdfWidth, pdfHeight);

        // jsPDF has its own copy now; drop ours so peak memory tracks the PDF
        // rather than the PDF plus a second full set of page images.
        pages[i] = null;

        if (i % 5 === 0) await new Promise((r) => requestAnimationFrame(r));
      }

      const blob = doc.output("blob");
      const filename = sanitizeFilename(payload.filename) + ".pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      const incomplete = expectedPageCount != null && capturedCount < expectedPageCount;
      overlay.setStatus(
        incomplete
          ? `Descargado con ${capturedCount} de ${expectedPageCount} páginas (incompleto)`
          : `Descargado: ${capturedCount} páginas`
      );
      reportDone(capturedCount, expectedPageCount);
      setTimeout(() => overlay.remove(), 3000);
    } catch (err) {
      overlay.setStatus("Error: " + (err && err.message ? err.message : String(err)));
      reportError(err && err.message ? err.message : String(err));
      setTimeout(() => overlay.remove(), 4000);
    } finally {
      window.__dpuCaptureRunning = false;
    }
  }

  // Returns true only if THIS frame owns viewer content and has started an
  // export. The popup injects into every frame and needs a way to tell "the
  // sidebar iframe correctly did nothing" apart from "detection failed
  // everywhere" — otherwise a DOM change on Google's side leaves the popup
  // stuck at 0% forever with no error.
  window.__dpuStartCapture = function (payload) {
    const detector = window.__dpuPageDetector;
    if (!detector) return false; // detector script failed to load in this frame
    if (window.__dpuCaptureRunning) return false;

    const initial = detector.detectPages();
    if (initial.pageElements.length === 0) return false; // e.g. a sidebar iframe

    window.__dpuCaptureRunning = true;
    runCapture(payload, detector, initial);
    return true;
  };
})();
