# Chrome Web Store Listing — PDF Page Exporter

> Last Updated: 2026-07-27
> **Estado: borrador previo a la implementación.** Todavía no existe `manifest.json`; los valores marcados con ⚠️ deben confirmarse contra el manifest final. Ver `PLAN.md` §7 antes de decidir publicar.

## Store Listing

**Extension Name** [REQUIRED]

PDF Page Exporter

> ⚠️ Debe coincidir exactamente con `name` en `manifest.json`. Deliberadamente **no** contiene "Google", "Drive" ni "Unblocker": usar marcas ajenas en el nombre es motivo de rechazo, y una palabra como "Unblocker" sugiere elusión de protecciones. Máx. 75 caracteres.

**Short Description** [REQUIRED]

Exporta a PDF las páginas de un documento que ya se muestran en el visor de tu navegador.

> 88 caracteres. Debe coincidir con `description` en el manifest (límite 132).

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

Privacidad: la extensión funciona por completo dentro de tu navegador. No envía nada a ningún servidor, no recopila datos, no incluye analítica y no necesita conexión a internet para hacer su trabajo. Solo se activa cuando haces clic en su icono.

Ten en cuenta: el PDF resultante contiene imágenes de las páginas, por lo que no permite buscar ni seleccionar texto. La nitidez depende de cómo se vea el documento en pantalla al exportarlo.

Usa esta extensión únicamente con documentos a los que tengas acceso legítimo y respetando los derechos de autor y las condiciones bajo las que recibiste el documento.

Dudas o problemas: ⚠️ pendiente (enlace a GitHub Issues).
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
| Store Icon [REQUIRED] | 128×128 PNG | ⬜ Not created | `icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | ⬜ Not created | |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ⬜ Not created | |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ Not created | |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | |

### Screenshot Notes

Todas las capturas deben usar un **documento de prueba propio y sin datos personales**, nunca material ajeno ni con marca de terceros visible.

1. El popup abierto sobre un documento, con el campo de nombre de archivo y el selector de calidad a la vista.
2. El overlay de progreso a mitad de exportación, mostrando "página 14 de 30".
3. El PDF resultante ya abierto, con el panel de miniaturas visible para evidenciar que conserva todas las páginas y sus orientaciones.

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

**Does the extension collect user data?** **No**

La extensión no realiza ninguna petición de red. No hay servidor propio, ni analítica, ni telemetría, ni `chrome.storage.sync` (solo `local` y `session`, que no salen del dispositivo). Las imágenes de las páginas se procesan en memoria dentro de la pestaña y el PDF se guarda directamente en el disco del usuario.

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
| Website content | No — se lee en memoria, no se almacena ni se transmite | No | Ensamblar el PDF que el usuario solicita | No |

> La fila "Website content" merece atención: la extensión **sí lee** contenido de la página (las imágenes de las páginas). Lo que no hace es recopilarlo ni transmitirlo. Describirlo así, con precisión, es lo correcto: una discrepancia entre el formulario y el comportamiento del código causa rechazo.

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]

⚠️ Pendiente. Publicar en GitHub Pages del repositorio antes de enviar, y **visitar la URL para confirmar que carga** (un 404 aquí es rechazo inmediato). El texto debe decir explícitamente que no se recoge ni transmite ningún dato, en coherencia con la sección anterior.

## Distribution

**Visibility**: ⚠️ **Decisión pendiente — leer `PLAN.md` §7.** Recomendación: instalación local sin empaquetar como vía principal; si se publica, empezar en **Unlisted**.

**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]

⚠️ Pendiente.

**Contact Email** [REQUIRED]

sandovaldavid.eng@gmail.com — ⚠️ confirmar; este correo aparece **públicamente** en la ficha. Valorar una dirección dedicada.

**Support URL / Email** [RECOMMENDED]

⚠️ Pendiente (GitHub Issues del repositorio).

**Homepage URL** [RECOMMENDED]

⚠️ Pendiente.

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.1.0 | — | Versión inicial: exportación a PDF con recorrido automático, tamaño de página por hoja, nombre de archivo editable, selector de calidad y barra de progreso cancelable. | Draft (sin implementar) |

## Review Notes

### Known Issues / Limitations

Cosas que la revisión puede señalar o que el usuario debe saber:

1. **Riesgo de política.** La función puede interpretarse como elusión de una restricción de descarga impuesta por el propietario del documento. Técnicamente no se rompe ningún cifrado ni control de acceso: solo se leen píxeles ya presentes en la pantalla del usuario, igual que una captura de pantalla. Aun así, la política de la tienda es más estricta que la ley. **Este es el motivo de rechazo más probable.**
2. **Dependencia del DOM de un sitio de terceros.** La extensión depende de la estructura del visor de documentos, que su propietario puede cambiar sin aviso. Si eso ocurre, la extensión avisa al usuario de que no encontró páginas en lugar de generar un PDF vacío.
3. **Salida ráster.** El PDF contiene imágenes, no texto: no es buscable ni accesible para lectores de pantalla. Está declarado en la descripción para no inducir a error.
4. **Fidelidad limitada.** La resolución depende del zoom del visor al exportar.
5. **Librería de terceros empaquetada.** jsPDF viaja minificada dentro del paquete, nunca se descarga en tiempo de ejecución. Minificada, no ofuscada. ⚠️ Anotar aquí la versión exacta al implementar.

### Rejection History

Sin envíos todavía.
