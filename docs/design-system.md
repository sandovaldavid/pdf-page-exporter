# David Sandoval — Identity System

> Snapshot técnico extraído del archivo de Figma **Identity System** el 2026-07-27.  
> Figma file key: `sHPP8DGCfZ370Oc2oKGNPH`  
> Versión visible en portada: `v1.0` · actualización indicada en Figma: `2026-07-26`.

## 1. Propósito y jerarquía

David Sandoval es la marca. El rostro, nombre, voz, trabajo y evidencia profesional tienen prioridad sobre el logotipo y cualquier recurso editorial.

Orden de identidad:

1. David Sandoval como persona.
2. David como Software Engineer.
3. Trabajo y evidencia profesional.
4. Voz, valores y aprendizaje.
5. Nombre y logotipo.
6. Sistema visual.
7. Recursos editoriales secundarios.

Principios expresados en la portada:

- `CLARITY`
- `PRECISION`
- `TRUST`
- Human-first identity.
- El retrato real es la identidad primaria.
- El isotype es una firma secundaria de apoyo.

## 2. Recomendación para la Chrome Extension

Usa como base el tema **Professional / Light + Dark** o **Link Hub / Light + Dark**:

- Headings: `JetBrains Mono`.
- Body: `Inter`.
- Technical text: `JetBrains Mono`.
- Primary blue: `#0A5CD6` en Light y `#00B0FF` en Dark.
- Canvas: `#F5F8FC` en Light y `#020408` en Dark.
- Surface: `#FFFFFF` en Light y `#0A0D14` en Dark.
- Avoid convertir la extensión en una estética gamer, hacker o cyberpunk.
- Las fuentes retro (`Press Start 2P`, `VT323`, `Share Tech Mono`) pertenecen al **Portfolio Retro theme** y no deben utilizarse como identidad general salvo que la extensión esté directamente vinculada al portfolio.

## 3. Font families

| Token | Family | Rol |
| --- | --- | --- |
| font/family/body | Inter | Lectura principal y UI profesional. |
| font/family/heading | JetBrains Mono | Headings y títulos técnicos. |
| font/family/code | JetBrains Mono | Código y contenido técnico actual. |
| font/family/legacy-code | Fira Code | Estilo local `Code / Body`; mantener por compatibilidad hasta migración explícita. |
| font/family/editorial | Silkscreen | Labels decorativos y kickers; uso limitado. |
| font/family/theme/portfolio/display | Press Start 2P | Display retro exclusivo del portfolio. |
| font/family/theme/portfolio/technical-mono | Share Tech Mono | Metadata técnica del portfolio. |
| font/family/theme/portfolio/terminal | VT323 | Terminal/HUD del portfolio. |

### Implementación de fonts en Chrome Extension

Para eliminar dependencias externas, simplificar CSP y mejorar confiabilidad offline, empaqueta archivos webfont autorizados dentro de la extensión y decláralos mediante `@font-face`. Mantén fallbacks:

```css
--font-body: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-heading: "JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, monospace;
--font-editorial: "Silkscreen", "JetBrains Mono", monospace;
--font-technical: "JetBrains Mono", ui-monospace, monospace;
```

## 4. Typography foundations

| Token | Value |
| --- | --- |
| font/family/body | Inter |
| font/family/code | JetBrains Mono |
| font/family/editorial | Silkscreen |
| font/family/heading | JetBrains Mono |
| font/family/legacy-code | Fira Code |
| font/family/theme/portfolio/display | Press Start 2P |
| font/family/theme/portfolio/technical-mono | Share Tech Mono |
| font/family/theme/portfolio/terminal | VT323 |
| font/line-height/body | 26 px |
| font/line-height/caption | 18 px |
| font/line-height/display | 80 px |
| font/line-height/lockup | 56 px |
| font/line-height/lockup-technical | 40 px |
| font/line-height/page-title | 56 px |
| font/line-height/retro-display | 50 px |
| font/line-height/retro-heading | 32 px |
| font/line-height/secondary | 22 px |
| font/line-height/section | 38 px |
| font/line-height/subheading | 28 px |
| font/line-height/terminal | 28 px |
| font/size/body | 16 px |
| font/size/caption | 12 px |
| font/size/display | 72 px |
| font/size/lockup | 48 px |
| font/size/lockup-technical | 32 px |
| font/size/page-title | 48 px |
| font/size/retro-display | 36 px |
| font/size/secondary | 14 px |
| font/size/section | 30 px |
| font/size/subheading | 20 px |
| font/size/terminal | 20 px |
| font/tracking/body | 0 px |
| font/tracking/caption | 0.2 px |
| font/tracking/display | -2 px |
| font/tracking/label | 0.5 px |
| font/tracking/section | -0.5 px |
| font/tracking/technical | 1 px |
| font/tracking/title | -1 px |

