// Orchestrates auto-scroll capture and PDF assembly. Exposes
// window.__dpuStartCapture(payload) for the popup to invoke via
// chrome.scripting. Safe to inject into every frame — a frame with no
// detectable pages just stays silent and does nothing.
(function () {
  if (window.__dpuStartCapture) return; // already loaded in this frame

  const SCROLL_STEP_RATIO = 0.75;
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
    const style = document.createElement("style");
    style.textContent = `
      .dpu-overlay { position: fixed; inset: 0; z-index: 2147483647; background: rgba(32,33,36,.55);
        display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif; }
      .dpu-card { background: #fff; border-radius: 8px; padding: 20px 24px; width: 300px;
        box-shadow: 0 4px 16px rgba(0,0,0,.3); }
      .dpu-title { font-size: 14px; font-weight: bold; color: #202124; margin: 0 0 12px; }
      .dpu-bar-track { background: #e8eaed; border-radius: 4px; height: 8px; overflow: hidden; }
      .dpu-bar-fill { background: #1a73e8; height: 100%; width: 0%; transition: width .15s ease; }
      .dpu-status { font-size: 12px; color: #5f6368; margin: 10px 0 14px; }
      .dpu-cancel { width: 100%; background: #fff; border: 1px solid #dadce0; color: #d93025;
        padding: 8px; border-radius: 4px; cursor: pointer; font-weight: bold; }
      .dpu-cancel:hover { background: #fce8e6; }
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
        if (predicate() || Date.now() - start > timeoutMs) {
          resolve();
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

          await waitFor(captureNewlyRenderedPages, RENDER_WAIT_TIMEOUT_MS, RENDER_POLL_INTERVAL_MS);

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
        const format = [width, height];

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
        doc.addImage(pageCanvas, quality.pdfFormat, 0, 0, width, height, undefined, quality.compression);

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
