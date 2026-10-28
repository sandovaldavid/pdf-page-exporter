# PDF Page Exporter design system

Specification for the interface of PDF Page Exporter, a public Manifest V3 Chrome extension. The extension exports the pages of a document that the Google Drive viewer has already rendered as a PDF. Processing stays in the browser.

This document defines the extension's own palette, typography, dimensions, icon and interface rules. It is a specification, not a collection of references to another brand.

## 1. Purpose and hierarchy

The document pages are the content. The popup exists to start, report and finish an export. It must not compete with the document for attention.

Interface order:

1. The document pages in the viewer.
2. The export action and its current state.
3. The filename, quality and automatic scrolling controls.
4. Progress and result feedback.
5. The extension icon at browser scale.
6. Decorative and editorial assets.

Rules:

- The popup stays quiet and legible at 320 px wide.
- One primary action per state.
- Neutral surfaces keep the interface from adding a color cast to the document.
- No element suggests a capability the extension does not have.

## 2. Principles

| Principle | What it means here |
| --- | --- |
| CLARITY | The popup shows one state at a time: no document, ready, exporting, done or error. Each state has one primary action or none. |
| PRECISION | Labels, page counts and progress describe the document and the exported file. No invented page count and no quality claim the capture cannot meet. |
| TRUST | Processing stays in the browser, progress is honest, and a failure never looks like a success. |

The footer states: "Todo el procesamiento ocurre en tu navegador. No se envía ningún dato." (All processing happens in your browser. No data is sent.)

## 3. Popup states

| State | What the popup shows | Primary action |
| --- | --- | --- |
| No document | "Abre un documento en el visor de Google Drive y vuelve a abrir esta ventana." (Open a document in the Google Drive viewer and open this window again.) | None |
| Ready | Filename, quality, automatic scrolling and the footer. | "Exportar PDF" (Export PDF) |
| Exporting | Progress bar and status line. The form is hidden. | None |
| Done | Success result and the reset action. | "Exportar otro PDF" (Export another PDF) |
| Error | Error result and the reset action. | "Exportar otro PDF" (Export another PDF) |

The ready form labels are "Nombre del archivo" (File name), "Calidad" (Quality) and "Recorrer el documento automáticamente" (Scroll through the document automatically).

## 4. Source of truth and scope

This document is the specification for the design system. `src/styles/tokens.css` is the CSS implementation. Change the specification and the stylesheet together; do not treat a component stylesheet as a third source.

`docs/selectors.md` is separate evidence about the Google viewer selectors. It is not part of this document and does not define visual rules.

In scope:

- The popup at 320 px wide.
- The progress overlay that the content script draws over the viewer.
- The extension icon at 16, 48 and 128 px.
- The token definitions, typography, dimensions and accessibility rules used by the popup and product pages.

Out of scope:

- The rendered pages inside the Google viewer.
- The appearance of the exported PDF beyond the captured page images.
- The Chrome Web Store listing and the text of the public website.

## 5. Palette and product reasoning

The palette is the extension's official palette. Provenance: the palette started from the author's identity system and is maintained here as the extension's own tokens.

The palette has one job: keep the document readable while making the export action unmistakable.

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Canvas | background/default | #F5F8FC | #020408 |
| Popup surface | surface/default | #FFFFFF | #0A0D14 |
| Primary action | brand/primary/500 | #0A5CD6 | #00B0FF |
| Primary hover | brand/primary/600 | #0044CC | #0080FF |
| Body text | content/default | #334155 | #CBD5E1 |
| Secondary text | content/muted | #475569 | #94A3B8 |
| Headings and input values | content/strong | #0F172A | #F1F5F9 |
| Borders | edge/subtle | #CBD5E1 | #1E293B |
| Hint and progress track | surface/highlight | #E8EEF9 | #141B29 |
| Success text | status/success/text | #065F46 | #34D399 |

