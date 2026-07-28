# Selectores del visor de Drive/Docs — estado de verificación

> **Estado: VERIFICADO contra 2 documentos reales, 2 variantes del visor.**
> Ver el historial abajo para el detalle. Sigue habiendo huecos (ver
> "Qué falta verificar" al final) — en particular, todo lo probado fue con
> documentos **públicos/compartidos**, no con un documento que exija sesión
> de Google iniciada, y todos los documentos probados eran verticales
> (portrait) de tamaño uniforme.

## Cómo se verificó

No fue posible verificar esto con el MCP de chrome-devtools conectado a la
sesión real de Chrome del usuario (el toggle "Remote debugging" de
`chrome://inspect` no expone el endpoint `--remote-debugging-port` clásico
que la herramienta necesita). En su lugar, se usó una instancia de Chrome
separada, propia del MCP (`--categoryExtensions`, sin la sesión de Google
del usuario), con la extensión real instalada sin empaquetar, contra dos
documentos PDF públicos:

1. `https://docs.google.com/viewer?url=<pdf>&embedded=true` — visor embebido de Docs, documento de prueba de 3 páginas.
2. `https://drive.google.com/file/d/1ChPBM5TouAhlNX6IWHlOTiipG0HGl19T/view` — visor real de producción de Drive, documento académico real de 12 páginas, compartido públicamente.

Para cada uno: se corrió el diagnóstico de `page-detector.js` vía
`evaluate_script`, y además se disparó una exportación real completa a
través de la extensión instalada (clic real en "Exportar PDF"), y se
verificó el PDF descargado de forma independiente con `file` y `pdftoppm`
(fuera del propio código de la extensión).

## Resultados

| Documento | Páginas reales | Estrategia ganadora | `blob-image` count | `canvas` count | Contenedor scrollable hallado | `expectedPageCount` extraído | PDF exportado |
|---|---|---|---|---|---|---|---|
| docs.google.com/viewer (3 pág.) | 3 | `blob-image` | 3/3 (800×1035 c/u) | 0 | ✅ DIV `ndfHFb-c4YZDc-cYSp0e-s2gQvd ndfHFb-c4YZDc-s2gQvd` | 3 (de `"Page 1 of 3"`) | ✅ 3 páginas, `file` confirma "PDF document, version 1.3, 3 page(s)" |
| drive.google.com/file/d/…/view (12 pág.) | 12 | `blob-image` | 3/3 visibles inicialmente (virtualizado — el resto se renderiza durante el scroll) | 0 | ✅ mismo DIV, misma clase | 12 (de `"Página 1 de 12"`, español) | ✅ 12 páginas, `file` confirma "PDF document, version 1.3, 12 page(s)", páginas 1/7/12 verificadas visualmente con `pdftoppm` — texto nítido, sin cortes ni duplicados |

Hallazgos clave:

- **`blob-image` es la estrategia correcta y suficiente** en ambas variantes del visor (embebido y de producción). `canvas` nunca se necesitó — el visor real de Google usa imágenes con `blob:` URL, no `<canvas>` directamente.
- **La virtualización es real y activa**: en el documento de 12 páginas, solo ~3 páginas tenían un `<img src="blob:...">` en el DOM al cargar; el resto aparece progresivamente al hacer scroll. Esto confirma que el diseño de "capturar durante el scroll" (no después) de `capture.js` era necesario, no solo cautela teórica.
- **El contenedor scrollable tiene la MISMA clase** (`ndfHFb-c4YZDc-cYSp0e-s2gQvd ndfHFb-c4YZDc-s2gQvd`) en ambas variantes del visor — indicio de que comparten el mismo componente interno. Nota: esta clase contiene el fragmento `ndfHFb`, el mismo que usa la estrategia 3 (`legacy-class-fragment`) — confirma que ese prefijo sigue existiendo en producción, aunque como contenedor, no como selector útil de páginas individuales (por sí solo matcheó 207–595 elementos, inútil sin la cascada).
- **`detectExpectedPageCount()` funciona en español e inglés** — probado con `"Page 1 of 3"` y `"Página 1 de 12"`, ambos extraídos correctamente por el regex `(\d+)\s*(?:\/|of|de)\s*(\d+)`.
- **Bugs reales encontrados y corregidos durante esta verificación** (no eran visibles por revisión estática de código):
  1. El bucle de scroll podía quedarse esperando 4 segundos completos en cada paso restante una vez capturadas todas las páginas disponibles, sin forma de saber que no había más contenido — con documentos donde todo se renderiza rápido, esto sumaba decenas de segundos muertos. Corregido: tras un primer paso sin capturas nuevas, los siguientes usan un timeout corto (300ms).
  2. jsPDF con `unit: "px"` escala por 96/72 (×1.333) al convertir a puntos del PDF — las páginas salían ~33% más grandes de lo esperado. Corregido con un factor de compensación (`PDF_UNIT_SCALE = 0.75`), verificado empíricamente hasta obtener un mapeo limpio 1px = 1pt.
  3. El nombre de archivo sugerido duplicaba la extensión (`documento.pdf.pdf`) cuando el título de la pestaña ya terminaba en `.pdf` (pasa en el visor embebido de Docs). Corregido en `suggestFilenameFromTitle`.
  4. El popup mostraba el resultado de la última exportación aunque se abriera sobre una pestaña distinta a la que se exportó. Corregido comparando `state.tabId` contra la pestaña activa antes de mostrar "descargado"/"error".

## Estrategia implementada (cascada, de más a menos confiable)

| # | Estrategia | Selector | Confianza | Estado |
|---|---|---|---|---|
| 1 | `blob-image` | `img[src^="blob:"]` | Alta | **Confirmada como ganadora en 2/2 documentos reales probados** |
| 2 | `canvas` | `canvas` (con `width/height` ≥ 100px) | Media | No se ha visto activarse en la práctica todavía; se mantiene como red de seguridad |
| 3 | `legacy-class-fragment` | `[class*="ndfHFb"]` | Baja | El fragmento de clase SÍ existe en el DOM real (visto en el contenedor scrollable), pero solo, matchea cientos de elementos irrelevantes — confirmado que es un último recurso pobre, tal como se documentó originalmente |

Cada elemento candidato se filtra por `MIN_PAGE_DIMENSION = 100px` para descartar iconos y miniaturas.

## Qué falta verificar

- Un documento que exija sesión de Google iniciada (todo lo probado fue con enlaces públicos/compartidos — es altamente probable que el DOM sea idéntico ya que es la misma infraestructura de visor, pero no se ha confirmado con una cuenta autenticada).
- Un documento apaisado o con tamaños de página mixtos (ambos documentos probados eran verticales y de tamaño uniforme — la lógica de `orientation`/`format` por página SÍ se probó exhaustivamente con datos sintéticos, ver commits de `capture.js`, pero no contra un PDF apaisado real).
- El caso de iframe genuino (un visor embebido dentro de OTRO origen distinto a docs.google.com/drive.google.com, con `allFrames: true` necesitando encontrar el frame correcto) — lo probado fue `docs.google.com/viewer` navegado directamente como documento de nivel superior, no incrustado como iframe de un tercero.
- Documentos muy largos (100+ páginas) para confirmar comportamiento de memoria y que la virtualización no cambia de patrón a mayor escala.

## Historial

| Fecha | Quién | Qué se verificó |
|---|---|---|
| 2026-07-27 | Sesión de implementación (Chrome vía MCP, extensión real instalada) | Detección, orden, contenedor scrollable y exportación completa verificados contra 2 documentos reales (3 y 12 páginas) en 2 variantes del visor de Google. 4 bugs reales encontrados y corregidos (ver arriba). Ningún documento probado requería sesión de Google iniciada. |