## 5. Public and channel text styles

| Style | Family | Weight | Size | Line height | Tracking | Case | Usage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Brand / Lockup Name | JetBrains Mono | Regular | 48px | 56px | -1px | Original | Primary David Sandoval wordmark lockup. |
| Brand / Lockup Technical | Share Tech Mono | Regular | 32px | 40px | 1px | Original | Technical lockup and developer handle. |
| Code / Body | Fira Code | Regular | 14px | 22px | 0px | Original | Code snippets and technical annotations. |
| Editorial / Label | Silkscreen | Bold | 14px | 22px | 0.5px | Uppercase | Badges and decorative technical labels. |
| Theme / Portfolio Retro / Display | Press Start 2P | Regular | 36px | 50px | 0px | Uppercase | Major pixel-led display moments; portfolio scope only. |
| Theme / Portfolio Retro / Heading | Press Start 2P | Regular | 20px | 32px | 0px | Uppercase | Compact pixel headings; avoid dense long-form use. |
| Theme / Portfolio Retro / Technical Label | Share Tech Mono | Regular | 14px | 22px | 1px | Uppercase | Technical labels and developer-facing metadata. |
| Theme / Portfolio Retro / Terminal Reading | VT323 | Regular | 20px | 28px | 0.5px | Original | Terminal/HUD reading; apply +1 semantic size compensation. |
| Web / Body | Inter | Regular | 16px | 26px | 0px | Original | Primary reading text; never smaller than 16 px. |
| Web / Caption | Inter | Medium | 12px | 18px | 0.2px | Original | Labels and captions; absolute 12 px floor. |
| Web / Display | JetBrains Mono | Bold | 72px | 80px | -2px | Original | Hero h1 only; desktop display role. |
| Web / Page Title | JetBrains Mono | Bold | 48px | 56px | -1px | Original | Top heading of internal pages. |
| Web / Secondary | Inter | Regular | 14px | 22px | 0px | Original | Metadata, navigation and dense functional text. |
| Web / Section Heading | JetBrains Mono | Bold | 30px | 38px | -0.5px | Original | Primary h2 section heading. |
| Web / Subheading | JetBrains Mono | Medium | 20px | 28px | 0px | Original | Card and panel titles. |

## 6. Internal documentation text styles

Estos estilos pertenecen a la documentación del Identity System. No deben convertirse automáticamente en estilos públicos de la extensión.