- Neutral surfaces. `background/default` and `surface/default` keep the popup neutral so the exported pages are read without a color cast. The popup uses `surface/default` so controls sit on a quiet field.
- One saturated blue. `brand/primary/500` is the only saturated hue used for action. It appears on the export button, the progress fill and the focus ring. `brand/primary/600` is the hover state. Blue is not used for headings, borders or decoration. Green and red are reserved for status.
- Muted metadata. `content/muted` carries field labels, the hint, the progress status and the footer. It is the second text level, never the reading level.
- Reading text. `content/strong` carries the popup heading and input values. `content/default` carries the checkbox and body text.
- Status. Success uses the `status/success/*` trio. Error uses `color/error/500` #FF1744 in both themes, mixed to 8% for the background and 40% for the border. The result text stays in the error color.

At 320 px wide the popup uses text from 11 px to 16 px, with most labels at 12 px and 14 px. Text below 24 px regular or 18.66 px bold must reach 4.5:1 against its surface. Large text, control boundaries and the focus ring must reach 3:1. Status is carried by text as well as color.

## 6. Font families

| Token | Family | Role |
| --- | --- | --- |
| font/family/body | Inter | Primary reading and interface text. |
| font/family/heading | JetBrains Mono | Headings and primary action labels. |
| font/family/code | JetBrains Mono | Code and technical content. |
| font/family/legacy-code | Fira Code | Legacy code face. Kept for compatibility; not bundled and not used in the popup. |
| font/family/editorial | Silkscreen | Short decorative labels. Not bundled and not used in the popup. |

### Font implementation in the Chrome Extension

To remove external dependencies, simplify CSP and improve offline reliability, package approved webfont files inside the extension and declare them with `@font-face`. Keep fallbacks:

```css
--font-body: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-heading: "JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, monospace;
--font-editorial: "Silkscreen", "JetBrains Mono", monospace;
--font-technical: "JetBrains Mono", ui-monospace, monospace;
```

`assets/fonts/` contains Inter and JetBrains Mono variable woff2 files. The extension loads no font from the network.

## 7. Typography foundations

| Token | Value |
| --- | --- |
| font/family/body | Inter |
| font/family/code | JetBrains Mono |
| font/family/editorial | Silkscreen |
| font/family/heading | JetBrains Mono |
| font/family/legacy-code | Fira Code |
| font/line-height/body | 26 px |
| font/line-height/caption | 18 px |
| font/line-height/display | 80 px |
| font/line-height/page-title | 56 px |
| font/line-height/secondary | 22 px |
| font/line-height/section | 38 px |
| font/line-height/subheading | 28 px |
| font/size/body | 16 px |
| font/size/caption | 12 px |
| font/size/display | 72 px |
| font/size/page-title | 48 px |
| font/size/secondary | 14 px |
| font/size/section | 30 px |
| font/size/subheading | 20 px |
| font/tracking/body | 0 px |
| font/tracking/caption | 0.2 px |
| font/tracking/display | -2 px |
| font/tracking/label | 0.5 px |
| font/tracking/section | -0.5 px |
| font/tracking/technical | 1 px |
| font/tracking/title | -1 px |

## 8. Text styles

| Style | Family | Weight | Size | Line height | Tracking | Case | Usage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Code / Body | Fira Code | Regular | 14px | 22px | 0px | Original | Code snippets and technical annotations. |
| Editorial / Label | Silkscreen | Bold | 14px | 22px | 0.5px | Uppercase | Short badges and decorative labels. Not used in the popup. |
| Web / Body | Inter | Regular | 16px | 26px | 0px | Original | Primary reading text; never smaller than 16 px. |
| Web / Caption | Inter | Medium | 12px | 18px | 0.2px | Original | Labels and captions; absolute 12 px floor. |
| Web / Display | JetBrains Mono | Bold | 72px | 80px | -2px | Original | Landing page h1 only; desktop display role. |
| Web / Page Title | JetBrains Mono | Bold | 48px | 56px | -1px | Original | Top heading of internal pages. |
| Web / Secondary | Inter | Regular | 14px | 22px | 0px | Original | Metadata, navigation and dense functional text. |
| Web / Section Heading | JetBrains Mono | Bold | 30px | 38px | -0.5px | Original | Primary h2 section heading. |
| Web / Subheading | JetBrains Mono | Medium | 20px | 28px | 0px | Original | Card and panel titles. |

