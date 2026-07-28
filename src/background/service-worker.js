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
  if (state.status === "running") {
    await chrome.action.setBadgeText({ text: String(state.capturedPages ?? 0) });
    await chrome.action.setBadgeBackgroundColor({ color: "#1a73e8" });
  } else if (state.status === "done") {
    await chrome.action.setBadgeText({ text: "OK" });
    await chrome.action.setBadgeBackgroundColor({ color: "#188038" });
  } else if (state.status === "error") {
    await chrome.action.setBadgeText({ text: "!" });
    await chrome.action.setBadgeBackgroundColor({ color: "#d93025" });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  (async () => {
    switch (message.type) {
      case "DPU_EXPORT_PROGRESS": {
        const state = await setState({
          status: "running",
          tabId: sender.tab ? sender.tab.id : undefined,
          capturedPages: message.payload.capturedPages,
          expectedPageCount: message.payload.expectedPageCount ?? null,
        });
        await updateBadge(state);
        sendResponse({ ok: true });
        break;
      }
      case "DPU_EXPORT_DONE": {
        const state = await setState({
          status: "done",
          capturedPages: message.payload.capturedPages,
          expectedPageCount: message.payload.expectedPageCount ?? null,
        });
        await updateBadge(state);
        sendResponse({ ok: true });
        break;
      }
      case "DPU_EXPORT_ERROR": {
        const state = await setState({
          status: "error",
          errorMessage: message.payload.errorMessage,
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
