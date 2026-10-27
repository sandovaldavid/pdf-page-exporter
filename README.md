# PDF Page Exporter

Chrome extension (Manifest V3) that exports the pages of a document that the
Google Drive/Docs viewer **has already rendered on screen** as a downloadable
PDF. It does not decrypt anything or bypass any protection: it only reads
pixels the browser is already showing you, like a screenshot, walking through
the document automatically and assembling each page at its real size and
orientation.

See `PLAN.md` for the full design, the audit of the original prototype and the
technical decisions. See `CHROMEWEBSTORE.md` for the store listing.

## Current status

v0.1.0 implementation verified end to end against 4 real PDF documents (3, 7,
12 and 194 pages) in the 2 variants of the Google viewer
(`docs.google.com/viewer` and `drive.google.com/file/d/…/view`), including a
landscape document and a 194-page one, with the real extension installed and a
real click on "Exportar PDF" ("Export PDF"). The E2E suite (`test/run.sh`) runs
30 browser checks and verifies the PDFs with `pdfinfo`/`pdftoppm`. See
`docs/selectors.md` for the full detail and what still needs testing (a
document that requires a signed-in session, mixed page sizes).

## Known limitations

- The output is **raster** (images), not text: the PDF does not allow
  searching, selecting or copying text, and it is not accessible to screen
  readers.
- Sharpness depends on the viewer zoom level at the time of export. Increase
  the zoom before exporting if you want more resolution.
- It only covers the Drive/Docs PDF viewer, not native Google Docs/Sheets or
  other viewers.
- Google's DOM selectors can break without warning when Google updates its
  viewer. See `docs/selectors.md`.
- Long documents take time: the 194-page test took ~8m19s at balanced
  quality, because the viewer is scrolled and each page is encoded one by one.

## Install in developer mode

1. Clone this repository.
2. Open `chrome://extensions/` in Chrome.
3. Turn on "Modo de desarrollador" (Developer mode) in the top right.
4. Click "Cargar descomprimida" (Load unpacked) and select the repository
   folder (the one that contains `manifest.json`).
5. The extension icon will appear in the extensions bar.

## Usage

1. Open a document in the Drive viewer and wait for the first page to load.
2. Click the extension icon.
3. Adjust the file name and quality, and choose whether you want automatic
   scrolling.
4. Click "Exportar PDF" ("Export PDF") and wait for it to finish.
5. The PDF downloads to your usual downloads folder.

Use this extension only with documents you have legitimate access to,
respecting copyright and the terms under which you received the document.

## Privacy

The extension processes page images locally and does not send them to any
server: there is no analytics, telemetry or `storage.sync`. The full policy is
in `website/privacy.html`, with a Spanish version in
`website/es/privacy.html`. The bilingual site lives in `website/` and is
published by the `Deploy website` GitHub Actions workflow. The GitHub Pages
source is now set to GitHub Actions. Once that workflow runs on `main`, the site
will be at https://sandovaldavid.github.io/pdf-page-exporter/ (English) and
https://sandovaldavid.github.io/pdf-page-exporter/es/ (Spanish), and the
policies at https://sandovaldavid.github.io/pdf-page-exporter/privacy.html and
https://sandovaldavid.github.io/pdf-page-exporter/es/privacy.html. The workflow
has not run on `main` yet, so those URLs still show the previous version.

## Project structure

