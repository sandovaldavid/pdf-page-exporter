# Drive/Docs viewer selectors: verification status

> **Status: VERIFIED against 4 real documents (3, 7, 12 and 194 pages),
> across 2 viewer variants, including a landscape document and one with 194
> pages.** See the history below for details. Gaps remain (see "What remains
> to be verified"): everything tested used **public/shared** documents, not
> one that requires a signed-in Google session, and no real document with
> mixed page sizes was tested.

## How it was verified

It was not possible to verify this with the chrome-devtools MCP connected to
the user's real Chrome session (the "Remote debugging" toggle in
`chrome://inspect` does not expose the classic `--remote-debugging-port`
endpoint the tool needs). Separate Chrome instances were used instead,
without the user's Google session, with the real extension installed
unpacked.

**Initial verification (2026-07-27)**, with the chrome-devtools MCP and a real
click on "Exportar PDF" (Export PDF), against two public documents:

1. `https://docs.google.com/viewer?url=<pdf>&embedded=true` — embedded Docs viewer, 3-page test document.
2. `https://drive.google.com/file/d/1ChPBM5TouAhlNX6IWHlOTiipG0HGl19T/view` — real production Drive viewer, real 12-page academic document, publicly shared.

**Scale and orientation verification (2026-10-26)**, with `playwright-cli` and
a clean profile, against two additional public documents:

3. `https://docs.google.com/viewer?url=https%3A%2F%2Fcdn.truefilesize.com%2Fpdf%2Fsample-pdf-landscape.pdf&embedded=true` — 7 pages, all landscape (842×595 pt).
4. `https://docs.google.com/viewer?url=https%3A%2F%2Fwww.rfc-editor.org%2Frfc%2Frfc9110.pdf&embedded=true` — RFC 9110, 194 portrait pages (595×841 pt).