## 9. Primitive colors

Canonical color values are expressed in `oklch()`. The tables also keep an sRGB Hex reference. In production, prefer OKLCH and keep Hex as a fallback or interoperability reference.

Alpha values use 8-digit Hex in `#RRGGBBAA` format.

| Token | Canonical OKLCH | sRGB reference |
| --- | --- | --- |
| alpha/primary-400/60-dark | oklch(81.362% 0.14541 217.11 / 60%) | #00D8FF99 |
| alpha/primary-500/05-light | oklch(50.992% 0.20091 260.06 / 5%) | #0A5CD60D |
| alpha/primary-500/06-light | oklch(50.992% 0.20091 260.06 / 6%) | #0A5CD60F |
| alpha/primary-500/10-dark | oklch(72.084% 0.16317 239.29 / 10%) | #00B0FF1A |
| alpha/primary-500/10-light | oklch(50.992% 0.20091 260.06 / 10%) | #0A5CD61A |
| alpha/primary-500/14-dark | oklch(72.084% 0.16317 239.29 / 14%) | #00B0FF24 |
| alpha/primary-500/15-dark | oklch(72.084% 0.16317 239.29 / 15%) | #00B0FF26 |
| alpha/primary-500/20-light | oklch(50.992% 0.20091 260.06 / 20%) | #0A5CD633 |
| alpha/primary-500/25-dark | oklch(72.084% 0.16317 239.29 / 25%) | #00B0FF40 |
| alpha/primary-500/35-dark | oklch(72.084% 0.16317 239.29 / 35%) | #00B0FF59 |
| alpha/primary-500/40-dark | oklch(72.084% 0.16317 239.29 / 40%) | #00B0FF66 |
| alpha/primary-600/40-light | oklch(45.378% 0.21747 262.45 / 40%) | #0044CC66 |
| alpha/primary-600/60-light | oklch(45.378% 0.21747 262.45 / 60%) | #0044CC99 |
| alpha/success/05-light | oklch(69.587% 0.14907 162.48 / 5%) | #10B9810D |
| alpha/success/10-dark | oklch(69.587% 0.14907 162.48 / 10%) | #10B9811A |
| alpha/success/40-light | oklch(69.587% 0.14907 162.48 / 40%) | #10B98166 |
| alpha/success/60-dark | oklch(69.587% 0.14907 162.48 / 60%) | #10B98199 |
| color/base/background-light | oklch(97.799% 0.00622 255.47) | #F5F8FC |
| color/base/content-strong-dark | oklch(96.826% 0.00685 247.90) | #F1F5F9 |
| color/base/status-success-text-dark | oklch(77.294% 0.15349 163.22) | #34D399 |
| color/base/status-success-text-light | oklch(43.180% 0.08647 166.91) | #065F46 |
| color/base/surface-dark | oklch(15.939% 0.01573 266.59) | #0A0D14 |
| color/base/surface-highlight-dark | oklch(22.235% 0.02948 263.69) | #141B29 |
| color/base/surface-highlight-light | oklch(94.778% 0.01616 262.75) | #E8EEF9 |
| color/base/white | oklch(100.000% 0.00000 0.00) | #FFFFFF |
| color/error/500 | oklch(63.747% 0.24894 20.73) | #FF1744 |
| color/error/900 | oklch(50.164% 0.18868 27.48) | #B71C1C |
| color/neutral/50 | oklch(98.817% 0.00411 271.37) | #FAFBFE |
| color/neutral/100 | oklch(95.938% 0.01081 256.70) | #EDF2F9 |
| color/neutral/200 | oklch(92.876% 0.01262 255.51) | #E2E8F0 |
| color/neutral/300 | oklch(86.898% 0.01985 252.89) | #CBD5E1 |
| color/neutral/400 | oklch(71.067% 0.03511 256.79) | #94A3B8 |
| color/neutral/500 | oklch(55.439% 0.04072 257.42) | #64748B |
| color/neutral/600 | oklch(44.553% 0.03745 257.28) | #475569 |
| color/neutral/700 | oklch(37.170% 0.03916 257.29) | #334155 |
| color/neutral/800 | oklch(27.950% 0.03685 260.03) | #1E293B |
| color/neutral/900 | oklch(20.768% 0.03982 265.75) | #0F172A |
| color/neutral/950 | oklch(10.543% 0.01489 255.89) | #020408 |
| color/primary/50 | oklch(97.318% 0.01305 251.56) | #F0F7FF |
| color/primary/100 | oklch(94.544% 0.02585 248.10) | #E0EFFE |
| color/primary/200 | oklch(88.896% 0.05659 241.17) | #BAE0FD |
| color/primary/300 | oklch(80.049% 0.10523 240.14) | #7CC7FB |
| color/primary/400-light | oklch(62.308% 0.18801 259.81) | #3B82F6 |
| color/primary/400-dark | oklch(81.362% 0.14541 217.11) | #00D8FF |
| color/primary/500-light | oklch(50.992% 0.20091 260.06) | #0A5CD6 |
| color/primary/500-dark | oklch(72.084% 0.16317 239.29) | #00B0FF |
| color/primary/600-light | oklch(45.378% 0.21747 262.45) | #0044CC |
| color/primary/600-dark | oklch(61.517% 0.21082 256.10) | #0080FF |
| color/primary/700 | oklch(48.820% 0.21717 264.38) | #1D4ED8 |
| color/primary/800 | oklch(42.445% 0.18087 265.64) | #1E40AF |
| color/primary/900 | oklch(37.906% 0.13776 265.52) | #1E3A8A |
| color/primary/950 | oklch(28.226% 0.08745 267.94) | #172554 |
| color/retro/phosphor | oklch(87.628% 0.22779 152.55) | #00FF88 |
| color/success/500 | oklch(80.987% 0.21415 151.77) | #00E676 |
| color/success/900 | oklch(42.539% 0.11588 144.31) | #1B5E20 |
| color/warning/500 | oklch(84.417% 0.17216 84.93) | #FFC107 |
| color/warning/900 | oklch(70.757% 0.19745 46.46) | #FF6F00 |

