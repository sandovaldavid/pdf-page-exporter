// Relays export progress from content scripts to the popup and persists it
// in chrome.storage.session so state survives popup close/reopen. Never
// keeps state in memory — this worker can be terminated at any time.
const STATE_KEY = "dpuExportState";

async function setState(patch) {
  const { [STATE_KEY]: current = null } = await chrome.storage.session.get(STATE_KEY);
  const next = { ...(current || {}), ...patch };
  await chrome.storage.session.set({ [STATE_KEY]: next });
  return next;
}

async function updateBadge(state) {
  if (!state || state.status === "idle") {
    await chrome.action.setBadgeText({ text: "" });
    return;
  }
  // Colors match the Identity System primitives (docs/design-system.md
  // section 7): primary-500 light, status/success/text light, error/500.
  if (state.status === "running") {
    await chrome.action.setBadgeText({ text: String(state.capturedPages ?? 0) });
    await chrome.action.setBadgeBackgroundColor({ color: "#0a5cd6" });
  } else if (state.status === "done") {
    await chrome.action.setBadgeText({ text: "OK" });
    await chrome.action.setBadgeBackgroundColor({ color: "#065f46" });
  } else if (state.status === "error") {
    await chrome.action.setBadgeText({ text: "!" });
    await chrome.action.setBadgeBackgroundColor({ color: "#ff1744" });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  (async () => {
    // A malformed message must not throw inside this IIFE: sendResponse would
    // never run and the caller's port would hang until it times out.
    const payload = message.payload || {};
    const tabId = sender.tab ? sender.tab.id : undefined;

    switch (message.type) {
      case "DPU_EXPORT_PROGRESS": {
        const state = await setState({
          status: "running",
          tabId,
          capturedPages: payload.capturedPages,
          expectedPageCount: payload.expectedPageCount ?? null,
        });
        await updateBadge(state);
        sendResponse({ ok: true });
        break;
      }
      case "DPU_EXPORT_DONE": {
        const state = await setState({
          status: "done",
          tabId,
          capturedPages: payload.capturedPages,
          expectedPageCount: payload.expectedPageCount ?? null,
        });
        await updateBadge(state);
        sendResponse({ ok: true });
        break;
      }
      case "DPU_EXPORT_ERROR": {
        // tabId matters here too: an export that fails before reporting any
        // progress would otherwise show its error on every other tab's popup.
        const state = await setState({
          status: "error",
          tabId,
          errorMessage: payload.errorMessage,
        });
        await updateBadge(state);
        sendResponse({ ok: true });
        break;
      }
      case "DPU_EXPORT_RESET": {
        await chrome.storage.session.remove(STATE_KEY);
        await updateBadge(null);
        sendResponse({ ok: true });
        break;
      }
      case "DPU_GET_STATE": {
        const { [STATE_KEY]: state = null } = await chrome.storage.session.get(STATE_KEY);
        sendResponse({ state });
        break;
      }
      default:
        sendResponse({ ok: false, error: "unknown message type" });
    }
  })();

  return true; // keep the channel open for the async response above
});
