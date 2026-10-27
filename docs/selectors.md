# Selectores del visor de Drive/Docs — estado de verificación

> **Estado: VERIFICADO contra 4 documentos reales (3, 7, 12 y 194 páginas),
> en 2 variantes del visor, incluyendo un documento apaisado y uno de 194
> páginas.** Ver el historial abajo para el detalle. Sigue habiendo huecos
> (ver "Qué falta verificar"): todo lo probado fue con documentos
> **públicos/compartidos**, no con uno que exija sesión de Google iniciada,
> y no se probó un documento real con tamaños de página mixtos.

## Cómo se verificó

No fue posible verificar esto con el MCP de chrome-devtools conectado a la
sesión real de Chrome del usuario (el toggle "Remote debugging" de
`chrome://inspect` no expone el endpoint `--remote-debugging-port` clásico
que la herramienta necesita). En su lugar se usaron instancias de Chrome
separadas, sin la sesión de Google del usuario, con la extensión real
instalada sin empaquetar.

**Verificación inicial (2026-07-27)**, con el MCP de chrome-devtools y clic
real en "Exportar PDF", contra dos documentos públicos:

1. `https://docs.google.com/viewer?url=<pdf>&embedded=true` — visor embebido de Docs, documento de prueba de 3 páginas.
2. `https://drive.google.com/file/d/1ChPBM5TouAhlNX6IWHlOTiipG0HGl19T/view` — visor real de producción de Drive, documento académico real de 12 páginas, compartido públicamente.

**Verificación de escala y orientación (2026-10-26)**, con `playwright-cli` y
un perfil limpio, contra dos documentos públicos adicionales:

3. `https://docs.google.com/viewer?url=https%3A%2F%2Fcdn.truefilesize.com%2Fpdf%2Fsample-pdf-landscape.pdf&embedded=true` — 7 páginas, todas apaisadas (842×595 pt).
4. `https://docs.google.com/viewer?url=https%3A%2F%2Fwww.rfc-editor.org%2Frfc%2Frfc9110.pdf&embedded=true` — RFC 9110, 194 páginas verticales (595×841 pt).

En la corrida de 2026-10-26 se abrió el popup real como pestaña y se
sustituyó únicamente `chrome.tabs.query({active,currentWindow})` para que
devolviera la pestaña del documento; `chrome.scripting`, los content
scripts, jsPDF, la descarga y el resto del popup son el código real, como en
`test/e2e.js`. En ambos casos se disparó una exportación completa y se
verificó el PDF descargado de forma independiente con `file`, `pdfinfo`,
`pdftoppm` e ImageMagick (fuera del propio código de la extensión).

## Resultados

| Documento | Páginas reales | Estrategia ganadora | `blob-image` count | `canvas` count | Contenedor scrollable hallado | `expectedPageCount` extraído | PDF exportado |
|---|---|---|---|---|---|---|---|
| docs.google.com/viewer (3 pág.) | 3 | `blob-image` | 3/3 (800×1035 c/u) | 0 | ✅ DIV `ndfHFb-c4YZDc-cYSp0e-s2gQvd ndfHFb-c4YZDc-s2gQvd` | 3 (de `"Page 1 of 3"`) | ✅ 3 páginas, `file` confirma "PDF document, version 1.3, 3 page(s)" |
| drive.google.com/file/d/…/view (12 pág.) | 12 | `blob-image` | 3/3 visibles inicialmente (virtualizado — el resto se renderiza durante el scroll) | 0 | ✅ mismo DIV, misma clase | 12 (de `"Página 1 de 12"`, español) | ✅ 12 páginas, `file` confirma "PDF document, version 1.3, 12 page(s)", páginas 1/7/12 verificadas visualmente con `pdftoppm` — texto nítido, sin cortes ni duplicados |
| docs.google.com/viewer (7 pág., apaisado) | 7 | `blob-image` | 7/7 (800×565 c/u) | 0 | ✅ mismo DIV, misma clase | 7 (de `"Page 1 of 7"`) | ✅ 7 páginas, `pdfinfo` 800×565 pt, proporción 800/565 = 1.416 ≈ fuente 842/595 = 1.415, orientación apaisada conservada, 7/7 únicas y no vacías |
| docs.google.com/viewer (194 pág., RFC 9110) | 194 | `blob-image` | 3/3 visibles inicialmente (virtualizado) | 0 | ✅ mismo DIV, misma clase | 194 (de `"Page 1 of 194"`) | ✅ 194 páginas, `pdfinfo` 800×1131 pt, 194/194 únicas y no vacías, 0/194 apaisadas por error, exportación completa en 8m19s |

