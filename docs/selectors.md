# Selectores del visor de Drive/Docs — estado de verificación

> **Estado: NO VERIFICADO.** Este documento describe la estrategia de detección
> implementada en `src/content/page-detector.js`, no observaciones medidas
> contra el DOM real del visor. La Fase 0 del plan (`PLAN.md` §4) —abrir un
> PDF propio en Drive e inspeccionar el DOM con el MCP de chrome-devtools—
> no se pudo ejecutar en la sesión donde se escribió este código: no había
> una instancia de Chrome accesible. **Antes de confiar en esta extensión
> con un documento real, hay que completar esta verificación.**

## Cómo completarla

No fue posible automatizar esta verificación: el MCP de chrome-devtools no
pudo conectarse a una sesión real de Chrome con Google autenticado (el
toggle de "Remote debugging" de `chrome://inspect` no expone el endpoint
clásico `--remote-debugging-port` que la herramienta necesita, y lanzar una
instancia nueva no sirve porque no tendría tu sesión de Google). Es un paso
manual:

1. Abrir un PDF propio en el visor de Drive (`drive.google.com/file/d/…/view`).
2. Abrir la consola de DevTools (F12 → pestaña Console).
3. Pegar el contenido completo de `scripts/diagnose-viewer.js` (solo lee el
   DOM, no escribe nada ni hace peticiones de red) y presionar Enter.
4. Copiar la salida impresa y guardarla aquí, con fecha.
5. Repetir con un documento apaisado y uno de tamaños de página mixtos.
6. Repetir en la vista embebida (`docs.google.com/viewer?...`) para confirmar si el contenido vive en un iframe.
7. Ajustar `src/content/page-detector.js` si algún supuesto de la tabla de abajo resulta falso (y mantener `scripts/diagnose-viewer.js` en sync, ya que es una copia deliberada de esa misma lógica para poder pegarla suelta en la consola).

## Estrategia implementada (cascada, de más a menos confiable)

| # | Estrategia | Selector | Confianza | Razonamiento |
|---|---|---|---|---|
| 1 | `blob-image` | `img[src^="blob:"]` | Media-alta | Los blobs se generan a partir del render interno del visor; no dependen de nombres de clase minificados, pero su presencia como estrategia principal del visor no está confirmada en la versión actual |
| 2 | `canvas` | `canvas` (con `width/height` ≥ 100px) | Media | Cubre el caso de que el visor renderice páginas directamente en `<canvas>` sin convertir a blob |
| 3 | `legacy-class-fragment` | `[class*="ndfHFb"]` | Baja | Fragmento de clase visto en implementaciones previas del visor de Drive. Las clases completas rotan en cada despliegue de Google; solo se usa como último recurso |

Cada elemento candidato se filtra por `MIN_PAGE_DIMENSION = 100px` para descartar iconos y miniaturas.

## Supuestos que necesitan confirmación empírica

- Que al menos una de las tres estrategias encuentra elementos en la versión actual del visor.
- Que el contenedor scrollable se puede hallar subiendo por `parentElement` desde el primer elemento de página detectado (no vive en un iframe separado sin relación de ancestro directo).
- Que `getBoundingClientRect().top + scrollContainer.scrollTop` produce un orden estable y correcto incluso mientras el visor virtualiza elementos durante el scroll.
- Que existe algún `aria-label` o texto con el patrón "N de/of M" para poder mostrar "capturadas N de M páginas"; si no existe, la extensión debe seguir funcionando mostrando solo "N páginas capturadas" sin afirmar un total (comportamiento ya implementado como fallback en `detectExpectedPageCount()`).

## Historial

| Fecha | Quién | Qué se verificó |
|---|---|---|
| 2026-07-27 | — | Ninguna verificación en vivo realizada. Documento creado junto con la implementación inicial. |
