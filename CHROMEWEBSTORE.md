# Chrome Web Store Listing — PDF Page Exporter

> Last Updated: 2026-10-26
> **Estado: paquete validado; ficha aún no publicable.** El ZIP de v0.1.0 se genera
> y valida (manifest, iconos, rutas y código remoto comprobados), y ya existe la
> captura obligatoria. Faltan confirmar publisher, contacto y visibilidad. La
> verificación con sesión de Google iniciada sigue pendiente; ver "Submission
> Readiness" al final.

## Store Listing

**Extension Name** [REQUIRED]

PDF Page Exporter

> ⚠️ Debe coincidir exactamente con `name` en `manifest.json`. Deliberadamente **no** contiene "Google", "Drive" ni "Unblocker": usar marcas ajenas en el nombre es motivo de rechazo, y una palabra como "Unblocker" sugiere elusión de protecciones. Máx. 75 caracteres.

**Short Description** [REQUIRED]

Exporta a PDF las páginas de un documento que ya se muestran en el visor de tu navegador.

> 89 caracteres. Debe coincidir con `description` en el manifest (límite 132).

**Detailed Description** [REQUIRED]

> Borrador. Redactado desde la perspectiva del usuario, sin mencionar librerías, APIs ni detalles de implementación.

```
Convierte en un PDF descargable las páginas de un documento que tu navegador ya está mostrando en pantalla.

Genera un único archivo PDF a partir de las páginas visibles del documento. Recorre el documento automáticamente para que no tengas que desplazarte página por página. Conserva el tamaño y la orientación originales de cada página, incluso si el documento mezcla hojas verticales y horizontales. Puedes elegir el nombre del archivo antes de guardarlo y ajustar la calidad para equilibrar nitidez y tamaño. Una barra de progreso te indica en qué página va, y puedes cancelar en cualquier momento.

Cómo se usa:
1. Abre el documento en tu navegador y espera a que cargue la primera página.
2. Haz clic en el icono de la extensión.
3. Escribe el nombre del archivo y elige la calidad.
4. Pulsa Exportar y espera a que termine el recorrido.
5. El PDF se guarda en tu carpeta de descargas.

Consejo: aumenta el nivel de zoom del visor antes de exportar si quieres un resultado más nítido.

Privacidad: la extensión procesa localmente las páginas visibles de tu documento y guarda el PDF en tu equipo. No envía el contenido a ningún servidor, no lo almacena fuera de tu dispositivo, no incluye analítica ni telemetría y no necesita conexión a internet para hacer su trabajo. Solo actúa cuando pulsas su icono y «Exportar PDF».

Ten en cuenta: el PDF resultante contiene imágenes de las páginas, por lo que no permite buscar ni seleccionar texto. La nitidez depende de cómo se vea el documento en pantalla al exportarlo.

Usa esta extensión únicamente con documentos a los que tengas acceso legítimo y respetando los derechos de autor y las condiciones bajo las que recibiste el documento.

Dudas o problemas: https://github.com/sandovaldavid/pdf-page-exporter/issues
```

**Category** [REQUIRED]

Productivity

**Single Purpose** [REQUIRED]

Exporta a un único archivo PDF las páginas de un documento que el visor del navegador ya tiene renderizadas en pantalla.

**Primary Language** [REQUIRED]

Spanish (Latin America) — ⚠️ confirmar; valorar publicar también en inglés.

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

Todas las capturas deben usar un **documento de prueba propio y sin datos personales**, nunca material ajeno ni con marca de terceros visible.

1. ✅ `store-assets/store-1.png` (1280×800): popup real sobre un documento de ejemplo propio, con nombre de archivo y selector de calidad a la vista. El documento de fondo es genérico, sin datos personales ni marcas de terceros.
2. ⬜ El overlay de progreso a mitad de exportación, mostrando "página 14 de 30".
3. ⬜ El PDF resultante ya abierto, con el panel de miniaturas visible para evidenciar que conserva todas las páginas y sus orientaciones.

`store-assets/` está en `.gitignore`; la captura es un asset de envío, no parte del código.

## Permissions Justification

> ⚠️ Confirmar contra el manifest final. Cada entrada se copia tal cual en el formulario del Developer Dashboard.

| Permission | Type | Justification |
|------------|------|---------------|
| `scripting` | permissions | Necesario para insertar, únicamente al pulsar el usuario el icono de la extensión, el código que lee las páginas ya renderizadas en la pestaña y las ensambla en un PDF. Sin este permiso la extensión no puede acceder al contenido visible que debe exportar. |
| `storage` | permissions | Guarda localmente las preferencias del usuario (nombre de archivo sugerido, nivel de calidad) y el progreso de la exportación en curso, para que la barra de progreso se restaure si el usuario cierra y reabre el popup. Ningún dato sale del dispositivo. |
| `https://drive.google.com/*` | host_permissions | El visor de documentos sobre el que opera la extensión se sirve en este dominio. El acceso se limita a leer las imágenes de las páginas ya mostradas en pantalla, solo tras un clic del usuario. |
| `https://docs.google.com/*` | host_permissions | Algunas vistas del mismo visor se cargan desde este dominio en un marco secundario. Sin él, la exportación falla en esos documentos. |