| Style | Family | Weight | Size | Line height | Tracking | Case | Usage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Documentation / Arrow | JetBrains Mono | Bold | 14px | 22px | 0px | Original | Directional marker in documentation lists. |
| Documentation / Card Title | JetBrains Mono | Medium | 16px | 24px | 0px | Original | Compact documentation card title. |
| Documentation / Channel Sample / Link | JetBrains Mono | Medium | 14px | 22px | 0px | Original | Link Hub action specimen. |
| Documentation / Channel Sample / Name | JetBrains Mono | Bold | 22px | 30px | 0px | Original | Link Hub name specimen. |
| Documentation / Channel Sample / Professional Name | JetBrains Mono | Medium | 24px | 32px | 0px | Original | Professional Neutral name specimen. |
| Documentation / Channel Sample / Professional Role | Inter | Medium | 15px | 22px | 0px | Original | Professional Neutral role specimen. |
| Documentation / Channel Sample / Retro Display | Press Start 2P | Regular | 13px | 24px | 0px | Original | Documentation specimen only. |
| Documentation / Channel Sample / Technical Meta | Share Tech Mono | Regular | 14px | 20px | 0px | Original | Technical metadata specimen. |
| Documentation / Channel Sample / Terminal | VT323 | Regular | 25px | 30px | 0px | Original | Terminal specimen scale. |
| Documentation / Compact Body | Inter | Regular | 13px | 20px | 0px | Original | Compact documentation copy; not a public body style. |
| Documentation / Emphasis | Inter | Medium | 14px | 22px | 0px | Original | Emphasized documentation metadata. |
| Documentation / Handoff | Share Tech Mono | Regular | 16px | 24px | 0px | Original | Implementation handoff references. |
| Documentation / Identity Name | JetBrains Mono | Medium | 28px | 36px | 0px | Original | Name inside Identity / Person Lockup. |
| Documentation / Identity Role | Inter | Medium | 16px | 24px | 0px | Original | Professional role inside Identity / Person Lockup. |
| Documentation / Introduction | Inter | Regular | 18px | 30px | 0px | Original | Documentation introduction and lead copy. |
| Documentation / Kicker Compact | Silkscreen | Bold | 12px | 18px | 0.8px | Uppercase | Internal compact kickers and status labels. |
| Documentation / Mono Body | JetBrains Mono | Regular | 14px | 22px | 0px | Original | Modes, aliases and implementation references. |
| Documentation / Note | Inter | Regular | 15px | 24px | 0px | Original | Long-form note or governance statement. |
| Documentation / Page Title | JetBrains Mono | Bold | 48px | 58px | 0px | Original | Identity System documentation page title. |
| Documentation / Principle Statement | JetBrains Mono | Medium | 24px | 34px | 0px | Original | Closing principle statement. |
| Documentation / Rule | JetBrains Mono | Medium | 18px | 26px | 0px | Original | Short rules and channel-policy decisions. |
| Documentation / Section Lead | JetBrains Mono | Medium | 28px | 38px | 0px | Original | Section lead below Web / Section Heading strength. |
| Documentation / Section Title | JetBrains Mono | Medium | 26px | 36px | 0px | Original | Documentation section title. |
| Documentation / Source Title | JetBrains Mono | Medium | 22px | 30px | 0px | Original | Source assets and documented examples. |
| Documentation / Step Number | JetBrains Mono | Bold | 28px | 34px | 0px | Original | Architecture-diagram step number. |
| Documentation / Table Emphasis | JetBrains Mono | Medium | 13px | 20px | 0px | Original | Emphasized matrix value. |
| Documentation / Table Header | JetBrains Mono | Bold | 13px | 20px | 0px | Original | Compact matrix header. |
| Documentation / Theme Title | JetBrains Mono | Bold | 28px | 36px | 0px | Original | Channel theme title. |
| Documentation / Token Label | Inter | Medium | 12px | 16px | 0px | Original | Token swatch label. |
| Documentation / Token Path | JetBrains Mono | Regular | 13px | 20px | 0px | Original | Token path and code reference. |
| Documentation / Token Value | JetBrains Mono | Regular | 12px | 16px | 0px | Original | Compact token value. |

## 7. Primitive colors

La autoría canónica de color está expresada en `oklch()`. Figma conserva una representación sRGB equivalente. En producción, prioriza OKLCH y conserva Hex como fallback o referencia de interoperabilidad.

Los valores Alpha usan Hex de 8 dígitos en formato `#RRGGBBAA`.

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
| color/terminal/success | oklch(87.628% 0.22779 152.55) | #00FF88 |
| color/warning/500 | oklch(84.417% 0.17216 84.93) | #FFC107 |
| color/warning/900 | oklch(70.757% 0.19745 46.46) | #FF6F00 |

## 8. Semantic colors

