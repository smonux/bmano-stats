# Paquetes y tiendas · actualización 1.0.0 · 2026-10-30

Esta entrega prepara Android/iOS con Capacitor 8.6.0 y la app local; no publica ni envía a revisión. Tras autorización expresa del usuario se ha aceptado **solo** `android-sdk-license` para instalar el SDK y compilar. La excepción no autoriza contratos de tiendas ni otros términos. La web conserva su compilación habitual. Identificador **provisional**: `io.github.smonux.bmanostats`; versión `1.0.0`, build/versionCode `2`. Confirmar titular e identificador antes de reservarlos en las tiendas. La [política de versiones](../versionado.md) sincroniza las plataformas; la [entrega inicial 0.1.0](entrega-android.md) conserva sus datos históricos.

## Estado real

| Entregable | Estado |
| --- | --- |
| Proyecto Android | Compilado; minSdk 24, compile/target 36; permisos finales de APK y AAB auditados |
| APK de prueba | Generado y firma debug verificada; versión, bytes y hash en el manifest de artefactos. No instalado ni probado en dispositivo |
| AAB release | Generado y validado por bundletool; versión, bytes y hash en el manifest de artefactos; **sin firma**, no listo para subir a Play |
| Proyecto Xcode iPhone | Generado con SPM, iconos, lanzamiento, privacidad y micrófono en 7 idiomas |
| Archive / IPA | No generado: entorno Linux sin macOS/Xcode/firma |
| App local + Whistle | Incluidos en `dist-native`; un Whistle de 16.919.407 bytes para los siete idiomas; no se incluyen modelos Needle |
| Runtime nativo Android / iOS | Android compilado, ejecución pendiente; iOS sin build Xcode. No se da por probada la compatibilidad WebView |
| Material de tienda | Textos y permisos localizados, política y respuestas propuestas; datos del titular/URLs pendientes |
| Capturas | Renderizaciones auténticas de la app con datos ficticios, identificadas como navegador; las capturas nativas quedan pendientes |

Las rutas exactas, tamaños y SHA-256 de los archivos producidos se enumeran en `artifacts/mobile/manifest.json` después de `npm run stores:package`. Un ZIP de proyecto **no es** un APK, AAB ni IPA. El tamaño del ZIP y de los assets se mide; tamaño instalado y descarga de tienda quedan sin medir hasta compilar y usar las herramientas de cada tienda.

## Índice

- [Compilar, firmar y preparar beta](compilacion-y-entrega.md).
- [Entrega Android inicial 0.1.0, firma y verificaciones](entrega-android.md); el recibo actual se genera en `artifacts/mobile/manifest.json`.
- [Auditoría técnica, pruebas y límites](validacion.md).
- [Fuentes oficiales y requisitos fechados](fuentes.md).
- [Textos localizados](listings.json), validados por `npm run stores:check`: título/Google breve/subtítulo/descr./keywords/novedades. Los nombres de marca no cambian.
- [Privacidad y declaraciones propuestas](privacidad-y-formularios.md); [políticas localizadas, pendientes de titular](privacy/).
- [Revisión, edad y checklist](revision-y-checklist.md).
- [Licencias](licenses/README.md), inventario NPM y textos, modelo/runtime.
- [Recursos gráficos](assets/) y [justificación de micrófono en los 7 idiomas](microphone-usage.json).

## Bloqueos que requieren al titular

1. Firma release: hace falta upload key protegida y configuración del titular para firmar el AAB y registrar Play App Signing. La firma debug del APK solo es para pruebas. El bloqueo de licencia SDK está resuelto con la autorización específica posterior al encargo.
2. Mac con Xcode 26+, firma y cuenta Apple para validar/archivar; los workers/WASM/AudioWorklet de WKWebView se deben probar realmente. No se sustituye Whistle por otra API.
3. Titular legal, contacto de soporte, URL pública de privacidad/soporte, confirmación del app ID, países, precio, tipo de cuenta y declaraciones. `smonux` es el copyright MIT existente, no una identidad legal inventada.
4. QA nativa y capturas de dispositivo/simulador, revisión de los avisos lint y del archive iOS final antes de subir. Los manifiestos finales de APK/AAB ya están comprobados; eso no verifica audio, permisos en ejecución ni conservación tras actualizar. No hay autorización de publicación.

La migración web → app se hace exportando ZIP en la web e importándolo en Ajustes de la app. Ambos contenedores no comparten automáticamente IndexedDB. Conservar appId, hostname y base Dexie al actualizar; nunca desinstalar para probar una actualización conservando datos.
