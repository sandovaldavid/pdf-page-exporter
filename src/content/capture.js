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

  const QUALITY_PRESETS = {
    high: { pdfFormat: "PNG", compression: undefined },
    balanced: { pdfFormat: "JPEG", compression: "MEDIUM" },
    compact: { pdfFormat: "JPEG", compression: "FAST" },
  };

  function sanitizeFilename(name) {
    const base = (name || "documento").trim().replace(/[\\/:*?"<>|]+/g, "_").slice(0, 150);
    return base.length > 0 ? base : "documento";
  }

  function createOverlay() {
    // Colors/radius mirror src/styles/tokens.css (David Sandoval Identity
    // System — docs/design-system.md). Font stacks use the same fallback
    // chains as --ds-font-body/--ds-font-heading, but not the bundled
    // webfont files themselves: this <style> renders inside the host page
    // (Drive), and loading a chrome-extension:// font from there would
    // need a web_accessible_resources entry just for a few seconds of UI.
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
      <div class="dpu-card">
        <p class="dpu-title">Exportando PDF…</p>
        <div class="dpu-bar-track"><div class="dpu-bar-fill"></div></div>
        <p class="dpu-status">Preparando…</p>
        <button class="dpu-cancel" type="button">Cancelar</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const fill = overlay.querySelector(".dpu-bar-fill");
    const status = overlay.querySelector(".dpu-status");
    const cancelBtn = overlay.querySelector(".dpu-cancel");
    let cancelled = false;
    cancelBtn.addEventListener("click", () => {
      cancelled = true;
      status.textContent = "Cancelando…";
    });

    return {
      get cancelled() {
        return cancelled;
      },
      update(captured, expected) {
        const pct = expected ? Math.min(100, Math.round((captured / expected) * 100)) : 0;
        fill.style.width = pct + "%";
        status.textContent = expected ? `Página ${captured} de ${expected}` : `Página ${captured} capturada`;
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

  function reportProgress(capturedPages, expectedPageCount) {
    chrome.runtime.sendMessage({ type: "DPU_EXPORT_PROGRESS", payload: { capturedPages, expectedPageCount } });
  }

  function reportDone(capturedPages, expectedPageCount) {
    chrome.runtime.sendMessage({ type: "DPU_EXPORT_DONE", payload: { capturedPages, expectedPageCount } });
  }

  function reportError(errorMessage) {
    chrome.runtime.sendMessage({ type: "DPU_EXPORT_ERROR", payload: { errorMessage } });
  }

  async function runCapture(payload) {
    const detector = window.__dpuPageDetector;
    if (!detector) return; // detector script failed to load in this frame

    const initial = detector.detectPages();
    if (initial.pageElements.length === 0) {
      // No viewer content in this frame (e.g. a sidebar iframe) — stay silent.
      return;
    }

    if (window.__dpuCaptureRunning) return;
    window.__dpuCaptureRunning = true;

    const overlay = createOverlay();
    const quality = QUALITY_PRESETS[payload.quality] || QUALITY_PRESETS.balanced;
    const { naturalSize } = detector;

    try {
      const scrollContainer = initial.scrollContainer;
      const expectedPageCount = initial.expectedPageCount;
      const capturedElements = [];
      let stepsWithoutProgress = 0;
      let consecutiveEmptySteps = 0;

      const captureNewlyRenderedPages = () => {
        const { pageElements } = detector.detectPages();
        const pending = pageElements.slice(capturedElements.length);
        let capturedAny = false;
        for (const el of pending) {
          if (!isRendered(el, naturalSize)) break; // stop at first not-yet-rendered page; keep order
          capturedElements.push(el);
          capturedAny = true;
        }
        return capturedAny;
      };

      captureNewlyRenderedPages();
      overlay.update(capturedElements.length, expectedPageCount);
      reportProgress(capturedElements.length, expectedPageCount);

      const canScroll =
        payload.autoScroll !== false && scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight + 10;

      if (canScroll) {
        while (!overlay.cancelled) {
          const before = scrollContainer.scrollTop;
          const step = scrollContainer.clientHeight * SCROLL_STEP_RATIO;
          scrollContainer.scrollTop = Math.min(before + step, scrollContainer.scrollHeight);

          // After one empty step, back off to a short timeout: if nothing
          // rendered within a full wait, further waits at this scroll
          // position essentially never help and would otherwise burn a
          // full RENDER_WAIT_TIMEOUT_MS on every remaining step.
          const timeout = consecutiveEmptySteps > 0 ? 300 : RENDER_WAIT_TIMEOUT_MS;
          const capturedSomething = await waitFor(captureNewlyRenderedPages, timeout, RENDER_POLL_INTERVAL_MS);
          consecutiveEmptySteps = capturedSomething ? 0 : consecutiveEmptySteps + 1;

          overlay.update(capturedElements.length, expectedPageCount);
          reportProgress(capturedElements.length, expectedPageCount);

          const reachedBottom =
            scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 2;
          const madeNoProgress = scrollContainer.scrollTop === before;

          stepsWithoutProgress = madeNoProgress ? stepsWithoutProgress + 1 : 0;

          if (reachedBottom || stepsWithoutProgress >= MAX_SCROLL_STEPS_WITHOUT_PROGRESS) break;
        }
      }

      if (overlay.cancelled) {
        overlay.setStatus("Cancelado");
        reportError("Exportación cancelada por el usuario");
        setTimeout(() => overlay.remove(), 1200);
        return;
      }

      if (capturedElements.length === 0) {
        overlay.setStatus("No se detectaron páginas");
        reportError("No se detectaron páginas del documento");
        setTimeout(() => overlay.remove(), 2500);
        return;
      }

      overlay.setStatus("Generando PDF…");

      const { jsPDF } = window.jspdf;
      let doc = null;

      for (let i = 0; i < capturedElements.length; i++) {
        const el = capturedElements[i];
        const { width, height } = naturalSize(el);
        const orientation = width >= height ? "landscape" : "portrait";
        const pdfWidth = width * PDF_UNIT_SCALE;
        const pdfHeight = height * PDF_UNIT_SCALE;
        const format = [pdfWidth, pdfHeight];

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = width;
        pageCanvas.height = height;
        const ctx = pageCanvas.getContext("2d");
        try {
          ctx.drawImage(el, 0, 0, width, height);
        } catch {
          throw new Error(`No se pudo leer la página ${i + 1}: el navegador bloqueó el acceso a la imagen.`);
        }

        if (!doc) {
          doc = new jsPDF({ unit: "px", orientation, format });
        } else {
          doc.addPage(format, orientation);
        }
        doc.addImage(pageCanvas, quality.pdfFormat, 0, 0, pdfWidth, pdfHeight, undefined, quality.compression);

        pageCanvas.width = 0;
        pageCanvas.height = 0; // release the backing pixel buffer right away

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

      const incomplete = expectedPageCount != null && capturedElements.length < expectedPageCount;
      overlay.setStatus(
        incomplete
          ? `Descargado con ${capturedElements.length} de ${expectedPageCount} páginas (incompleto)`
          : `Descargado: ${capturedElements.length} páginas`
      );
      reportDone(capturedElements.length, expectedPageCount);
      setTimeout(() => overlay.remove(), 3000);
    } catch (err) {
      overlay.setStatus("Error: " + (err && err.message ? err.message : String(err)));
      reportError(err && err.message ? err.message : String(err));
      setTimeout(() => overlay.remove(), 4000);
    } finally {
      window.__dpuCaptureRunning = false;
    }
  }

  window.__dpuStartCapture = function (payload) {
    runCapture(payload);
  };
})();
