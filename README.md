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

Implementación inicial (v0.1.0) completa y sin errores de sintaxis, pero
**sin verificar todavía contra un documento real de Google Drive** ni en un
navegador Chrome real — ver `docs/selectors.md` y la sección de Pruebas más
abajo antes de confiar en ella con documentos importantes.

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

## Pruebas — pendiente

La verificación contra el visor real de Google Drive (Fase 0 y Fase 5 del
`PLAN.md`) no se ha realizado todavía: requiere una sesión de Chrome con un
documento propio abierto, algo que hay que hacer manualmente. Antes de dar
por buena esta extensión:

1. Carga un PDF propio en `drive.google.com`.
2. Instala la extensión en modo desarrollador (arriba) y expórtalo.
3. Compara el PDF resultante con el original (número de páginas, orientación,
   nitidez).
4. Repite con un documento largo (100+ páginas), uno apaisado y uno con
   tamaños de página mixtos.
5. Anota en `docs/selectors.md` qué estrategia de detección se usó realmente
   (queda expuesta en consola vía `strategyUsed` si añades un `console.log`
   temporal en `page-detector.js`) y ajusta la cascada si hace falta.

## Licencia de terceros

`src/vendor/jspdf.umd.min.js` es jsPDF 4.2.1 (MIT), sin modificar. El
encabezado de licencia original se conserva en el propio archivo.
