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

Implementación v0.1.0 verificada extremo a extremo contra 2 documentos PDF
reales (3 y 12 páginas) en las 2 variantes del visor de Google
(`docs.google.com/viewer` y `drive.google.com/file/d/…/view`), con la
extensión real instalada y un clic real en "Exportar PDF". Ver
`docs/selectors.md` para el detalle completo y lo que todavía falta probar
(documento apaisado, documento que exija sesión iniciada, 100+ páginas).

## Limitaciones conocidas

- La salida es **ráster** (imágenes), no texto: el PDF no permite buscar,
  seleccionar ni copiar texto, y no es accesible para lectores de pantalla.
- La nitidez depende del nivel de zoom del visor al momento de exportar —
  sube el zoom antes de exportar si quieres más resolución.
- Solo cubre el visor de PDF de Drive/Docs, no Google Docs/Sheets nativos
  ni otros visores.
- Los selectores del DOM de Google pueden romperse sin aviso cuando Google
  actualice su visor — ver `docs/selectors.md`.

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
y exportación completa contra 2 documentos reales públicos. Lo que falta,
antes de darla por completamente probada:

1. Un documento que exija sesión de Google iniciada (todo lo probado hasta
   ahora fue con enlaces públicos/compartidos).
2. Un documento apaisado o con tamaños de página mixtos real (la lógica de
   orientación por página se probó exhaustivamente con datos sintéticos,
   pero no contra un PDF apaisado real de Drive).
3. Un documento largo (100+ páginas), para confirmar memoria y que la
   virtualización no cambia de patrón a mayor escala.
4. El caso de iframe genuino (visor incrustado en un origen de terceros).

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
