# Plan de implementación — Exportador de páginas PDF de Google Drive

> Proyecto: `DrivePDF-Unblocker`
> Fecha: 2026-07-27
> Estado: planificación (aún no existe código)
> Fuentes consultadas: skill `chrome-extensions` (GoogleChrome/modern-web-guidance) y documentación oficial de jsPDF vía Context7 MCP (`/parallax/jspdf`).

---

## 1. Objetivo y alcance

Construir una extensión Chrome (Manifest V3) que, con un clic, convierta a PDF descargable las páginas que el visor de Google Drive **ya renderizó en pantalla** para un documento al que el usuario tiene acceso de lectura.

Funcionalmente equivale a capturar cada página y unirlas en un PDF: no descifra nada, no elude autenticación y no accede a contenido que el usuario no pueda ver. Trabaja únicamente sobre píxeles ya presentes en el DOM de la pestaña activa.

**Uso previsto:** documentos propios, material de estudio compartido en modo lectura, y accesibilidad/consulta sin conexión. Queda a cargo del usuario respetar los derechos de autor y las condiciones bajo las que recibió el documento.

### No objetivos (limitaciones aceptadas de la v1)

| Limitación | Consecuencia |
|---|---|
| La salida es **ráster** (imágenes), no texto | El PDF no permite buscar, seleccionar ni copiar texto, y no es accesible para lectores de pantalla |
| La resolución es la del render en pantalla | La nitidez depende del zoom del visor al momento de capturar (ver §5, D6) |
| Sin OCR | Candidato a v2 |
| Solo el visor de PDF de Drive | No cubre Google Docs/Sheets nativos ni otros visores |

Estas limitaciones deben aparecer explícitas en el README y en la ficha de la tienda: prometer un PDF "igual al original" sería falso.

---

## 2. Auditoría del prototipo de partida

El prototipo aportado establece la idea correcta, pero **no funcionaría tal cual**. Estos son los defectos a corregir, en orden de gravedad. Es el insumo principal del plan.

### Bloqueantes

1. **Carga remota de jsPDF.** `jspdf.src = 'https://cloudflare.com'` es una URL placeholder y, aun con la URL real del CDN, MV3 **prohíbe ejecutar código alojado remotamente** (motivo de rechazo automático en la Chrome Web Store) y la CSP de `drive.google.com` bloquearía la inyección de un `<script src>` en la página.
   → **Corrección:** empaquetar `jspdf.umd.min.js` dentro de la extensión e inyectarlo con `chrome.scripting.executeScript({ files: [...] })` en el *isolated world*, donde la CSP de la página no aplica.

2. **`host_permissions` inválido y con el dominio equivocado.** `"https://google.com*"` no es un match pattern válido (falta la `/` antes del `*`) y el visor de Drive no vive en `google.com` sino en `drive.google.com` y `docs.google.com`.
   → **Corrección:** `["https://drive.google.com/*", "https://docs.google.com/*"]`.

3. **La validación de URL nunca se cumple.** `tab.url.includes("://google.com")` no coincide con `https://drive.google.com/file/d/…/view`. Además `tab.url` es `undefined` si la extensión no tiene permiso sobre esa pestaña, así que la guarda dispara siempre el `alert` de error.
   → **Corrección:** ver §5, D2.

4. **Selector CSS ofuscado y sin plan B real.** `ndfHFb-c43HAb-Mo66be-IFXgbe` es una clase minificada generada por Google: rota sin aviso en cada despliegue. El fallback a `img[src^="blob:"]` es razonable pero insuficiente.
   → **Corrección:** cascada de selectores centralizada en un solo módulo + verificación empírica con el MCP de Chrome DevTools (§4, Fase 0).

### Defectos de calidad de salida

5. **Destruye la relación de aspecto.** `addImage(imgData, 'JPEG', 0, 0, width, height)` estira **toda** página al tamaño A4 vertical. Cualquier documento apaisado, A5, carta u oficio sale deformado.
   → **Corrección:** derivar el formato de cada página de sus píxeles reales. jsPDF acepta `addPage(format, orientation)` con `format` como array `[ancho, alto]`, y el constructor acepta `format: [w, h]`.

6. **`toDataURL('image/jpeg', 1.0)`** produce un base64 enorme por página con calidad casi sin pérdida; un documento de 200 páginas genera un PDF inmanejable.
   → **Corrección:** calidad configurable (predeterminado JPEG 0.85), conversión página por página, `addImage` inmediato y liberación del canvas (`canvas.width = 0`) antes de la siguiente. Según la documentación de jsPDF, `addImage` acepta directamente un `HTMLCanvasElement`, lo que evita por completo la cadena base64 intermedia cuando se acepta el JPEG por defecto.