Hallazgos clave:

- **`blob-image` es la estrategia correcta y suficiente** en ambas variantes del visor (embebido y de producción). `canvas` nunca se necesitó — el visor real de Google usa imágenes con `blob:` URL, no `<canvas>` directamente.
- **La virtualización es real y activa**: en el documento de 12 páginas, solo ~3 páginas tenían un `<img src="blob:...">` en el DOM al cargar; el resto aparece progresivamente al hacer scroll.

  > ℹ️ **Nota (revisión de 2026-08-12).** Una versión anterior de esta nota
  > afirmaba que `capture.js` "captura durante el scroll (no después)". En su
  > momento **no era cierto**: `captureNewlyRenderedPages()` solo acumulaba
  > *referencias al DOM* y el `drawImage` ocurría al final. **Ahora sí lo es**:
  > cada página se rasteriza y codifica en el momento en que se detecta, y el
  > ensamblado solo maneja bytes ya listos.
  >
  > Precisión sobre el motivo: se midió, y desmontar el `<img>` y revocar su
  > `blob:` URL **no** basta para producir páginas en blanco — un elemento
  > separado del DOM conserva su bitmap decodificado mientras exista una
  > referencia JS. El caso que justifica capturar pronto es que Chrome descarte
  > los datos decodificados bajo presión de memoria, que no se ha reproducido de
  > forma determinista. El beneficio medido y seguro es el de memoria: se
  > guardan bytes codificados en vez de bitmaps vivos.
- **La escala no cambia el patrón de virtualización**: en el documento de 194
  páginas el visor mantuvo ~3 páginas montadas al inicio y materializó el resto
  durante el auto-scroll. Se capturaron 194/194, sin páginas en blanco,
  duplicadas ni fuera de orden, y la pestaña siguió respondiendo. Tardó 8m19s
  (calidad equilibrada, 800×1131 px por página, PDF de 26.9 MB). La memoria pico
  no se midió; el heap principal tras exportar era ~88 MB.
- **La orientación se conserva en un documento real apaisado**: el PDF de 7
  páginas salió 800×565 pt (proporción 1.416) frente a la fuente 842×595 pt
  (1.415), sin rotación ni recorte; `pdfinfo` confirmó 7/7 páginas apaisadas.
- **El contenedor scrollable tiene la MISMA clase** (`ndfHFb-c4YZDc-cYSp0e-s2gQvd ndfHFb-c4YZDc-s2gQvd`) en ambas variantes del visor — indicio de que comparten el mismo componente interno. Nota: esta clase contiene el fragmento `ndfHFb`, el mismo que usa la estrategia 3 (`legacy-class-fragment`) — confirma que ese prefijo sigue existiendo en producción, aunque como contenedor, no como selector útil de páginas individuales (por sí solo matcheó 207–595 elementos, inútil sin la cascada).
- **`detectExpectedPageCount()` funciona en español e inglés** — probado con `"Page 1 of 3"` y `"Página 1 de 12"`, ambos extraídos correctamente por el regex `(\d+)\s*(?:\/|of|de)\s*(\d+)`.
- **Bugs reales encontrados y corregidos hasta la fecha** (no eran visibles por revisión estática de código):
  1. El bucle de scroll podía quedarse esperando 4 segundos completos en cada paso restante una vez capturadas todas las páginas disponibles, sin forma de saber que no había más contenido — con documentos donde todo se renderiza rápido, esto sumaba decenas de segundos muertos. Corregido: tras un primer paso sin capturas nuevas, los siguientes usan un timeout corto (300ms).
  2. jsPDF con `unit: "px"` escala por 96/72 (×1.333) al convertir a puntos del PDF — las páginas salían ~33% más grandes de lo esperado. Corregido con un factor de compensación (`PDF_UNIT_SCALE = 0.75`), verificado empíricamente hasta obtener un mapeo limpio 1px = 1pt.
  3. El nombre de archivo sugerido duplicaba la extensión (`documento.pdf.pdf`) cuando el título de la pestaña ya terminaba en `.pdf` (pasa en el visor embebido de Docs). Corregido en `suggestFilenameFromTitle`.
  4. El popup mostraba el resultado de la última exportación aunque se abriera sobre una pestaña distinta a la que se exportó. Corregido comparando `state.tabId` contra la pestaña activa antes de mostrar "descargado"/"error".
  5. **(2026-10-26)** Al reutilizar la misma pestaña para otro documento, el popup quedaba anclado al resultado anterior: `applyState()` veía el mismo `tabId` y no había forma de volver al formulario. `DPU_EXPORT_RESET` existía en el service worker pero nunca se enviaba. Corregido con un botón "Exportar otro PDF" en el resultado, más una comprobación E2E.

