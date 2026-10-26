# PDF Page Exporter

Extensión de Chrome (Manifest V3) que exporta a un PDF descargable las páginas
de un documento que el visor de Google Drive/Docs **ya renderizó en
pantalla**. No descifra nada ni elude ninguna protección: solo lee píxeles
que el navegador ya te está mostrando, igual que una captura de pantalla,
recorriendo el documento automáticamente y ensamblando cada página en su
tamaño y orientación reales.

Ver `PLAN.md` para el diseño completo, la auditoría del prototipo original y
las decisiones técnicas. Ver `CHROMEWEBSTORE.md` para la ficha de la tienda.

## Estado actual

Implementación v0.1.0 verificada extremo a extremo contra 4 documentos PDF
reales (3, 7, 12 y 194 páginas) en las 2 variantes del visor de Google
(`docs.google.com/viewer` y `drive.google.com/file/d/…/view`), incluyendo un
documento apaisado y uno de 194 páginas, con la extensión real instalada y un
clic real en "Exportar PDF". La suite E2E (`test/run.sh`) ejecuta 30
comprobaciones de navegador y verifica los PDF con `pdfinfo`/`pdftoppm`. Ver
`docs/selectors.md` para el detalle completo y lo que todavía falta probar
(documento que exija sesión iniciada, tamaños de página mixtos).

## Limitaciones conocidas

- La salida es **ráster** (imágenes), no texto: el PDF no permite buscar,
  seleccionar ni copiar texto, y no es accesible para lectores de pantalla.
- La nitidez depende del nivel de zoom del visor al momento de exportar —
  sube el zoom antes de exportar si quieres más resolución.
- Solo cubre el visor de PDF de Drive/Docs, no Google Docs/Sheets nativos
  ni otros visores.
- Los selectores del DOM de Google pueden romperse sin aviso cuando Google
  actualice su visor — ver `docs/selectors.md`.
- Los documentos largos tardan: la prueba de 194 páginas tomó ~8m19s en
  calidad equilibrada, porque el visor se recorre y se codifica página por
  página.

## Instalación en modo desarrollador

1. Clona este repositorio.
2. Abre `chrome://extensions/` en Chrome.
3. Activa "Modo de desarrollador" (esquina superior derecha).
4. Haz clic en "Cargar descomprimida" y selecciona la carpeta del repositorio
   (la que contiene `manifest.json`).
5. El icono de la extensión aparecerá en la barra de extensiones.

## Uso

1. Abre un documento en el visor de Drive y espera a que cargue la primera
   página.
2. Haz clic en el icono de la extensión.
3. Ajusta el nombre del archivo, la calidad, y si quieres recorrido
   automático.
4. Pulsa "Exportar PDF" y espera a que termine.
5. El PDF se descarga a tu carpeta de descargas habitual.

Usa esta extensión solo con documentos a los que tengas acceso legítimo,
respetando los derechos de autor y las condiciones bajo las que recibiste
el documento.

## Privacidad

La extensión procesa las imágenes de las páginas localmente y no las envía a
ningún servidor: no hay analítica, telemetría ni `storage.sync`. La política
completa está en `docs/privacy.html`; para la ficha de la tienda se publica en
GitHub Pages (pendiente de habilitar, ver `CHROMEWEBSTORE.md`).

## Estructura del proyecto

```
manifest.json              Manifest V3
src/popup/                 UI del popup (formulario, progreso, resultado)
src/content/
  page-detector.js         Cascada de selectores del visor (único lugar que los conoce)
  capture.js                Auto-scroll, captura por página y ensamblado del PDF
src/background/
  service-worker.js         Relay de progreso + estado persistido en storage.session
src/vendor/
  jspdf.umd.min.js          jsPDF 4.2.1, empaquetado (nunca cargado desde CDN)
src/styles/
  tokens.css                Design tokens de la Identity System de David Sandoval (docs/design-system.md)
assets/fonts/
  inter-variable-latin.woff2          Fuente variable, empaquetada (nunca cargada desde CDN)
  jetbrains-mono-variable-latin.woff2 Fuente variable, empaquetada (nunca cargada desde CDN)
icons/                      icon.svg (fuente) + PNG generados en 16/48/128px
scripts/
  generate-icons.sh         Rasteriza icons/icon.svg a los tres tamaños (requiere ImageMagick)
  package-extension.sh      Genera el ZIP de distribución/tienda
docs/selectors.md           Estado de verificación de los selectores del visor
docs/privacy.html           Política de privacidad para la ficha de la tienda
```

## Desarrollo

Regenerar iconos tras editar `icons/icon.svg`:

```bash
./scripts/generate-icons.sh
```

Actualizar jsPDF: descargar el tarball de npm (`registry.npmjs.org/jspdf`),
verificar su `shasum` contra el que publica el registro, y copiar
`dist/jspdf.umd.min.js` a `src/vendor/`.

Empaquetar para distribución/tienda:

```bash
./scripts/package-extension.sh
```

## Pruebas

Ya verificado (ver `docs/selectors.md` para el detalle): detección de
páginas, orden, contenedor scrollable, auto-scroll con virtualización real,
y exportación completa contra 4 documentos reales públicos (3, 7, 12 y 194
páginas), incluyendo un PDF apaisado. La suite E2E cubre 30 comprobaciones de
navegador más la verificación externa de los PDF. Lo que falta, antes de
darla por completamente probada:

1. Un documento que exija sesión de Google iniciada (todo lo probado hasta
   ahora fue con enlaces públicos/compartidos). Bloqueado hasta disponer de
   una URL y una sesión.
2. Un documento real con tamaños de página mixtos (no se encontró un PDF
   público mixto; el caso apaisado puro ya está verificado).
3. Memoria pico y determinismo en documentos largos: la corrida de 194
   páginas no crasheó y la pestaña siguió respondiendo, pero no se muestreó
   el RSS durante toda la captura ni se repitió la corrida.
4. Iframe de origen distinto: no soportado por diseño. El popup solo se
   activa si la pestaña de nivel superior es `drive.google.com` o
   `docs.google.com`; ampliar los permisos empeoraría la revisión de la
   tienda.

## Diseño

Los estilos del popup y del overlay de progreso siguen la Identity System
personal de David Sandoval — ver `docs/design-system.md` para la fuente de
verdad (colores, tipografía, espaciado). `src/styles/tokens.css` es la
implementación en CSS; ningún componente debe usar colores hardcodeados
fuera de ese archivo.

El icono actual es un glifo genérico (documento + flecha de descarga)
recoloreado al azul de marca (`#0A5CD6`), **no** el isotype/slash oficial de
la Identity System: ese logo no está embebido en `design-system.md` (solo
tokens y referencias a nodos de Figma) y recrearlo a mano sin el archivo
fuente arriesga una versión no aprobada de la marca personal. Para usar el
isotype real, exporta los assets aprobados desde Figma (`Logo / Favicon`,
sección 16 del design system) y reemplaza `icons/icon.svg`.

## Licencia de terceros

- `src/vendor/jspdf.umd.min.js` — jsPDF 4.2.1 (MIT), sin modificar. El
  encabezado de licencia original se conserva en el propio archivo.
- `assets/fonts/inter-variable-latin.woff2` — Inter (SIL Open Font
  License), variable, subset a caracteres latinos.
- `assets/fonts/jetbrains-mono-variable-latin.woff2` — JetBrains Mono (SIL
  Open Font License), variable, subset a caracteres latinos.

El texto completo de ambas licencias viaja con el paquete en
`assets/fonts/OFL.txt`.
