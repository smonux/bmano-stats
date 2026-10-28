# Dossier de licencias

`npm-production.json` inventaría el cierre de dependencias NPM instaladas que no están marcadas solo de desarrollo: 42 paquetes en esta preparación. Los textos originales se copian a `texts/`, con SHA-256 por archivo. Esto es deliberadamente más amplio que los símbolos que acaba eliminando el bundler. `npm run stores:licenses` lo regenera; no sustituye al grafo final Maven/SPM del binario nativo.

| Recurso | Licencia / evidencia |
| --- | --- |
| Proyecto | MIT, copyright smonux, `LICENSE`. Confirmar identidad legal para tiendas aparte. |
| cactus-needle 0.3.0 | Apache-2.0 + NOTICE; wrapper independiente, no SDK oficial Cactus. |
| Runtime WASM/loader | Apache-2.0 de Cactus Compute, revisión `2ae11323dc000f5e70c49f7403efa6af12ba9e67`; manifiesto original en node_modules/cactus-needle/vendor/manifest.json. |
| Whistle | Apache-2.0, revisión `b358ddadd89b7a713b5aa131f23032d3cca1b251`, 16.919.407 bytes, SHA-256 `b6e02f048568ac5d01a2042556c658061e699acbc0aa2a1439f52f3d461dffeb`. [Licencia exacta](https://huggingface.co/Cactus-Compute/whistle/blob/b358ddadd89b7a713b5aa131f23032d3cca1b251/LICENSE). Se incluye una copia del texto Apache y NOTICE; no se alteran pesos. |
| Capacitor core/android/ios 8.6.0; App 8.1.2; Filesystem 8.1.5; Share 8.0.3 | MIT, textos NPM. SPM usa capacitor-swift-pm 8.6.0; Filesystem declara ion-ios-filesystem 2.0.1. Resolver y archivar sus avisos finales en Mac antes de distribución. |
| AndroidX / Cordova / Gradle wrapper | Revisar grafo Maven resuelto con las versiones del proyecto. Predominan Apache-2.0; no se da por completada auditoría nativa mientras la compilación/SDK esté bloqueada. No se distribuye el JDK/SDK descargado en los ZIP del producto. |
| React, Dexie, jsPDF, fflate, Zod y dependencias | Inventario y textos concretos en JSON; DOMPurify ofrece MPL-2.0 o Apache-2.0 y se conservan ambos textos suministrados, sin afirmar que todo el producto tenga una sola licencia. |
| Iconos de eventos | Lucide, licencia del paquete incluida. |
| Fuentes PDF | DejaVu; texto ya existente `public/third-party/DejaVu-fonts-LICENSE.txt`, incluido al copiar public. Los nombres de archivo handball-sans no cambian su licencia. |
| Balón y lanzamiento | Vector aprobado del proyecto, reutilizado sin sustituirlo por una ilustración de Capacitor. El titular debe confirmar derechos de marca/autor antes de publicar. Homenaje a La Jota no implica afiliación oficial. |
| Sonido de exclusión | Adaptación sintética breve propia de la composición de Cristóbal Oudrid, sin grabación de tercero. Revisar jurisdicciones/derechos aplicables con el titular; no se distribuye la partitura como material gráfico. |
| WAV de tests | Piper, solo en tests; excluidos del bundle móvil y de fichas públicas. No se incluyen en binarios como ejemplos de voz del usuario. |

El bundle móvil incorpora `licenses/` (inventario y textos NPM, Apache/NOTICE de Cactus y MIT del proyecto) y conserva `third-party/` de la web. La herramienta verifica el tamaño/hash del modelo y elimina variantes Needle copiadas desde public, evitando 47 MB innecesarios y copias adicionales del modelo dentro de cada paquete.

`npm audit --omit=dev` no informó vulnerabilidades en dependencias de producción en la consulta de 2026-10-28; el JSON de esa consulta se entrega en artefactos. No es una garantía de seguridad ni sustituye a QA, avisos nativos y revisión de las versiones finales.