`color/retro/phosphor` is a reserved primitive. No semantic token in this repository resolves to it.

## 10. Semantic colors

Consume these tokens in components. Do not use primitives directly except when defining aliases.

| Semantic token | Light | Dark |
| --- | --- | --- |
| background/default | #F5F8FC | #020408 |
| badge/brand/background | #0A5CD61A | #00B0FF26 |
| badge/brand/background-hover | #0A5CD633 | #00B0FF40 |
| badge/brand/outline-border | #0044CC66 | #00B0FF66 |
| badge/brand/outline-hover | #0A5CD61A | #00B0FF1A |
| badge/brand/text | #0044CC | #00D8FF |
| banner/border | #0044CC99 | #00D8FF99 |
| banner/text | #0044CC | #00D8FF |
| brand/primary/400 | #3B82F6 | #00D8FF |
| brand/primary/500 | #0A5CD6 | #00B0FF |
| brand/primary/600 | #0044CC | #0080FF |
| content/default | #334155 | #CBD5E1 |
| content/muted | #475569 | #94A3B8 |
| content/strong | #0F172A | #F1F5F9 |
| edge/strong | #0F172A | #CBD5E1 |
| edge/subtle | #CBD5E1 | #1E293B |
| status/success/background | #10B9810D | #10B9811A |
| status/success/border | #10B98166 | #10B98199 |
| status/success/text | #065F46 | #34D399 |
| surface/default | #FFFFFF | #0A0D14 |
| surface/highlight | #E8EEF9 | #141B29 |

## 11. Dimensions

All dimensions are pixels unless another unit is stated.