Nota para la revisión: **no** se solicita `tabs`, `downloads`, `<all_urls>` ni ningún permiso de red. Ver `PLAN.md` §5 (D2, D7).

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** **Sí — únicamente contenido web (imágenes de las páginas), procesado localmente y nunca transmitido.**

La FAQ de User Data de Chrome Web Store considera manejo de datos el hecho de capturar o recortar contenido de una web, aunque ocurra en el dispositivo. Por eso la declaración correcta es "Sí, website content", con el alcance local indicado. El código de la extensión no realiza peticiones de red: no hay servidor propio, analítica, telemetría ni `chrome.storage.sync` (solo `local` y `session`, que no salen del dispositivo). Las imágenes se procesan en memoria dentro de la pestaña y el PDF se guarda directamente en el disco del usuario.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | — | No |
| Health info | No | No | — | No |
| Financial info | No | No | — | No |
| Authentication info | No | No | — | No |
| Personal communications | No | No | — | No |
| Location | No | No | — | No |
| Web history | No | No | — | No |
| User activity | No | No | — | No |
| Website content | Sí — se lee en memoria solo al pulsar Exportar | No | Ensamblar el PDF que el usuario solicita | No |

> La fila "Website content" es la que debe coincidir con el formulario: la extensión **sí lee** las imágenes de las páginas, pero no las almacena ni las transmite. Declarar "No" contradiría el comportamiento del código; declarar "Sí, procesado localmente" es exacto y coherente con la política de privacidad.

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]

`https://sandovaldavid.github.io/pdf-page-exporter/privacy.html`

La política estará disponible en inglés en esa URL y en español en
`https://sandovaldavid.github.io/pdf-page-exporter/es/privacy.html` cuando se
ejecute el flujo `Deploy website`. El texto vive en `website/privacy.html` y
`website/es/privacy.html`; el flujo `Deploy website` de GitHub Actions publica
únicamente `website/`. La URL no depende de `/docs`.

## Distribution

**Visibility**: ⚠️ **Decisión pendiente — leer `PLAN.md` §7.** Recomendación: instalación local sin empaquetar como vía principal; si se publica, empezar en **Unlisted**.

**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]

⚠️ Pendiente.

**Contact Email** [REQUIRED]

sandovaldavid.eng@gmail.com — ⚠️ confirmar; este correo aparece **públicamente** en la ficha. Valorar una dirección dedicada.

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
| 0.1.0 | 2026-10-26 | Versión inicial: exportación a PDF con recorrido automático, tamaño de página por hoja, nombre de archivo editable, selector de calidad y barra de progreso cancelable. Verificada contra 4 documentos públicos reales (3, 7, 12 y 194 páginas), incluyendo apaisado y 194 páginas. Añadido botón "Exportar otro PDF" para reiniciar el popup tras una exportación. Ver Known Issues para lo que falta cubrir antes de publicar. | Draft |

## Review Notes

### Known Issues / Limitations

Cosas que la revisión puede señalar o que el usuario debe saber:

1. **Riesgo de política.** La función puede interpretarse como elusión de una restricción de descarga impuesta por el propietario del documento. Técnicamente no se rompe ningún cifrado ni control de acceso: solo se leen píxeles ya presentes en la pantalla del usuario, igual que una captura de pantalla. Aun así, la política de la tienda es más estricta que la ley. **Este es el motivo de rechazo más probable.**
2. **Dependencia del DOM de un sitio de terceros.** La extensión depende de la estructura del visor de documentos, que su propietario puede cambiar sin aviso. Si eso ocurre, la extensión avisa al usuario de que no encontró páginas en lugar de generar un PDF vacío.
3. **Salida ráster.** El PDF contiene imágenes, no texto: no es buscable ni accesible para lectores de pantalla. Está declarado en la descripción para no inducir a error.
4. **Fidelidad limitada.** La resolución depende del zoom del visor al exportar.
5. **Librería de terceros empaquetada.** jsPDF 4.2.1 (MIT) viaja minificada dentro del paquete (`src/vendor/jspdf.umd.min.js`), descargada del tarball oficial de npm y verificada contra el `shasum` publicado por el registro antes de incluirla. Nunca se carga en tiempo de ejecución. Minificada, no ofuscada; el encabezado de licencia se conserva. Las fuentes Inter y JetBrains Mono (SIL OFL 1.1) viajan con su licencia en `assets/fonts/OFL.txt`.
6. **Verificación en vivo parcial.** Probada contra 4 documentos públicos reales (3, 7, 12 y 194 páginas) en 2 variantes del visor, incluyendo un PDF apaisado y una exportación completa de 194 páginas con auto-scroll (8m19s, 26.9 MB, sin crashes ni páginas en blanco). Ver `docs/selectors.md` para el detalle. Aún sin probar: un documento que exija sesión de Google iniciada (el uso más común; no publicar sin cubrirlo) y un documento real con tamaños de página mixtos. Un iframe en un origen de terceros no está soportado por diseño.
7. **Documentos largos.** La duración crece con el número de páginas: 194 páginas tardaron ~8m19s en el entorno de prueba, con la barra de progreso avanzando. No es un cuelgue, pero conviene avisarlo en la ficha o en la UI si se quiere evitar que el usuario cancele por impaciencia.

### Rejection History

Sin envíos todavía.