7. **Orden de páginas no garantizado.** `getElementsByClassName` devuelve orden de documento, que *normalmente* coincide con el orden de páginas, pero el visor reutiliza nodos al virtualizar.
   → **Corrección:** ordenar por posición vertical absoluta (`getBoundingClientRect().top + scrollTop` del contenedor) o por el atributo de número de página si existe.

### Defectos de robustez y UX

8. **Páginas no renderizadas se pierden en silencio.** El prototipo delega en el usuario ("haz scroll despacio") y no detecta huecos. Si faltan páginas, el usuario obtiene un PDF incompleto sin saberlo.
   → **Corrección:** auto-scroll instrumentado (§4, Fase 3) + comparar páginas capturadas contra el total que informa el visor y **advertir explícitamente** ("se capturaron 12 de 30 páginas").

9. **`alert()` desde código inyectado**: bloquea el hilo principal, es feo y en algunos contextos se suprime.
   → **Corrección:** overlay propio en la página con barra de progreso y botón de cancelar.

10. **El popup se cierra y se pierde el estado.** El script inyectado sigue corriendo, pero el popup no puede informar nada al reabrirse.
    → **Corrección:** progreso en `chrome.storage.session` + badge en el icono; el popup lee el estado al abrirse. Regla firme de la skill: **nunca guardar estado en variables globales del service worker**, que se termina a los ~30 s.

11. **Sin soporte para iframes.** Algunas vistas del visor se renderizan en un frame hijo (`docs.google.com/viewer`).
    → **Corrección:** inyectar con `allFrames: true` y elegir el frame que efectivamente contiene páginas.

12. **Nombre de archivo fijo** (`documento_recuperado.pdf`).
    → **Corrección:** derivarlo de `document.title` (quitando el sufijo " - Google Drive"), sanearlo y permitir edición en el popup.

13. **Sin manejo de canvas contaminado.** Si alguna imagen llega de otro origen sin CORS, `toDataURL` lanza `SecurityError` y todo el proceso muere. Las URLs `blob:` heredan el origen de la página, así que normalmente no ocurre, pero hay que capturar el error y explicarlo.

14. **Sin iconos.** El manifest original no declara ninguno — lo cual es preferible a referenciar archivos inexistentes, pero conviene generarlos de verdad (§4, Fase 1).

### Cuestión de marca y política

15. El nombre "Extractor de PDF Protegidos de Drive" usa la marca **Drive** y sugiere elusión de protecciones: doble motivo de rechazo en la tienda. Ver §7.

---

## 3. Arquitectura

```
DrivePDF-Unblocker/
├── manifest.json
├── PLAN.md                      ← este archivo
├── CHROMEWEBSTORE.md            ← ficha de tienda (obligatorio en este repo)
├── README.md
├── src/
│   ├── popup/
│   │   ├── popup.html           ← sin scripts ni handlers inline (CSP)
│   │   ├── popup.css
│   │   └── popup.js             ← todo async/await, sin cadenas .then()
│   ├── content/
│   │   ├── page-detector.js     ← ÚNICO lugar con selectores de Drive
│   │   ├── capture.js           ← orquestador: scroll, captura, PDF, descarga
│   │   └── overlay.css          ← clases con prefijo dpu- para no chocar
│   ├── background/
│   │   └── service-worker.js    ← estado en storage.session + badge
│   └── vendor/
│       └── jspdf.umd.min.js     ← empaquetado, NUNCA desde CDN
├── icons/
│   ├── icon-16.png  (16×16)
│   ├── icon-48.png  (48×48)
│   └── icon-128.png (128×128)
├── scripts/
│   ├── generate-icons.mjs
│   └── package-extension.sh
├── docs/
│   └── selectors.md             ← hallazgos del reconocimiento de DOM
└── store-assets/                ← capturas 1280×800, excluido del ZIP
```

### manifest.json previsto