| Primitive token | Value |
| --- | --- |
| radius/full | 999px |
| radius/lg | 16px |
| radius/md | 12px |
| radius/none | 0px |
| radius/sm | 8px |
| radius/xl | 24px |
| radius/xs | 4px |
| shadow/offset/2xl | 6px |
| shadow/offset/3xl | 8px |
| shadow/offset/lg | 4px |
| shadow/offset/md | 3px |
| shadow/offset/sm | 1.5px |
| shadow/offset/xl | 5px |
| shadow/offset/xs | 1px |
| size/icon/16 | 16px |
| size/icon/24 | 24px |
| size/icon/32 | 32px |
| size/icon/48 | 48px |
| size/icon/64 | 64px |
| space/1 | 4px |
| space/2 | 8px |
| space/3 | 12px |
| space/4 | 16px |
| space/5 | 20px |
| space/6 | 24px |
| space/8 | 32px |
| space/10 | 40px |
| space/12 | 48px |
| space/16 | 64px |
| space/20 | 80px |
| space/24 | 96px |
| stroke/emphasis | 3px |
| stroke/hairline | 1px |
| stroke/standard | 2px |

No current popup surface uses a shadow. The shadow offset tokens remain part of the scale.

## 12. Semantic spacing

| Token | Alias | Resolved |
| --- | --- | --- |
| gap/comfortable | space/6 | 24 px |
| gap/compact | space/2 | 8 px |
| gap/default | space/4 | 16 px |
| gap/micro | space/1 | 4 px |
| gap/page | space/24 | 96 px |
| gap/section | space/12 | 48 px |
| inset/card | space/6 | 24 px |
| inset/control-x | space/4 | 16 px |
| inset/control-y | space/3 | 12 px |
| inset/panel | space/8 | 32 px |

## 13. Semantic radius

| Token | Alias | Resolved |
| --- | --- | --- |
| radius/card | radius/md | 12 px |
| radius/circular | radius/full | 999 px |
| radius/control | radius/sm | 8 px |
| radius/large | radius/xl | 24 px |
| radius/panel | radius/lg | 16 px |

## 14. Extension icon

The icon source is `icons/icon.svg`. It is a 128 by 128 canvas with `viewBox="0 0 128 128"`. Chrome receives the raster exports listed below, not the SVG.

| Element | Geometry | Fill or stroke |
| --- | --- | --- |
| Background | Rounded square, 128 by 128, corner radius 28. The corners outside the radius are transparent. | fill #0a5cd6 |
| Page | Closed path through (40,30), (74,30), (92,48), (92,98) and (40,98). Bounding box 52 by 68. | fill #ffffff |
| Fold | Triangle through (74,30), (74,48) and (92,48). The corner square is 18 by 18. | fill #bae0fd |
| Arrow | Shaft from (66,60) to (66,84). Head to (54,72) and (78,72). Stroke width 7, round caps and joins. The arrow uses the background color and reads as a cutout in the page. | stroke #0a5cd6 |

The icon uses only the Light primary 500 value, the white page and the primary 200 fold. It has no separate dark variant. At 16 px the 7 px stroke scales to 0.875 px before rasterization, so the smallest icon relies on antialiasing.

| Icon color | Hex in SVG | Token |
| --- | --- | --- |
| Background and arrow | #0a5cd6 | color/primary/500-light |
| Page | #ffffff | color/base/white |
| Fold | #bae0fd | color/primary/200 |

### Export mapping

| Size | File | Manifest key |
| --- | --- | --- |
| 16 px | icons/icon-16.png | icons.16 and action.default_icon.16 |
| 48 px | icons/icon-48.png | icons.48 and action.default_icon.48 |
| 128 px | icons/icon-128.png | icons.128 and action.default_icon.128 |

`scripts/generate-icons.sh` rasterizes the SVG with ImageMagick to the three files. Do not edit the PNGs by hand. Regenerate them after any SVG change. The manifest declares no 32 px or 64 px icon.

## 15. Export sizes and Chrome icon mapping

| Token | Size |
| --- | --- |
| a4-300dpi/height | 3508 px |
| a4-300dpi/width | 2480 px |
| app-icon/1024 | 1024 px |
| app-icon/128 | 128 px |
| app-icon/256 | 256 px |
| app-icon/512 | 512 px |
| favicon/16 | 16 px |
| favicon/32 | 32 px |
| favicon/48 | 48 px |
| favicon/64 | 64 px |