Consume estos tokens en componentes. No uses primitives directamente salvo al definir aliases.

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
| hero/glow | #0A5CD60F | #00B0FF24 |
| logo/brackets | #1E40AF | #3B82F6 |
| logo/inverted | #FFFFFF | #FFFFFF |
| logo/monochrome | #020408 | #FFFFFF |
| logo/ring | #0044CC | #00B0FF |
| logo/slash-end | #00B0FF | #00D8FF |
| logo/slash-start | #1E40AF | #3B82F6 |
| status/success/background | #10B9810D | #10B9811A |
| status/success/border | #10B98166 | #10B98199 |
| status/success/text | #065F46 | #34D399 |
| surface/default | #FFFFFF | #0A0D14 |
| surface/highlight | #E8EEF9 | #141B29 |
| terminal/glow | #00B0FF59 | #00B0FF59 |
| terminal/primary | #00B0FF | #00B0FF |
| terminal/success | #00FF88 | #00FF88 |

## 9. Channel theme

### Shared visual tokens

Actualmente Portfolio, Link Hub y Professional resuelven los siguientes tokens visuales al mismo valor dentro de cada mode. La diferencia principal entre canales está en typography.

| Channel token | Light | Dark |
| --- | --- | --- |
| channel/accent/primary | #0A5CD6 | #00B0FF |
| channel/accent/secondary | #3B82F6 | #00D8FF |
| channel/background/canvas | #F5F8FC | #020408 |
| channel/content/default | #334155 | #CBD5E1 |
| channel/content/muted | #475569 | #94A3B8 |
| channel/content/strong | #0F172A | #F1F5F9 |
| channel/edge/default | #CBD5E1 | #1E293B |
| channel/status/online | #1B5E20 | #00FF88 |
| channel/surface/default | #FFFFFF | #0A0D14 |
| channel/surface/highlight | #E8EEF9 | #141B29 |

### Channel font matrix

| Token | Portfolio | Link Hub | Professional |
| --- | --- | --- | --- |
| channel/font/body | JetBrains Mono | Inter | Inter |
| channel/font/display | Press Start 2P | JetBrains Mono | JetBrains Mono |
| channel/font/heading | VT323 | JetBrains Mono | JetBrains Mono |
| channel/font/technical | Share Tech Mono | JetBrains Mono | JetBrains Mono |

### Portfolio terminal tokens

Aunque estos tokens existen en los seis Figma modes, su scope nominal es Portfolio.

| Token | Resolved value |
| --- | --- |
| channel/portfolio/terminal/background | #020408 |
| channel/portfolio/terminal/content | #F1F5F9 |
| channel/portfolio/terminal/cyan | #00B0FF |
| channel/portfolio/terminal/cyan-bright | #00D8FF |
| channel/portfolio/terminal/grid | #1E293B |
| channel/portfolio/terminal/phosphor | #00FF88 |
| channel/portfolio/terminal/surface | #0A0D14 |

## 10. Dimensions

Todas las dimensiones son píxeles salvo que se indique otra unidad.

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

## 11. Semantic spacing

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

## 12. Semantic radius

| Token | Alias | Resolved |
| --- | --- | --- |
| radius/card | radius/md | 12 px |
| radius/circular | radius/full | 999 px |
| radius/control | radius/sm | 8 px |
| radius/large | radius/xl | 24 px |
| radius/panel | radius/lg | 16 px |

## 13. Opacity

| Token | Value |
| --- | --- |
| opacity/watermark-light | 8% |
| opacity/watermark-dark | 10% |

## 14. Effect styles

No existen Paint Styles ni Grid Styles locales en el snapshot. Los colores se administran mediante variables. Existen nueve Effect Styles:

| Style | Type | Offset X | Offset Y | Blur | Color token | Usage |
| --- | --- | --- | --- | --- | --- | --- |
| Glow / Hero | Drop shadow | 0px | 0px | 30px | hero/glow | Mode-aware radial brand glow. |
| Glow / Terminal | Drop shadow | 0px | 0px | 30px | terminal/glow | Terminal phosphor glow. |
| Retro / XS | Drop shadow | 1px | 1px | 0px | edge/strong | Solid retro offset shadow. |
| Retro / SM | Drop shadow | 1.5px | 1.5px | 0px | edge/strong | Solid retro offset shadow. |
| Retro / MD | Drop shadow | 3px | 3px | 0px | edge/strong | Solid retro offset shadow. |
| Retro / LG | Drop shadow | 4px | 4px | 0px | edge/strong | Solid retro offset shadow. |
| Retro / XL | Drop shadow | 5px | 5px | 0px | edge/strong | Solid retro offset shadow. |
| Retro / 2XL | Drop shadow | 6px | 6px | 0px | edge/strong | Solid retro offset shadow. |
| Retro / 3XL | Drop shadow | 8px | 8px | 0px | edge/strong | Solid retro offset shadow. |

## 15. Logo geometry

La geometría maestra está definida sobre un grid de `512 × 512`.

| Token | Value |
| --- | --- |
| avatar/padding | 48px |
| clear-space | 32px |
| glyph/cap-radius | 21px |
| glyph/stroke | 42px |
| grid/base | 512px |
| mark/diameter | 448px |
| minimum/digital | 24px |
| minimum/print-mm | 8 mm |
| ring/radius | 212px |
| ring/stroke | 28px |

### Logo construction rules

- El isotype canónico representa el concepto **Confianza técnica**.
- La slash es una sola silueta continua con un segmento cyan integrado mediante clipping.
- No recrear el acento como una slash corta separada.
- Conservar la geometría maestra de 512 px y el clear space.
- Tamaño mínimo digital: `24 px`.
- Tamaño mínimo de impresión: `8 mm`.

## 16. Logo components

### `Logo / Isotype`

Component set: `16:52`

Properties:

- `Treatment`: `Primary`, `Monochrome`, `Inverted`.
- `Mode`: `Light`, `Dark`.

Variants:

- `Treatment=Primary, Mode=Light` — `15:2`.
- `Treatment=Primary, Mode=Dark` — `16:2`.
- `Treatment=Monochrome, Mode=Light` — `16:12`.
- `Treatment=Monochrome, Mode=Dark` — `16:22`.
- `Treatment=Inverted, Mode=Light` — `16:32`.
- `Treatment=Inverted, Mode=Dark` — `16:42`.

### `Identity / Profile Mark`

Component set: `19:46`

Properties:

- `Shape`: `Circle`, `Square`.
- `Mode`: `Light`, `Dark`.

Rules:

- Es un mark para repositorios, aplicaciones y project identities.
- No está aprobado como avatar personal principal de David.
- Para perfiles personales, usar `Identity / Portrait`.

Variants:

- Circle / Light — `19:2`.
- Circle / Dark — `19:13`.
- Square / Light — `19:24`.
- Square / Dark — `19:35`.

### `Logo / Favicon`

Component set: `20:104`

Properties:

- `Size`: `16`, `32`, `64`.
- `Mode`: `Light`, `Dark`.

Rules:

- Son pixel masters reales.
- Exportar a `1×`.
- No redimensionar un raster exportado para producir otro tamaño.
- Para Chrome Extension, exportar cada tamaño desde su variant correspondiente.

Variants:

- 16 Light — `20:38`.
- 16 Dark — `20:49`.
- 32 Light — `20:60`.
- 32 Dark — `20:71`.
- 64 Light — `20:82`.
- 64 Dark — `20:93`.

### `Logo / Watermark`

Component set: `21:117`

Properties:

- `Mode`: `Light`, `Dark`.

Rules:

- Light: opacity `8%`.
- Dark: opacity `10%`.
- No sobrescribir opacity en la instancia.
- No reducir manualmente por debajo de los valores aprobados.

Variants:

- Light — `21:95`.
- Dark — `21:106`.

## 17. Export sizes

