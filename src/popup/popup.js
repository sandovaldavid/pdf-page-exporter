const DRIVE_HOSTS = ["drive.google.com", "docs.google.com"];

const els = {};

function cacheElements() {
  els.notDriveState = document.getElementById("notDriveState");
  els.exportForm = document.getElementById("exportForm");
  els.filenameInput = document.getElementById("filenameInput");
  els.qualitySelect = document.getElementById("qualitySelect");
  els.autoScrollInput = document.getElementById("autoScrollInput");
  els.exportBtn = document.getElementById("exportBtn");
  els.progressState = document.getElementById("progressState");
  els.progressTrack = document.getElementById("progressTrack");
  els.progressFill = document.getElementById("progressFill");
  els.progressText = document.getElementById("progressText");
  els.resultState = document.getElementById("resultState");
  els.resultText = document.getElementById("resultText");
  els.resetBtn = document.getElementById("resetBtn");
}

function isDriveUrl(url) {
  if (!url) return null; // unknown — tab.url may be unavailable without permission
  try {
    return DRIVE_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

function suggestFilenameFromTitle(title) {
  if (!title) return "";
  return title
    .replace(/\s*-\s*Google\s+(Drive|Docs)\s*$/i, "")
    .replace(/\.pdf$/i, "")
    .trim();
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function showState(name) {
  els.notDriveState.hidden = name !== "not-drive";
  els.exportForm.hidden = name !== "form";
  els.progressState.hidden = name !== "progress";
  els.resultState.hidden = name !== "result";
}

function renderProgress(state) {
  const captured = state.capturedPages ?? 0;
  const expected = state.expectedPageCount ?? null;
  // Mirrors the overlay in capture.js: a total smaller than what we already
  // captured was misdetected, so stop quoting it.
  const trustedTotal = expected && captured <= expected ? expected : null;
  const pct = trustedTotal ? Math.round((captured / trustedTotal) * 100) : 0;
  els.progressFill.style.width = pct + "%";
  els.progressTrack.setAttribute("aria-valuenow", String(pct));
  els.progressText.textContent = trustedTotal
    ? `Página ${captured} de ${trustedTotal}`
    : `Página ${captured} capturada`;
}

function renderResult(state) {
  els.resultState.classList.toggle("dpu-result-error", state.status === "error");
  if (state.status === "error") {
    els.resultText.textContent = "Error: " + (state.errorMessage || "ocurrió un problema");
  } else {
    const captured = state.capturedPages ?? 0;
    const expected = state.expectedPageCount ?? null;
    els.resultText.textContent =
      expected != null && captured < expected
        ? `Descargado con ${captured} de ${expected} páginas (incompleto)`
        : `PDF descargado: ${captured} páginas`;
  }
}

async function applyState(state, currentTabId) {
  // A stored export result belongs to whichever tab ran it. Opening the
  // popup on a different tab shouldn't show a stale "done"/"error" from an
  // unrelated document.
  if (state && state.tabId != null && state.tabId !== currentTabId) {
    showState("form");
    return;
  }
  if (!state || state.status === "idle") {
    showState("form");
    return;
  }
  if (state.status === "running") {
    showState("progress");
    renderProgress(state);
    return;
  }
  if (state.status === "done" || state.status === "error") {
    showState("result");
    renderResult(state);
    return;
  }
  showState("form");
}

async function loadPreferences() {
  const { dpuPrefs } = await chrome.storage.local.get("dpuPrefs");
  return dpuPrefs || { quality: "balanced", autoScroll: true };
}

async function savePreferences() {
  await chrome.storage.local.set({
    dpuPrefs: {
      quality: els.qualitySelect.value,
      autoScroll: els.autoScrollInput.checked,
    },
  });
}

async function handleReset() {
  // The stored state is what keeps the popup pinned to the old result when the
  // same tab is reused for another document. Clear it before showing the form;
  // a sleeping service worker must not block the user either.
  await chrome.runtime.sendMessage({ type: "DPU_EXPORT_RESET" }).catch(() => null);
  showState("form");
}

async function handleExportSubmit(event) {
  event.preventDefault();
  await savePreferences();

  const tab = await getActiveTab();
  if (!tab || !tab.id) return;

  els.exportBtn.disabled = true;
  try {
    // Probe with the small detector first, then load jsPDF (420 KB) only into
    // the frames that actually hold viewer pages. Injecting it into every frame
    // meant re-parsing it in each sidebar/ad iframe on every single export.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ["src/content/page-detector.js"],
    });

    const probes = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => {
        const detector = window.__dpuPageDetector;
        return !!detector && detector.detectPages().pageElements.length > 0;
      },
    });

    const frameIds = probes.filter((p) => p.result).map((p) => p.frameId);
    if (frameIds.length === 0) {
      // Previously this path started an export that silently did nothing,
      // leaving the popup pinned at 0% with no way out.
      showState("result");
      renderResult({
        status: "error",
        errorMessage:
          "No se detectaron páginas del documento en esta pestaña. Abre el documento en el visor de Drive, espera a que cargue la primera página y vuelve a intentarlo.",
      });
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds },
      files: ["src/vendor/jspdf.umd.min.js", "src/content/capture.js"],
    });

    const payload = {
      filename: els.filenameInput.value || suggestFilenameFromTitle(tab.title) || "documento",
      quality: els.qualitySelect.value,
      autoScroll: els.autoScrollInput.checked,
    };

    await chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds },
      func: (p) => typeof window.__dpuStartCapture === "function" && window.__dpuStartCapture(p),
      args: [payload],
    });

    showState("progress");
    renderProgress({ capturedPages: 0, expectedPageCount: null });
  } catch (err) {
    showState("result");
    renderResult({
      status: "error",
      errorMessage:
        "No se pudo iniciar la exportación en esta pestaña. " + (err && err.message ? err.message : String(err)),
    });
  } finally {
    els.exportBtn.disabled = false;
  }
}

function listenForLiveUpdates() {
  chrome.runtime.onMessage.addListener((message) => {
    if (!message || !message.type) return;
    if (message.type === "DPU_EXPORT_PROGRESS") {
      showState("progress");
      renderProgress(message.payload);
    } else if (message.type === "DPU_EXPORT_DONE") {
      showState("result");
      renderResult({ status: "done", ...message.payload });
    } else if (message.type === "DPU_EXPORT_ERROR") {
      showState("result");
      renderResult({ status: "error", ...message.payload });
    }
  });
}

async function init() {
  cacheElements();
  listenForLiveUpdates();
  // Attached before any await: if anything below throws, the form must not be
  // left rendered but inert with a dead Export button.
  els.exportForm.addEventListener("submit", handleExportSubmit);
  els.resetBtn.addEventListener("click", handleReset);

  const prefs = await loadPreferences();
  els.qualitySelect.value = prefs.quality;
  els.autoScrollInput.checked = prefs.autoScroll;

  const tab = await getActiveTab();
  const driveCheck = isDriveUrl(tab && tab.url);

  if (driveCheck === false) {
    showState("not-drive");
    return;
  }

  els.filenameInput.value = suggestFilenameFromTitle(tab && tab.title);

  // The service worker may be asleep or restarting — sendMessage can resolve
  // undefined or reject outright. Neither is a reason to fail the popup.
  const response = await chrome.runtime.sendMessage({ type: "DPU_GET_STATE" }).catch(() => null);
  await applyState(response && response.state, tab && tab.id);
}

document.addEventListener("DOMContentLoaded", init);