Only the sizes in the Chrome Extension icon mapping are declared in `manifest.json`. The other rows are export references for product assets.

### Chrome Extension icon mapping

For Manifest V3, the official Chrome documentation recommends declaring square raster icons of `16`, `32`, `48` and `128` px. `128` is used during installation and in the Chrome Web Store; `48` is used in `chrome://extensions`; `16` can work as the favicon for extension pages. PNG is the recommended format and SVG or WebP icons are not supported in the manifest. Use independent masters, not scaled from another raster:

```json
{
  "icons": {
    "16": "assets/icons/icon-16.png",
    "32": "assets/icons/icon-32.png",
    "48": "assets/icons/icon-48.png",
    "64": "assets/icons/icon-64.png",
    "128": "assets/icons/icon-128.png"
  },
  "action": {
    "default_icon": {
      "16": "assets/icons/icon-16.png",
      "32": "assets/icons/icon-32.png"
    }
  }
}
```

The repository ships `16`, `48` and `128` only. `manifest.json` declares those three sizes in both `icons` and `action.default_icon`. It does not declare `32` or `64`. `scripts/generate-icons.sh` rasterizes `icons/icon.svg` to `icons/icon-16.png`, `icons/icon-48.png` and `icons/icon-128.png`. The `32` and `64` entries in the example above are the general Chrome recommendation, not files in this repository.

## 16. CSS starter for the extension

### Primitives and semantic aliases

```css
:root {
  color-scheme: light dark;

  /* Font families */
  --ds-font-body: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --ds-font-heading: "JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, monospace;
  --ds-font-technical: "JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, monospace;
  --ds-font-editorial: "Silkscreen", "JetBrains Mono", monospace;

  /* Light primitives: Hex fallback followed by canonical OKLCH */
  --ds-primary-400: #3b82f6;
  --ds-primary-400: oklch(62.308% 0.18801 259.81);
  --ds-primary-500: #0a5cd6;
  --ds-primary-500: oklch(50.992% 0.20091 260.06);
  --ds-primary-600: #0044cc;
  --ds-primary-600: oklch(45.378% 0.21747 262.45);

  --ds-background: #f5f8fc;
  --ds-surface: #ffffff;
  --ds-surface-highlight: #e8eef9;
  --ds-content-strong: #0f172a;
  --ds-content: #334155;
  --ds-content-muted: #475569;
  --ds-edge: #cbd5e1;

  /* Component aliases */
  --ds-accent: var(--ds-primary-500);
  --ds-accent-bright: var(--ds-primary-400);
  --ds-control-radius: 8px;
  --ds-card-radius: 12px;
  --ds-panel-radius: 16px;
  --ds-card-padding: 24px;
  --ds-control-padding-x: 16px;
  --ds-control-padding-y: 12px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --ds-primary-400: #00d8ff;
    --ds-primary-400: oklch(81.362% 0.14541 217.11);
    --ds-primary-500: #00b0ff;
    --ds-primary-500: oklch(72.084% 0.16317 239.29);
    --ds-primary-600: #0080ff;
    --ds-primary-600: oklch(61.517% 0.21082 256.10);

    --ds-background: #020408;
    --ds-surface: #0a0d14;
    --ds-surface-highlight: #141b29;
    --ds-content-strong: #f1f5f9;
    --ds-content: #cbd5e1;
    --ds-content-muted: #94a3b8;
    --ds-edge: #1e293b;
  }
}

html,
body {
  background: var(--ds-background);
  color: var(--ds-content);
  font-family: var(--ds-font-body);
}

h1,
h2,
h3 {
  color: var(--ds-content-strong);
  font-family: var(--ds-font-heading);
}

button,
input,
select,
textarea {
  border: 1px solid var(--ds-edge);
  border-radius: var(--ds-control-radius);
}

button[data-variant="primary"] {
  background: var(--ds-accent);
  color: #ffffff;
}
```