| Token | Size |
| --- | --- |
| a4-300dpi/height | 3508 px |
| a4-300dpi/width | 2480 px |
| app-icon/1024 | 1024 px |
| app-icon/128 | 128 px |
| app-icon/256 | 256 px |
| app-icon/512 | 512 px |
| avatar/1200 | 1200 px |
| avatar/400 | 400 px |
| avatar/800 | 800 px |
| business-card/height-mm | 55 mm |
| business-card/width-mm | 85 mm |
| favicon/16 | 16 px |
| favicon/32 | 32 px |
| favicon/48 | 48 px |
| favicon/64 | 64 px |
| github-social/height | 640 px |
| github-social/width | 1280 px |
| linkedin-cover/height | 396 px |
| linkedin-cover/width | 1584 px |
| open-graph/height | 630 px |
| open-graph/width | 1200 px |

### Chrome Extension icon mapping

Para Manifest V3, la documentación oficial de Chrome recomienda declarar íconos raster cuadrados de `16`, `32`, `48` y `128` px. `128` se usa durante instalación y en Chrome Web Store; `48` se usa en `chrome://extensions`; `16` puede funcionar como favicon de páginas de la extensión. PNG es el formato recomendado y los íconos SVG o WebP no están soportados en el manifest. Usa masters independientes, no escalados desde otro raster:

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

Figma contiene masters explícitos para `16`, `32` y `64`. Los tamaños `48` y `128` existen como export tokens, pero no aparecen como variants dentro de `Logo / Favicon`; deben exportarse desde el source vector o incorporarse como variants antes de tratarlos como pixel masters aprobados.

## 18. CSS starter for the extension

### Identity primitives and semantic aliases

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

### Explicit application theme override

Cuando la extensión permita seleccionar tema independientemente del sistema operativo:

```css
:root[data-theme="light"] {
  color-scheme: light;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  /* Repetir o importar el bloque de aliases Dark. */
}
```

## 19. Accessibility and implementation constraints

- Validar contrast ratios en Light y Dark antes de publicar.
- `Web / Body` tiene floor de `16 px`.
- `Web / Caption` tiene floor absoluto de `12 px`.
- No utilizar `Silkscreen`, `Press Start 2P` o `VT323` para lectura extensa.
- No sustituir el nombre o retrato de David por el isotype en contextos personales.
- Usar semantic tokens dentro de components; primitives solo en definitions.
- Evitar hardcoded colors fuera del archivo central de tokens.
- Respetar `prefers-reduced-motion` al implementar glow, transitions o cualquier futura motion rule.
- Los effect styles Retro pertenecen al lenguaje del portfolio, no a toda la marca.

## 20. Suggested extension token architecture

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

Recommended dependency direction:

```text
primitives
→ semantic aliases
→ channel theme
→ component tokens
→ UI components
```

## 21. Confirmed and unconfirmed scope

### Confirmed

- 10 local variable collections.
- 230 local variables.
- Light and Dark semantic color modes.
- Six channel modes.
- Complete typography foundations.
- Logo, profile mark, favicon and watermark component APIs.
- Nine effect styles.
- No local Paint Styles.
- No local Grid Styles.

### Unconfirmed or requiring asset export

- The Markdown does not embed the portrait or logo binaries.
- Export the approved logo and favicon assets directly from their Figma nodes.
- Figma exposes favicon variants for 16, 32 and 64 px; 48 and 128 require source-vector export or new approved pixel-master variants.
- El documento asume Manifest V3, que es la versión actual aceptada por Chrome Web Store. Valida cada superficie (`icons`, `action`, side panel, options, etc.) contra la documentación oficial.

## 22. Source responsibility

- Figma: designed Identity System, variables, styles, logo and export references.
- Production repository: implemented token names, CSS, theme behavior, assets and tests.
- Cortex-L7: durable brand decisions, rationale, governance and cross-channel alignment.


## 23. Official Chrome Extension references

- [Manifest — Icons](https://developer.chrome.com/docs/extensions/reference/manifest/icons)
- [Configure extension icons](https://developer.chrome.com/docs/extensions/develop/ui/configure-icons)
- [Manifest file format](https://developer.chrome.com/docs/extensions/reference/manifest)
- [Manifest — Content Security Policy](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy)
- [Manifest version](https://developer.chrome.com/docs/extensions/reference/manifest/manifest-version)
