# Chrome Web Store Listing: PDF Page Exporter

> Last Updated: 2026-10-26
> **Status: package validated; the store listing is not yet publishable.** The v0.1.0 ZIP
> builds and validates (manifest, icons, paths and remote code checked), and
> the required screenshot exists. Publisher, contact and visibility still need
> confirmation. Verification with a signed-in Google session is still pending;
> see "Submission Readiness" at the end.

## Store Listing

> ⚠️ **The copy below is an English translation draft.** The store's primary
> language is still Spanish (Latin America) and `description` in `manifest.json`
> is still Spanish. Do not submit the English short description while those stay
> Spanish: the field must match the manifest. Either switch the listing and the
> manifest to English together, or use the Spanish copy from the previous
> revision.

**Extension Name** [REQUIRED]

PDF Page Exporter

> ⚠️ Must match `name` in `manifest.json` exactly. It deliberately does **not** contain "Google", "Drive" or "Unblocker": using other companies' trademarks in the name is grounds for rejection, and a word like "Unblocker" suggests bypassing protections. Max. 75 characters.

**Short Description** [REQUIRED]

Export to PDF the pages of a document that your browser viewer already displays.

> The Spanish version of this field is 89 characters; that string must match `description` in the manifest (limit 132).

**Detailed Description** [REQUIRED]

> Draft. Written from the user's perspective, without mentioning libraries, APIs or implementation details.

```
Turn the pages of a document that your browser is already showing on screen into a downloadable PDF.

Build a single PDF file from the visible pages of the document. It scrolls through the document automatically so you do not have to scroll page by page. It keeps the original size and orientation of each page, even when the document mixes portrait and landscape sheets. You can choose the file name before saving and adjust the quality to balance sharpness and size. A progress bar shows which page it is on, and you can cancel at any time.

How to use it:
1. Open the document in your browser and wait for the first page to load.
2. Click the extension icon.
3. Enter the file name and choose the quality.
4. Click "Exportar PDF" (Export PDF) and wait for it to finish.
5. The PDF is saved to your downloads folder.

Tip: increase the viewer zoom level before exporting if you want a sharper result.

Privacy: the extension processes the visible pages of your document locally and saves the PDF to your device. It does not send the content to any server, does not store it outside your device, includes no analytics or telemetry, and does not need an internet connection to do its job. It only acts when you click its icon and "Exportar PDF" (Export PDF).

Keep in mind: the resulting PDF contains images of the pages, so it does not allow searching or selecting text. Sharpness depends on how the document looks on screen when you export it.

Use this extension only with documents you have legitimate access to, respecting copyright and the terms under which you received the document.

Questions or problems: https://github.com/sandovaldavid/pdf-page-exporter/issues
```

**Category** [REQUIRED]

Productivity

**Single Purpose** [REQUIRED]

Export the pages of a document that the browser viewer has already rendered on screen to a single PDF file.

**Primary Language** [REQUIRED]

Spanish (Latin America). ⚠️ Confirm; consider publishing in English as well.

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Created (validated 128×128 RGBA PNG) | `icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | ✅ Created from the real popup | `store-assets/store-1.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ⬜ Not created | |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ Not created | |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | |

### Screenshot Notes

All screenshots must use **our own test document with no personal data**, never someone else's material and never material with a visible third-party trademark.

1. ✅ `store-assets/store-1.png` (1280×800): real popup, captured from the installed extension, with the file name and quality selector visible. The popup sits on a neutral brand background next to the icon, the name and one line of copy. No document, no personal data and no third-party trademarks.
2. ⬜ The progress overlay halfway through an export, showing "página 14 de 30" (page 14 of 30).
3. ⬜ The resulting PDF already open, with the thumbnail panel visible to show that it keeps all pages and their orientations.

`store-assets/` is in `.gitignore`; the screenshot is a submission asset, not part of the code.

## Permissions Justification

> ⚠️ Confirm against the final manifest. Each entry is copied as is into the Developer Dashboard form.

| Permission | Type | Justification |
|------------|------|---------------|
| `scripting` | permissions | Needed to inject the code that reads the pages already rendered in the tab and assembles them into a PDF. The code is injected only when the user clicks the extension icon. Without this permission the extension cannot access the visible content it must export. |
| `storage` | permissions | Stores the user's preferences locally (suggested file name, quality level) and the progress of the current export, so the progress bar is restored if the user closes and reopens the popup. No data leaves the device. |
| `https://drive.google.com/*` | host_permissions | The document viewer the extension operates on is served from this domain. Access is limited to reading the images of pages already shown on screen, only after a user click. |
| `https://docs.google.com/*` | host_permissions | Some views of the same viewer load from this domain in a secondary frame. Without it, export fails on those documents. |

Reviewer note: **no** `tabs`, `downloads`, `<all_urls>` or any network permission is requested. See `PLAN.md` §5 (D2, D7).

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** **Yes, only website content (page images), processed locally and never transmitted.**

The Chrome Web Store User Data FAQ treats capturing or cropping content from a website as data handling, even when it happens on the device. So the correct declaration is "Yes, website content", with the local scope noted. The extension code makes no network requests: there is no server of our own, no analytics, no telemetry and no `chrome.storage.sync` (only `local` and `session`, which do not leave the device). Images are processed in memory inside the tab and the PDF is saved directly to the user's disk.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | None | No |
| Health info | No | No | None | No |
| Financial info | No | No | None | No |
| Authentication info | No | No | None | No |
| Personal communications | No | No | None | No |
| Location | No | No | None | No |
| Web history | No | No | None | No |
| User activity | No | No | None | No |
| Website content | Yes, read into memory only when you click Export | No | Assemble the PDF the user requested | No |