```
manifest.json              Manifest V3
src/popup/                 Popup UI (form, progress, result)
src/content/
  page-detector.js         Viewer selector cascade (the only place that knows them)
  capture.js               Auto-scroll, per-page capture and PDF assembly
src/background/
  service-worker.js        Progress relay + state persisted in storage.session
src/vendor/
  jspdf.umd.min.js         jsPDF 4.2.1, bundled (never loaded from a CDN)
src/styles/
  tokens.css               Design tokens from David Sandoval's Identity System (docs/design-system.md)
assets/fonts/
  inter-variable-latin.woff2          Variable font, bundled (never loaded from a CDN)
  jetbrains-mono-variable-latin.woff2 Variable font, bundled (never loaded from a CDN)
icons/                     icon.svg (source) + generated PNGs at 16/48/128px
scripts/
  generate-icons.sh        Rasterizes icons/icon.svg to the three sizes (requires ImageMagick)
  package-extension.sh     Builds the distribution/store ZIP
website/                   Public bilingual site (English at /, Spanish at /es/)
  index.html               English home page
  privacy.html             English privacy policy
  es/                      Spanish home page and policy
  site.css                 Styles shared by both languages
  assets/                  Site icon and web fonts
.github/workflows/pages.yml Publishes only website/ to GitHub Pages
.github/workflows/website-checks.yml Checks website/ on pull requests and uploads a preview
.github/scripts/check-website.py Link, fragment, language and no-script checks used by that workflow
docs/selectors.md          Verification status of the viewer selectors
docs/design-system.md      Source of truth for the visual identity
```

## Development

Regenerate icons after editing `icons/icon.svg`:

```bash
./scripts/generate-icons.sh
```

Update jsPDF: download the npm tarball (`registry.npmjs.org/jspdf`), verify
its `shasum` against the one published by the registry, and copy
`dist/jspdf.umd.min.js` to `src/vendor/`.

Package for distribution/store:

```bash
./scripts/package-extension.sh
```

Releases are automated with release-please. Merging the release PR it opens
bumps the version in `version.txt` and `manifest.json`, updates `CHANGELOG.md`
and creates the Git tag and GitHub release.

Check the website before touching `website/`:

```bash
python3 .github/scripts/check-website.py
```

It validates that every local link and fragment resolves, that each page
declares a language and a title, and that no page loads JavaScript. Pull
requests that touch `website/` run the same check and attach the site as a
`website-preview` artifact, which is the reviewable preview. There is no
per-branch Pages URL: the `github-pages` environment only allows `main`, and
deploying a branch would replace the live site.

## Tests

Already verified (see `docs/selectors.md` for details): page detection, order,
scrollable container, auto-scroll with real virtualization, and full export
against 4 real public documents (3, 7, 12 and 194 pages), including a
landscape PDF. The E2E suite covers 30 browser checks plus external
verification of the PDFs. What is missing before calling it fully tested:

1. A document that requires a signed-in Google session (everything tested so
   far used public/shared links). Blocked until a URL and a session are
   available.
2. A real document with mixed page sizes (no public mixed PDF was found; the
   pure landscape case is already verified).
3. Peak memory and determinism on long documents: the 194-page run did not
   crash and the tab stayed responsive, but RSS was not sampled throughout the
   capture and the run was not repeated.
4. Cross-origin iframe: not supported by design. The popup only activates if
   the top-level tab is `drive.google.com` or `docs.google.com`; widening the
   permissions would make store review worse.

## Design

The popup and progress overlay styles follow David Sandoval's personal
Identity System. See `docs/design-system.md` for the source of truth (colors,
typography, spacing). `src/styles/tokens.css` is the CSS implementation; no
component should use hardcoded colors outside that file.

The current icon is a generic glyph (document + download arrow) recolored to
the brand blue (`#0A5CD6`), **not** the official isotype/slash from the
Identity System: that logo is not embedded in `design-system.md` (only tokens
and references to Figma nodes), and recreating it by hand without the source
file risks an unapproved version of the personal brand. To use the real
isotype, export the approved assets from Figma (`Logo / Favicon`, section 16
of the design system) and replace `icons/icon.svg`.

## Third-party licenses

- `src/vendor/jspdf.umd.min.js` is jsPDF 4.2.1 (MIT), unmodified. The
  original license header is kept in the file itself.
- `assets/fonts/inter-variable-latin.woff2` is Inter (SIL Open Font License),
  variable, subset to Latin characters.
- `assets/fonts/jetbrains-mono-variable-latin.woff2` is JetBrains Mono (SIL
  Open Font License), variable, subset to Latin characters.

The full text of both licenses ships with the package in
`assets/fonts/OFL.txt`.