```json
{
  "manifest_version": 3,
  "name": "PDF Page Exporter",
  "version": "0.1.0",
  "description": "Exporta a PDF las páginas de un documento que ya se muestran en el visor de tu navegador.",
  "permissions": ["scripting", "storage"],
  "host_permissions": [
    "https://drive.google.com/*",
    "https://docs.google.com/*"
  ],
  "action": {
    "default_popup": "src/popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    },
    "default_title": "PDF Page Exporter"
  },
  "background": { "service_worker": "src/background/service-worker.js" },
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

Nota: `description` debe quedar ≤ 132 caracteres para coincidir con la descripción corta de la tienda. Sin `content_scripts` declarativos — todo se inyecta bajo demanda para no ejecutar nada mientras el usuario simplemente navega por Drive.

### Flujo de ejecución

1. El usuario abre el PDF en el visor de Drive y pulsa el icono de la extensión.
2. `popup.js` obtiene la pestaña activa, valida que sea Drive, lee las preferencias de `chrome.storage.local` y muestra el formulario (nombre de archivo, calidad, auto-scroll sí/no).
3. Al confirmar, el popup inyecta `vendor/jspdf.umd.min.js` + `content/page-detector.js` + `content/capture.js` con `chrome.scripting.executeScript({ files, target: { tabId, allFrames: true } })` y envía los parámetros por mensaje.
4. `capture.js` monta el overlay de progreso, localiza el contenedor de scroll, y **captura mientras hace scroll** (ver Fase 3).
5. Por cada página: canvas → `addPage([w,h], orientation)` → `addImage` → liberar canvas. Reporta progreso al service worker en cada página.
6. Al terminar: `doc.output('blob')` → `URL.createObjectURL` → `<a download>` → `revokeObjectURL`. Overlay muestra el resumen (páginas capturadas / total esperado).
7. El service worker limpia el badge y el estado de `storage.session`.

---

## 4. Fases y tareas

### Fase 0 — Reconocimiento del DOM real (hacer *antes* de escribir código)

El punto más frágil de todo el proyecto son los selectores de Drive. No se inventan: se miden. Con el MCP de Chrome DevTools ya configurado en `.mcp.json`:

- [ ] Abrir con `navigate_page` un PDF de Drive **propio** en modo vista.
- [ ] Con `evaluate_script`, volcar diagnóstico: conteo de `img[src^="blob:"]`, de `canvas`, clases de sus contenedores, `naturalWidth/Height`, número total de páginas que informa el visor, y qué ancestro es el contenedor scrollable.
- [ ] Repetir con un documento apaisado y con uno de páginas de tamaños mixtos.
- [ ] Repetir con la vista embebida (`docs.google.com/viewer`) para confirmar si hay iframes en juego.
- [ ] Registrar todo en `docs/selectors.md`, con fecha, e indicar qué variante del visor se observó.
- [ ] Verificar el supuesto de D2: ¿`tab.url` viene poblado con solo `host_permissions`, sin permiso `tabs`?

**Criterio de salida:** una lista de selectores verificada, no adivinada.

### Fase 1 — Andamiaje

- [ ] Crear `manifest.json` según §3.
- [ ] `scripts/generate-icons.mjs` que genere los tres PNG en sus dimensiones exactas. Regla firme: si un icono se declara en el manifest, **el archivo debe existir** y medir lo declarado.
- [ ] Descargar `jspdf.umd.min.js` a `src/vendor/` y anotar la versión exacta en el README. Minificado sí, ofuscado no (la ofuscación es motivo de rechazo).
- [ ] `git init` y primer commit (el directorio aún no es un repo).

### Fase 2 — Popup y detección

- [ ] `popup.html` con markup limpio: script externo, cero `onclick`.
- [ ] `popup.js`: `chrome.tabs.query` → validación de pestaña → formulario → invocación. Todo `async/await`.
- [ ] Estados de UI: listo, "abre un PDF de Drive", en progreso (con progreso restaurado desde `storage.session`), terminado, error.
- [ ] `page-detector.js` con la cascada de selectores de la Fase 0 y una función `detectPages()` que devuelva elementos ordenados por posición vertical, más `expectedPageCount()`.
- [ ] Persistir preferencias en `chrome.storage.local`.

### Fase 3 — Captura y auto-scroll

Decisión clave: **capturar durante el scroll**, no después. El visor de Drive virtualiza y descarta los blobs de páginas alejadas del viewport, así que "hacer scroll y luego capturar todo" pierde páginas en documentos largos. Capturar en el momento en que cada página está renderizada elimina la instrucción manual de "haz scroll despacio".

- [ ] Localizar el contenedor scrollable subiendo por los ancestros hasta encontrar `scrollHeight > clientHeight`.
- [ ] Bucle: capturar las páginas visibles no capturadas aún (indexadas por número de página para no duplicar) → avanzar `scrollTop` ~80 % de `clientHeight` → esperar render.
- [ ] Espera de render con `MutationObserver` más comprobación de `img.complete`/`img.decode()`, con timeout por paso y reintentos acotados.
- [ ] Batching con `requestAnimationFrame` y `scheduler.yield()` entre páginas para no congelar la pestaña.
- [ ] Overlay de progreso con botón de cancelar; enviar progreso al service worker en cada página.
- [ ] Fallback conservado: modo "capturar lo ya visible" para cuando el auto-scroll falle.
- [ ] `try/catch` alrededor de la exportación del canvas con mensaje claro ante `SecurityError`.

### Fase 4 — Generación del PDF

- [ ] Instanciar `new jsPDF({ unit: 'pt', format: [w0, h0], orientation })` con las dimensiones de la **primera** página.
- [ ] Por cada página siguiente: `addPage([w, h], orientation)` con sus dimensiones propias, luego `addImage(...)` cubriendo la página completa.
- [ ] Calidad seleccionable: Alta (PNG), Equilibrada (JPEG 0.85, predeterminado), Compacta (JPEG 0.7). Usar el parámetro `compression` de `addImage` (`'NONE' | 'FAST' | 'MEDIUM' | 'SLOW'`) para el flujo del PDF.
- [ ] Liberar cada canvas inmediatamente después de añadirlo.
- [ ] `output('blob')` → descarga por `<a download>` con el nombre saneado.
- [ ] Advertencia visible si `páginas capturadas < total esperado`.

### Fase 5 — Pruebas

- [ ] `install_extension` + `trigger_extension_action` + `take_screenshot` sobre un documento real; revisar `list_console_messages` buscando errores.
- [ ] Matriz de casos: 1 página · ~30 páginas · 200+ páginas · apaisado · tamaños mixtos · vista embebida en iframe · pestaña que no es Drive · documento sin permiso de lectura.
- [ ] Degradación elegante en `chrome://`, `about:blank` y pestañas sin permiso: mensaje claro, nunca una excepción sin capturar.
- [ ] Verificar que el PDF abre correctamente en Chrome, Acrobat y `pdftoppm`/`qpdf`, y comprobar el conteo de páginas.
- [ ] Medir consumo de memoria en el documento de 200+ páginas (`take_heapsnapshot`).
- [ ] Ciclo de iteración con `reload_extension` tras cada cambio.