`src/styles/tokens.css` is the implementation. The starter above shows the primitive and semantic shape; the stylesheet adds the success and error aliases used by the popup.

### Explicit application theme override

When the extension allows selecting a theme independently of the operating system:

```css
:root[data-theme="light"] {
  color-scheme: light;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  /* Repeat or import the Dark aliases block. */
}
```

## 17. Accessibility and implementation constraints

- The popup body is 320 px wide. Text and controls must remain legible at that width without horizontal scrolling.
- Validate contrast ratios in Light and Dark before publishing.
- Text below 24 px regular or 18.66 px bold must reach 4.5:1 against its surface. Large text and UI boundaries must reach 3:1.
- `Web / Body` has a floor of `16 px`.
- `Web / Caption` has an absolute floor of `12 px`.
- Do not use `Silkscreen` for long-form reading.
- Status is carried by text as well as color. Do not rely on color alone.
- Focus is a 2 px outline with a 1 px offset.
- Use semantic tokens inside components; primitives only in definitions.
- Avoid hardcoded colors outside the central token file.
- `src/content/capture.js` draws the progress overlay inside the viewer page, where the extension token variables are not defined. It repeats the literal token values and must change with them.
- Respect `prefers-reduced-motion` when implementing progress, transitions or any future motion rule.
- The popup follows `prefers-color-scheme`. The `data-theme` override exists in the token file but no control exposes it.
- The progress track uses `role="progressbar"` with `aria-valuemin`, `aria-valuemax` and `aria-valuenow`. The status line uses `aria-live="polite"`.

## 18. Token architecture

`src/styles/tokens.css` is the only token file in the current build. It contains the primitives, the semantic aliases, the light default and the dark override. The popup loads it before `popup.css`.

Dependency direction:

1. Primitives.
2. Semantic aliases.
3. Component aliases.
4. UI components.

Each layer consumes only the layer above it. Components use semantic or component aliases, never primitives.

If the token file is split, keep this layout:

```text
src/
├── styles/
│   ├── tokens.primitives.css
│   ├── tokens.semantic.css
│   ├── theme.light.css
│   ├── theme.dark.css
│   ├── typography.css
│   └── components.css
├── assets/
│   ├── fonts/
│   └── icons/
└── manifest.json
```

## 19. Implementation status

Confirmed in this repository:

- Manifest V3, minimum Chrome 111.
- Popup body width fixed at 320 px.
- Light and dark values selected by `prefers-color-scheme`.
- `src/styles/tokens.css` implements the primitives and semantic aliases used by the popup.
- Inter and JetBrains Mono are bundled in `assets/fonts/`; no font loads from the network.
- `icons/icon.svg` is the icon source; `icons/icon-16.png`, `icons/icon-48.png` and `icons/icon-128.png` are generated from it.
- `manifest.json` declares the three icon sizes for `icons` and `action.default_icon`.

Not present:

- A dark icon variant.
- A visible theme selector. The `data-theme` override exists but is unused.
- 32 px and 64 px icon files.
- A text-based or accessible PDF. Exported pages are raster images, so the PDF cannot be searched, selected or read by screen readers.

## 20. Source responsibility

- `docs/design-system.md`: specification, measured values and product rules.
- `src/styles/tokens.css`: CSS implementation of the tokens.
- `src/popup/popup.html`, `src/popup/popup.css` and `src/popup/popup.js`: popup markup, styles and state behavior.
- `icons/icon.svg`: icon source. `scripts/generate-icons.sh`: PNG generation. `manifest.json`: declared icon sizes.
- `docs/selectors.md`: separate evidence about viewer selectors. It is not part of this document and does not define visual rules.

## 21. Official Chrome Extension references

- [Manifest — Icons](https://developer.chrome.com/docs/extensions/reference/manifest/icons)
- [Configure extension icons](https://developer.chrome.com/docs/extensions/develop/ui/configure-icons)
- [Manifest file format](https://developer.chrome.com/docs/extensions/reference/manifest)
- [Manifest — Content Security Policy](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy)
- [Manifest version](https://developer.chrome.com/docs/extensions/reference/manifest/manifest-version)
