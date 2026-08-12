# Pruebas end-to-end

```bash
./test/run.sh
```

Carga la extensión **sin empaquetar** en un Chromium real y ejerce el flujo
completo: popup → `chrome.scripting` → content scripts → jsPDF → descarga.
Sale con código distinto de cero si algo falla.

## Requisitos

| Herramienta | Necesidad |
|---|---|
| `playwright-cli` (`npm i -g @playwright/cli`) | obligatoria |
| Un display (`DISPLAY`) | obligatoria — las extensiones necesitan modo headed |
| `poppler-utils` + ImageMagick | opcional; sin ellas las comprobaciones del PDF se reportan como `SKIPPED`, nunca como aprobadas |

## Cómo funciona

`test/fixture/viewer.html` se sirve **desde el origen real
`https://drive.google.com`** mediante interceptación de red, de modo que los
`host_permissions` del `manifest.json` se aplican de verdad. El fixture
reproduce lo que `docs/selectors.md` verificó del visor real:

- páginas como `<img src="blob:…">` dentro de un contenedor scrollable que
  lleva el fragmento de clase `ndfHFb-…`;
- **virtualización**: solo unas pocas páginas existen en el DOM al cargar, el
  resto aparece al hacer scroll;
- un toolbar con `aria-label="Página 1 de N"`;
- un **iframe lateral sin páginas**, para comprobar que jsPDF no se inyecta
  donde no hace falta;
- materialización **deliberadamente fuera de orden** (`jitterFor`), porque un
  visor real decodifica páginas en paralelo y no las termina en orden de
  documento.

Cada página se pinta con `rojo = i*8`, así que el orden del PDF exportado se
decodifica **por fuera de la extensión** con `pdftoppm` + ImageMagick. Eso es
lo que detecta páginas en blanco, duplicadas o intercambiadas — un simple
recuento de páginas no las vería.

### Parámetros del fixture

- `?pages=N` — número real de páginas del documento.
- `?label=M` — total que **anuncia** el toolbar, para simular una detección
  errónea del total.

## Lo único que se sustituye

`chrome.tabs.query({active, currentWindow})`. Un popup abierto como pestaña se
devolvería a sí mismo en vez de la pestaña del documento. Todo lo demás
—`chrome.scripting`, `chrome.runtime`, `chrome.storage`, ambos content
scripts, jsPDF y la descarga— es el código real.

## Lo que estas pruebas NO cubren

- **Google Drive de verdad.** El fixture imita el DOM documentado; si Google
  cambia el visor, esto no se entera. La verificación contra documentos reales
  está en `docs/selectors.md`.
- **Virtualización agresiva.** El fixture materializa páginas pero no las
  desmonta. Un documento de 100+ páginas en Drive real sí puede desmontarlas,
  y `capture.js` todavía rasteriza al final en vez de durante el scroll (ver
  la nota de corrección en `docs/selectors.md`).
- **El clic real en el icono de la barra de herramientas**, por el stub de
  `chrome.tabs.query`.
- Documentos apaisados o con tamaños de página mixtos.