### Fase 6 — Empaquetado y documentación

- [ ] `scripts/package-extension.sh` que produzca un ZIP limpio excluyendo `.git/`, `store-assets/`, `docs/`, `PLAN.md`, `CHROMEWEBSTORE.md`, `README.md`, `scripts/`.
- [ ] `README.md`: instalación en modo desarrollador, uso, limitaciones de §1, versión de jsPDF empaquetada.
- [ ] Completar `CHROMEWEBSTORE.md` con los datos reales del manifest final.
- [ ] Capturas 1280×800 para la ficha, tomadas con un documento de prueba propio y sin datos personales visibles.

---

## 5. Decisiones técnicas

| # | Decisión | Motivo |
|---|---|---|
| **D1** | jsPDF **empaquetado**, nunca desde CDN | MV3 prohíbe código remoto; además la CSP de Drive bloquearía la inyección. Corrige el defecto nº 1 |
| **D2** | Sin permiso `tabs`; detectar la pestaña por `tab.url` poblado gracias a `host_permissions` | Menos permisos = revisión más fácil. `tab.url` llega `undefined` en pestañas fuera de los hosts declarados, lo que sirve como señal. **A verificar en Fase 0**; si resulta poco fiable, añadir `tabs` y justificarlo |
| **D3** | Inyección en el **isolated world** (predeterminado), no en `MAIN` | El código del content script no está sujeto a la CSP de la página y no contamina el `window` de Drive |
| **D4** | La descarga la dispara el content script con `<a download>` | Alternativa considerada: mover el blob al service worker para usar `chrome.downloads`. Descartada porque los mensajes se serializan a JSON y un `ArrayBuffer` no sobrevive; pasarlo en base64 duplicaría memoria. Un documento offscreen tampoco sirve: **no tiene acceso a `chrome.downloads`**. Coste aceptado: sin barra de progreso nativa de descarga |
| **D5** | Selectores aislados en `page-detector.js` | Cuando Google rote sus clases minificadas, se arregla un archivo. Corrige el defecto nº 4 |
| **D6** | Sugerir subir el zoom del visor antes de capturar | La resolución de salida es la del render; más zoom = blobs más grandes = PDF más nítido. Documentarlo como consejo, no automatizarlo en v1 |
| **D7** | Sin permiso `downloads`, sin analítica, sin red | La extensión no hace ni una petición de red. Simplifica radicalmente la declaración de privacidad |
| **D8** | Capturar **durante** el scroll | El visor descarta blobs fuera del viewport; capturar al final pierde páginas. Corrige el defecto nº 8 |

