# Paquetes y tiendas · preparación 2026-10-28

Esta entrega prepara Android/iOS con Capacitor 8.6.0 y la app local; no publica, no envía a revisión y no acepta contratos. La web conserva su compilación habitual. Identificador **provisional**: `io.github.smonux.bmanostats`; versión `0.1.0`, build/versionCode `1`. Confirmar titular e identificador antes de reservarlos en las tiendas.

## Estado real

| Entregable | Estado |
| --- | --- |
| Proyecto Android | Generado; minSdk 24, compile/target 36; permisos fuente auditados |
| APK de prueba | No generado: la compilación se detiene por licencia SDK no aceptada |
| AAB release | No generado por el mismo bloqueo; no hay firma de distribución |
| Proyecto Xcode iPhone | Generado con SPM, iconos, lanzamiento, privacidad y micrófono en 7 idiomas |
| Archive / IPA | No generado: entorno Linux sin macOS/Xcode/firma |
| App local + Whistle | Incluidos en `dist-native`; un Whistle de 16.919.407 bytes para los siete idiomas; no se incluyen modelos Needle |
| Runtime nativo Android / iOS | Pendiente de compilar/ejecutar en emulador, simulador y dispositivos; no se da por probada la compatibilidad WebView |
| Material de tienda | Textos y permisos localizados, política y respuestas propuestas; datos del titular/URLs pendientes |
| Capturas | Renderizaciones auténticas de la app con datos ficticios, identificadas como navegador; las capturas nativas quedan pendientes |

Las rutas exactas, tamaños y SHA-256 de los archivos producidos se enumeran en `artifacts/mobile/manifest.json` después de `npm run stores:package`. Un ZIP de proyecto **no es** un APK, AAB ni IPA. El tamaño del ZIP y de los assets se mide; tamaño instalado y descarga de tienda quedan sin medir hasta compilar y usar las herramientas de cada tienda.

## Índice

- [Compilar, firmar y preparar beta](compilacion-y-entrega.md).
- [Auditoría técnica, pruebas y límites](validacion.md).
- [Fuentes oficiales y requisitos fechados](fuentes.md).
- [Textos localizados](listings.json), validados por `npm run stores:check`: título/Google breve/subtítulo/descr./keywords/novedades. Los nombres de marca no cambian.
- [Privacidad y declaraciones propuestas](privacidad-y-formularios.md); [políticas localizadas, pendientes de titular](privacy/).
- [Revisión, edad y checklist](revision-y-checklist.md).
- [Licencias](licenses/README.md), inventario NPM y textos, modelo/runtime.
- [Recursos gráficos](assets/) y [justificación de micrófono en los 7 idiomas](microphone-usage.json).

## Bloqueos que requieren al titular

1. El SDK disponible tiene una licencia antigua preexistente. SDK Manager y Gradle rechazan Platform 36 / Build Tools 35.0.0; no se ha aceptado la licencia de 2019 ni se han añadido hashes para simular aceptación. El encargo prohíbe aceptar contratos. Hace falta autorización específica o un SDK preparado por el titular.
2. Mac con Xcode 26+, firma y cuenta Apple para validar/archivar; los workers/WASM/AudioWorklet de WKWebView se deben probar realmente. No se sustituye Whistle por otra API.
3. Titular legal, contacto de soporte, URL pública de privacidad/soporte, confirmación del app ID, países, precio, tipo de cuenta y declaraciones. `smonux` es el copyright MIT existente, no una identidad legal inventada.
4. QA nativa, capturas de dispositivo/simulador y auditoría del manifiesto **fusionado** / archive final, antes de subir. No hay autorización de publicación.

La migración web → app se hace exportando ZIP en la web e importándolo en Ajustes de la app. Ambos contenedores no comparten automáticamente IndexedDB. Conservar appId, hostname y base Dexie al actualizar; nunca desinstalar para probar una actualización conservando datos.