## Estrategia implementada (cascada, de más a menos confiable)

| # | Estrategia | Selector | Confianza | Estado |
|---|---|---|---|---|
| 1 | `blob-image` | `img[src^="blob:"]` | Alta | **Confirmada como ganadora en 4/4 documentos reales probados** |
| 2 | `canvas` | `canvas` (con `width/height` ≥ 100px) | Media | No se ha visto activarse en la práctica todavía; se mantiene como red de seguridad |
| 3 | `legacy-class-fragment` | `[class*="ndfHFb"]` | Baja | El fragmento de clase SÍ existe en el DOM real (visto en el contenedor scrollable), pero solo, matchea cientos de elementos irrelevantes — confirmado que es un último recurso pobre, tal como se documentó originalmente |

Cada elemento candidato se filtra por `MIN_PAGE_DIMENSION = 100px` para descartar iconos y miniaturas.

## Qué falta verificar

- Un documento que exija sesión de Google iniciada (todo lo probado fue con enlaces públicos/compartidos — es altamente probable que el DOM sea idéntico ya que es la misma infraestructura de visor, pero no se ha confirmado con una cuenta autenticada). **Bloqueado hasta disponer de una URL y una sesión de Google.**
- Un documento real con tamaños de página mixtos (apaisado y vertical en el mismo archivo). El caso apaisado puro ya está verificado; no se encontró un PDF público mixto para probar la alternancia real.
- Memoria pico durante documentos largos: no medida. En 194 páginas se confirmó que no hubo crash, que la pestaña siguió respondiendo y que el heap principal tras exportar era ~88 MB, pero no se muestreó el RSS del navegador durante toda la captura.
- Determinismo del caso de 194 páginas: una sola corrida completa. Repetirla para descartar variación por presión de memoria queda pendiente.
- **Iframe de origen distinto: no soportado por diseño.** El popup solo se activa si la pestaña de nivel superior es `drive.google.com` o `docs.google.com` (`DRIVE_HOSTS` en `popup.js`). `allFrames: true` sirve para frames dentro de esos dos dominios (por ejemplo, un panel lateral sin páginas), no para un visor incrustado en un sitio de terceros. Ampliarlo exigiría permisos de host mucho más amplios y empeoraría la revisión de la tienda.

## Historial

| Fecha | Quién | Qué se verificó |
|---|---|---|
| 2026-07-27 | Sesión de implementación (Chrome vía MCP, extensión real instalada) | Detección, orden, contenedor scrollable y exportación completa verificados contra 2 documentos reales (3 y 12 páginas) en 2 variantes del visor de Google. 4 bugs reales encontrados y corregidos en esa sesión (ver arriba). Ningún documento probado requería sesión de Google iniciada. |
| 2026-08-12 | Revisión de seguridad/rendimiento + suite E2E (`test/run.sh`, Chromium real con la extensión sin empaquetar) | Fixture que imita el DOM verificado arriba, servido desde el origen real `drive.google.com`. 25 comprobaciones de navegador + verificación del PDF con `pdftoppm`. **Bug real encontrado: emparejamiento por índice.** `captureNewlyRenderedPages()` hacía `pageElements.slice(capturedElements.length)`, lo que asume que las páginas terminan de renderizarse en orden de documento. No es cierto: un visor que decodifica en paralelo puede terminar la página 16 antes que la 14, y eso metía la 16 en la ranura 14 y luego la duplicaba (o perdía páginas). Corregido emparejando por identidad de elemento + posición absoluta explícita. **Este bug NO era visible en la verificación de 2026-07-27** porque con 3 y 12 páginas el render fue lo bastante rápido como para llegar en orden. |
| 2026-10-26 | Verificación real con Playwright + extensión sin empaquetar (Chromium headed, perfil limpio) | Documento apaisado real de 7 páginas (`docs.google.com/viewer?url=…sample-pdf-landscape.pdf`) y RFC 9110 de 194 páginas (`docs.google.com/viewer?url=…rfc9110.pdf`). Resultados: 7/7 y 194/194 páginas; `pdfinfo` 800×565 pt y 800×1131 pt; orientación conservada; todas las páginas renderizadas a 72 dpi no vacías y con SHA-256 único; sin errores de consola ni crashes. La exportación de 194 páginas tardó 8m19s y produjo un PDF de 26.9 MB. **Bug real encontrado y corregido: popup anclado al resultado anterior al reutilizar la misma pestaña** (ver bug 5 arriba); suite E2E ampliada a 30 comprobaciones. |