---

## 6. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Google cambia el DOM del visor | **Alta** (asumir que pasará) | D5, `docs/selectors.md` con fecha, y detección de "0 páginas" con mensaje honesto en lugar de un PDF vacío |
| Documentos muy largos agotan la memoria | Media | Liberación de canvas por página, calidad predeterminada equilibrada, prueba de 200+ páginas en Fase 5 |
| Rechazo en la Chrome Web Store | Media-alta | Ver §7 — la instalación local es la vía de distribución principal |
| `SecurityError` por canvas contaminado | Baja | `try/catch` con mensaje explicativo |
| Virtualización agresiva que impide capturar todo | Media | D8 más el aviso de "capturadas N de M" |

---

## 7. Distribución: expectativa realista

Conviene decidir esto **antes** de invertir en material de tienda.

La función es legítima (capturar píxeles ya visibles, sin romper cifrado ni autenticación), pero la política de la Chrome Web Store es más estricta que la ley y sus revisores pueden considerar que la extensión elude una restricción impuesta por el propietario del documento. **Publicación pública = riesgo real de rechazo.**

Recomendación, en orden:

1. **Instalación local sin empaquetar** (modo desarrollador) — es lo que el prototipo original planteaba y funciona sin ninguna aprobación. Vía principal.
2. **Publicación como "unlisted"** — instalable por enlace, no aparece en búsquedas. Menor exposición.
3. **Publicación pública** — solo si se acepta el riesgo, y con estas correcciones mínimas:
   - Renombrar: fuera "Drive", "Google" y "Unblocker" del nombre visible (infracción de marca + connotación de elusión). Propuesta: **"PDF Page Exporter"**.
   - Describir la función, no la elusión: "exporta a PDF las páginas que ya se muestran en tu navegador".
   - Propósito único redactado con precisión, y una justificación específica por cada permiso.
   - Política de privacidad publicada y accesible, coherente con el hecho de que no se recoge ni transmite ningún dato.

El nombre del repositorio (`DrivePDF-Unblocker`) puede quedarse como está; lo que importa es el nombre del manifest y de la ficha.

---

## 8. Mejoras propuestas para después de la v1

Las dos que el prototipo original planteaba como preguntas abiertas ya están **incorporadas a la v1**: renombrar el archivo antes de guardar (Fase 2) y barra de progreso (Fase 3). Para más adelante:

- **Capa de texto por OCR** — elimina la limitación más grave de §1. Vía Tesseract.js empaquetado, o la Prompt API integrada de Chrome (disponible en service worker, popup y side panel sin permisos extra).
- **Rango de páginas** ("solo 5–20").
- **Atajo de teclado** con la API `commands`.
- **Exportar a PNG/ZIP** en lugar de PDF.
- **Recorte automático de márgenes** del visor.

---

## 9. Checklist de verificación previo a entrega

Directamente del checklist de la skill `chrome-extensions`, filtrado a lo aplicable:

- [ ] `manifest_version: 3`, sin ninguna API de V2 (`chrome.action`, no `chrome.browserAction`; `chrome.scripting`, no `chrome.tabs.executeScript`)
- [ ] Todos los iconos declarados existen como archivos reales con las dimensiones exactas
- [ ] Clave `"action"` presente en el manifest (obligatoria si se usa `chrome.action.*`, incluso vacía)
- [ ] Cero `eval()`, cero scripts inline, cero handlers inline en HTML
- [ ] Todo `async`/`await`, ninguna cadena `.then()`
- [ ] `return true` en los listeners de `onMessage` con respuesta asíncrona
- [ ] El service worker no guarda estado en variables globales
- [ ] Actualizaciones de DOM por lotes con `requestAnimationFrame`
- [ ] Manejo de errores en toda operación asíncrona
- [ ] `host_permissions` limitado a los dos hosts de Google, sin `<all_urls>`
- [ ] Cero código remoto: todo el JS viaja en el paquete
- [ ] ZIP sin `.git/`, `PLAN.md`, `CHROMEWEBSTORE.md`, `README.md`, `store-assets/`, `scripts/`
- [ ] `CHROMEWEBSTORE.md` al día con el manifest final