> The "Website content" row is the one that must match the form: the extension **does read** page images, but it does not store or transmit them. Declaring "No" would contradict the code's behavior; declaring "Yes, processed locally" is accurate and consistent with the privacy policy.

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]

`https://sandovaldavid.github.io/pdf-page-exporter/privacy.html`

The policy will be available in English at that URL and in Spanish at
`https://sandovaldavid.github.io/pdf-page-exporter/es/privacy.html` when the
`Deploy website` workflow runs. The text lives in `website/privacy.html` and
`website/es/privacy.html`; the `Deploy website` GitHub Actions workflow
publishes only `website/`. The URL does not depend on `/docs`.

## Distribution

**Visibility**: ⚠️ **Pending decision, see `PLAN.md` §7.** Recommendation: local unpacked install as the main path; if published, start as **Unlisted**.

**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]

⚠️ Pending.

**Contact Email** [REQUIRED]

sandovaldavid.eng@gmail.com. ⚠️ Confirm; this email appears **publicly** in the store listing. Consider a dedicated address.

**Support URL / Email** [RECOMMENDED]

https://github.com/sandovaldavid/pdf-page-exporter/issues

**Homepage URL** [RECOMMENDED]

https://github.com/sandovaldavid/pdf-page-exporter

## Submission Readiness (2026-10-26)

| Check | Status | Evidence |
|---|---|---|
| ZIP builds with `scripts/package-extension.sh` | Passed | `pdf-page-exporter-v0.1.0.zip`, 240 KB, 16 runtime files |
| Manifest at ZIP root and Chrome accepts it | Passed | `google-chrome --pack-extension` exit 0 |
| Runtime paths complete (manifest, scripts, jsPDF, fonts, icons) | Passed | every declared/injected path resolves inside the ZIP |
| ZIP contains no tests, docs, scripts, secrets or tool scratch | Passed | allowlist packaging; `.playwright-mcp/` leak fixed |
| No remote code and no every-page content script | Passed | authored `src/` has no network/eval; injection only on click |
| Permissions minimal | Passed | `scripting`, `storage`, two Google host permissions |
| Store icon 128×128 | Passed | valid RGBA PNG |
| At least one required screenshot | Passed | `store-assets/store-1.png`, 1280×800 |
| Privacy policy URL live | **Not run** | `website/privacy.html` and `website/es/privacy.html` ready; `Deploy website` not run, so the live URL is not verified |
| Publisher, contact, visibility | **Blocked** | decisions pending |
| Real landscape document (7 pages) | Passed | 7/7 pages, 800×565 pt, all landscape, non-blank, unique |
| Real 194-page document (RFC 9110) | Passed | 194/194 pages, 800×1131 pt, portrait, non-blank, unique; 8m19s |
| Mixed page sizes | **Not run** | no public mixed-orientation PDF found |
| Peak memory / repeated 194-page run | **Not run** | one completed run, no crash, tab responsive, heap ~88 MB |
| Authenticated Google-session document | **Blocked** | no URL/session available |
| Store submission | **Blocked** | no authenticated Developer Dashboard account in scope |

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.1.0 | 2026-10-26 | Initial version: PDF export with automatic scrolling, per-sheet page size, editable file name, quality selector and cancelable progress bar. Verified against 4 real public documents (3, 7, 12 and 194 pages), including landscape and 194 pages. Added an "Exportar otro PDF" ("Export another PDF") button to reset the popup after an export. See Known Issues for what still needs coverage before publishing. | Draft |

## Review Notes

### Known Issues / Limitations

Things review may flag, or that the user should know:

1. **Policy risk.** The feature may be read as bypassing a download restriction imposed by the document owner. Technically no encryption or access control is broken: it only reads pixels already present on the user's screen, like a screenshot. Even so, store policy is stricter than the law. **This is the most likely reason for rejection.**
2. **Dependency on a third-party site's DOM.** The extension depends on the document viewer's structure, which its owner can change without notice. If that happens, the extension tells the user it found no pages instead of generating an empty PDF.
3. **Raster output.** The PDF contains images, not text: it is not searchable and not accessible to screen readers. This is stated in the description to avoid misleading users.
4. **Limited fidelity.** Resolution depends on the viewer zoom at export time.
5. **Bundled third-party library.** jsPDF 4.2.1 (MIT) ships minified inside the package (`src/vendor/jspdf.umd.min.js`), downloaded from the official npm tarball and verified against the `shasum` published by the registry before inclusion. It is never loaded at runtime. Minified, not obfuscated; the license header is kept. The Inter and JetBrains Mono fonts (SIL OFL 1.1) ship with their license in `assets/fonts/OFL.txt`.
6. **Partial live verification.** Tested against 4 real public documents (3, 7, 12 and 194 pages) in 2 viewer variants, including a landscape PDF and a full 194-page export with auto-scroll (8m19s, 26.9 MB, no crashes and no blank pages). See `docs/selectors.md` for details. Still untested: a document that requires a signed-in Google session (the most common use; do not publish without covering it) and a real document with mixed page sizes. An iframe on a third-party origin is not supported by design.
7. **Long documents.** Duration grows with the number of pages: 194 pages took ~8m19s in the test environment, with the progress bar advancing. It is not a hang, but it is worth mentioning in the store listing or the UI if you want to avoid users canceling out of impatience.

### Rejection History

No submissions yet.