In the 2026-10-26 run, the real popup was opened as a tab and only
`chrome.tabs.query({active,currentWindow})` was replaced so that it returned
the document tab; `chrome.scripting`, the content scripts, jsPDF, the download
and the rest of the popup are the real code, as in `test/e2e.js`. In both
cases a full export was triggered and the downloaded PDF was verified
independently with `file`, `pdfinfo`, `pdftoppm` and ImageMagick (outside the
extension's own code).

## Results

| Document | Actual pages | Winning strategy | `blob-image` count | `canvas` count | Scrollable container found | `expectedPageCount` extracted | Exported PDF |
|---|---|---|---|---|---|---|---|
| docs.google.com/viewer (3 pages) | 3 | `blob-image` | 3/3 (800×1035 each) | 0 | ✅ DIV `ndfHFb-c4YZDc-cYSp0e-s2gQvd ndfHFb-c4YZDc-s2gQvd` | 3 (from `"Page 1 of 3"`) | ✅ 3 pages, `file` confirms "PDF document, version 1.3, 3 page(s)" |
| drive.google.com/file/d/…/view (12 pages) | 12 | `blob-image` | 3/3 visible initially (virtualized; the rest render during scroll) | 0 | ✅ same DIV, same class | 12 (from `"Página 1 de 12"`, Spanish) | ✅ 12 pages, `file` confirms "PDF document, version 1.3, 12 page(s)", pages 1/7/12 visually verified with `pdftoppm`: sharp text, no clipping or duplicates |
| docs.google.com/viewer (7 pages, landscape) | 7 | `blob-image` | 7/7 (800×565 each) | 0 | ✅ same DIV, same class | 7 (from `"Page 1 of 7"`) | ✅ 7 pages, `pdfinfo` 800×565 pt, ratio 800/565 = 1.416 ≈ source 842/595 = 1.415, landscape orientation preserved, 7/7 unique and non-empty |
| docs.google.com/viewer (194 pages, RFC 9110) | 194 | `blob-image` | 3/3 visible initially (virtualized) | 0 | ✅ same DIV, same class | 194 (from `"Page 1 of 194"`) | ✅ 194 pages, `pdfinfo` 800×1131 pt, 194/194 unique and non-empty, 0/194 landscape by mistake, full export in 8m19s |

Key findings:

- **`blob-image` is the correct and sufficient strategy** in both viewer variants (embedded and production). `canvas` was never needed: the real Google viewer uses images with `blob:` URLs, not `<canvas>` directly.
- **Virtualization is real and active**: in the 12-page document, only ~3 pages had an `<img src="blob:...">` in the DOM on load; the rest appear progressively as you scroll.

  > ℹ️ **Note (2026-08-12 revision).** An earlier version of this note
  > claimed that `capture.js` "captures during scroll (not after)". At the
  > time that **was not true**: `captureNewlyRenderedPages()` only accumulated
  > *DOM references* and `drawImage` happened at the end. **It is true now**:
  > each page is rasterized and encoded the moment it is detected, and
  > assembly only handles bytes that are already ready.
  >
  > To be precise about the reason: it was measured, and detaching the `<img>`
  > and revoking its `blob:` URL is **not** enough to produce blank pages: a
  > detached DOM element keeps its decoded bitmap while a JS reference exists.
  > The case that justifies capturing early is that Chrome discards decoded
  > data under memory pressure, which has not been reproduced deterministically.
  > The measured and certain benefit is memory: encoded bytes are kept instead
  > of live bitmaps.
- **Scale does not change the virtualization pattern**: in the 194-page
  document the viewer kept ~3 pages mounted at the start and materialized the
  rest during auto-scroll. 194/194 were captured, with no blank, duplicate or
  out-of-order pages, and the tab remained responsive. It took 8m19s
  (balanced quality, 800×1131 px per page, 26.9 MB PDF). Peak memory was not
  measured; the main heap after export was ~88 MB.
- **Orientation is preserved in a real landscape document**: the 7-page PDF
  came out at 800×565 pt (ratio 1.416) against a source of 842×595 pt
  (1.415), with no rotation or cropping; `pdfinfo` confirmed 7/7 landscape pages.
- **The scrollable container has the SAME class** (`ndfHFb-c4YZDc-cYSp0e-s2gQvd ndfHFb-c4YZDc-s2gQvd`) in both viewer variants, which suggests they share the same internal component. Note: this class contains the fragment `ndfHFb`, the same one used by strategy 3 (`legacy-class-fragment`). This confirms that the prefix still exists in production, though as a container, not as a useful selector for individual pages (on its own it matched 207–595 elements, useless without the cascade).
- **`detectExpectedPageCount()` works in Spanish and English**: tested with `"Page 1 of 3"` and `"Página 1 de 12"`, both extracted correctly by the regex `(\d+)\s*(?:\/|of|de)\s*(\d+)`.
- **Real bugs found and fixed to date** (not visible in static code review):
  1. The scroll loop could wait for a full 4 seconds on every remaining step once all available pages were captured, with no way to know there was no more content. In documents where everything renders quickly, this added tens of wasted seconds. Fixed: after a first step with no new captures, subsequent steps use a short timeout (300ms).
  2. jsPDF with `unit: "px"` scales by 96/72 (×1.333) when converting to PDF points, so pages came out ~33% larger than expected. Fixed with a compensation factor (`PDF_UNIT_SCALE = 0.75`), verified empirically until a clean 1px = 1pt mapping was obtained.
  3. The suggested filename duplicated the extension (`documento.pdf.pdf`) when the tab title already ended in `.pdf` (this happens in the embedded Docs viewer). Fixed in `suggestFilenameFromTitle`.
  4. The popup showed the result of the last export even when opened on a tab other than the one exported. Fixed by comparing `state.tabId` against the active tab before showing "descargado"/"error" (downloaded/error).
  5. **(2026-10-26)** When reusing the same tab for another document, the popup stayed anchored to the previous result: `applyState()` saw the same `tabId` and there was no way back to the form. `DPU_EXPORT_RESET` existed in the service worker but was never sent. Fixed with an "Exportar otro PDF" (Export another PDF) button in the result, plus an E2E check.

## Implemented strategy (cascade, most to least reliable)

| # | Strategy | Selector | Confidence | Status |
|---|---|---|---|---|
| 1 | `blob-image` | `img[src^="blob:"]` | High | **Confirmed as the winner in 4/4 real documents tested** |
| 2 | `canvas` | `canvas` (with `width/height` ≥ 100px) | Medium | Not observed in practice yet; kept as a safety net |
| 3 | `legacy-class-fragment` | `[class*="ndfHFb"]` | Low | The class fragment DOES exist in the real DOM (seen in the scrollable container), but on its own it matches hundreds of irrelevant elements. Confirmed as a poor last resort, as originally documented |

Each candidate element is filtered by `MIN_PAGE_DIMENSION = 100px` to discard icons and thumbnails.

## What remains to be verified

- A document that requires a signed-in Google session (everything tested used public/shared links; the DOM is highly likely to be identical because it is the same viewer infrastructure, but this has not been confirmed with an authenticated account). **Blocked until a URL and a Google session are available.**
- A real document with mixed page sizes (landscape and portrait in the same file). The pure landscape case is already verified; no public mixed PDF was found to test the actual alternation.
- Peak memory during long documents: not measured. With 194 pages it was confirmed that there was no crash, that the tab remained responsive and that the main heap after export was ~88 MB, but browser RSS was not sampled throughout the capture.
- Determinism of the 194-page case: a single full run. Repeating it to rule out variation from memory pressure is still pending.
- **Cross-origin iframe: not supported by design.** The popup only activates if the top-level tab is `drive.google.com` or `docs.google.com` (`DRIVE_HOSTS` in `popup.js`). `allFrames: true` covers frames inside those two domains (for example, a side panel with no pages), not a viewer embedded in a third-party site. Expanding it would require much broader host permissions and would make store review worse.

## History

| Date | Who | What was verified |
|---|---|---|
| 2026-07-27 | Implementation session (Chrome via MCP, real extension installed) | Detection, order, scrollable container and full export verified against 2 real documents (3 and 12 pages) in 2 Google viewer variants. 4 real bugs found and fixed in that session (see above). No document tested required a signed-in Google session. |
| 2026-08-12 | Security/performance review + E2E suite (`test/run.sh`, real Chromium with the unpacked extension) | Fixture that mimics the DOM verified above, served from the real `drive.google.com` origin. 25 browser checks + PDF verification with `pdftoppm`. **Real bug found: index-based pairing.** `captureNewlyRenderedPages()` did `pageElements.slice(capturedElements.length)`, which assumes pages finish rendering in document order. That is not true: a viewer that decodes in parallel can finish page 16 before page 14, which put page 16 in slot 14 and then duplicated it (or lost pages). Fixed by pairing on element identity + explicit absolute position. **This bug was NOT visible in the 2026-07-27 verification** because with 3 and 12 pages rendering was fast enough to arrive in order. |
| 2026-10-26 | Real verification with Playwright + unpacked extension (headed Chromium, clean profile) | Real 7-page landscape document (`docs.google.com/viewer?url=…sample-pdf-landscape.pdf`) and 194-page RFC 9110 (`docs.google.com/viewer?url=…rfc9110.pdf`). Results: 7/7 and 194/194 pages; `pdfinfo` 800×565 pt and 800×1131 pt; orientation preserved; all pages rendered at 72 dpi non-empty with a unique SHA-256; no console errors or crashes. The 194-page export took 8m19s and produced a 26.9 MB PDF. **Real bug found and fixed: popup anchored to the previous result when reusing the same tab** (see bug 5 above); E2E suite expanded to 30 checks. |
