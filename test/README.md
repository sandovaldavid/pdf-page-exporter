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
- **La presión de memoria real.** El fixture sí desmonta páginas y revoca sus
  `blob:` URLs (`?evict=1`), pero eso **no** basta para reproducir páginas en
  blanco: un `<img>` desmontado conserva su bitmap decodificado mientras exista
  una referencia JS. Se midió en ambos sentidos — aplazar la rasterización al
  ensamblado también pasa esa prueba. El escenario que motiva rasterizar al
  capturar es que Chrome descarte los datos decodificados de imágenes fuera del
  árbol de render bajo presión de memoria, y eso no es reproducible de forma
  determinista aquí. Un documento de 100+ páginas en Drive real sigue sin
  probarse.
- **El clic real en el icono de la barra de herramientas**, por el stub de
  `chrome.tabs.query`.
- **Cancelar exactamente durante el ensamblado del PDF.** La guarda existe en
  `capture.js` y se probó cuando el ensamblado rasterizaba cada página y duraba
  segundos. Al pasar a codificar durante el scroll, el ensamblado se redujo a un
  bucle de `addImage` sobre bytes ya listos: la ventana es de milisegundos y no
  se puede acertar de forma fiable desde un test. La sección C cancela durante
  el scroll, que es la fase larga y donde el usuario cancela de verdad, y
  comprueba lo que importa: que no se descargue ningún archivo.
- Documentos apaisados o con tamaños de página mixtos.
