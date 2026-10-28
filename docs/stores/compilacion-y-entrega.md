# Compilación, firma y beta

## Hecho aquí / pendiente

Se generan proyectos, assets y bundle web móvil con el mismo Whistle que usa la web. No hay APK/AAB por la licencia SDK no aceptada, ni archive/IPA por ausencia de macOS/Xcode/firma. No se han creado claves de distribución, certificados, cuentas, contratos ni publicaciones.

## Reproducir assets y sincronización

```sh
npm ci
npm run check
npm run mobile:assets
npm run mobile:sync
npm run stores:check
```

`mobile:assets` usa Chromium (`CHROMIUM_PATH` si ya está instalado). `mobile:build` descarga Whistle solo si no está en `WHISTLE_MODEL_PATH` o `node_modules/.cache/voice-models/whistle.cact`; comprueba tamaño y SHA-256. Necesita Internet en la máquina de compilación si falta el modelo. No se descargan pesos al ejecutar la app nativa. `dist` y `dist-native` están separados; la web conserva su SW, el bundle móvil lo omite. No usar `cap add` otra vez sobre estos proyectos.

Identificador provisional `io.github.smonux.bmanostats`, versión 0.1.0/build 1. Antes de registrar la app, confirmar identificador y titular. Cambiarlo después crea otra app y otro almacenamiento. No alterar el origen local `localhost` ni el nombre/esquema Dexie en actualizaciones sin migración probada.

## Android

Requisitos: JDK 21 completo, Android SDK Platform 36 y Build Tools 35.0.0 usados por AGP 8.13.0, licencias válidamente aceptadas por el titular. La caché local de esta máquina no es parte del entregable. No copiar hashes de licencia de Internet ni ejecutar aceptación automática. El titular puede proporcionar su SDK con `ANDROID_HOME`.

```sh
npm run mobile:sync
cd android
./gradlew assembleDebug bundleRelease --no-daemon
```

Si termina correctamente: `app/build/outputs/apk/debug/app-debug.apk` tiene firma de debug y sirve para pruebas; `app/build/outputs/bundle/release/app-release.aab` queda sin firma si no se configura release. No se denominan artefactos obtenidos hasta que esos archivos existan y se verifiquen.

Instalar APK **solo en dispositivo/emulador de pruebas autorizado**: `adb install -r app-debug.apk`. Para probar conservación, instalar una versión anterior con el mismo app ID y firma, crear datos, después `adb install -r` de la nueva. Borrar datos o desinstalar invalida esa prueba.

`./gradlew connectedDebugAndroidTest` ejecuta `PackageAssetsTest` en un dispositivo/emulador conectado: comprueba el modelo incluido por tamaño/hash y los permisos finales. Este test nativo está preparado pero **no se ha ejecutado** por el bloqueo SDK; no se cuenta entre las pruebas correctas de navegador/unitarias.

El titular debe crear/proteger una upload key, registrar Play App Signing y configurar firma release fuera de git. No introducir contraseñas en scripts o argumentos visibles; usar secret store/Gradle properties locales fuera del repo. Tras firmar: `apksigner verify --verbose` para APK, `jarsigner -verify` para AAB y `bundletool validate --bundle=...`; medir con `bundletool get-size total` sobre APKs generados. Auditar el manifiesto fusionado (`processReleaseMainManifest`) y permisos finales con `aapt2 dump permissions`/APK Analyzer. Los manifests fuente auditados no sustituyen este paso.

En Play Console: crear app con titular/país/precio confirmados; completar ficha, contenido, privacidad, edad y pruebas; subir AAB firmado al track interno, luego cerrado si la cuenta lo exige. Capturas, licencia del SDK, aceptación de términos y envío siguen pendientes del titular. No se ejecutan esos pasos aquí.

## iOS / iPhone

Mac con Xcode 26+ y SDK iOS 26+; proyecto SPM `ios/App/App.xcodeproj`. Tras `npm ci` y `mobile:sync`, abrir el proyecto, resolver paquetes y seleccionar Team/Bundle ID. El mínimo de despliegue del proyecto es iOS 15; hace falta validar las APIs de audio/workers en ese mínimo antes de mantenerlo para distribución. Si no funcionan, elevar el mínimo solo con evidencia o resolver la compatibilidad, sin sustituir el motor silenciosamente.

```sh
xcodebuild -resolvePackageDependencies -project ios/App/App.xcodeproj -scheme App
xcodebuild -project ios/App/App.xcodeproj -scheme App -destination 'generic/platform=iOS Simulator' -configuration Debug CODE_SIGNING_ALLOWED=NO build
xcodebuild -project ios/App/App.xcodeproj -scheme App -destination 'generic/platform=iOS' -configuration Release -archivePath build/HandballStats.xcarchive archive
```

Los dos últimos comandos **no se han ejecutado** en Linux. Archive requiere firma/Team/provisioning del titular. Exportar desde Organizer con el método de distribución de App Store Connect, o `xcodebuild -exportArchive` con un ExportOptions.plist propio. No se entrega un plist con Team inventado. Un ZIP de fuentes no es un archive ni un IPA.

Antes de TestFlight: comprobar audio, módulo Worker, WASM, AudioWorklet y URLs `capacitor://localhost` en WKWebView; la prueba de assets en Chromium HTTP no demuestra esa compatibilidad. `model` se entrega al SDK como bytes para evitar su restricción de URL HTTP(S), pero los workers/recursos de iOS siguen siendo una prueba obligatoria. Exportar informe de privacidad del archive, revisar SDKs/required-reason APIs, firma y protección de archivos. Capturar en simulador/dispositivo con `xcrun simctl io booted screenshot ...`; no redimensionar capturas web para presentarlas como simulador.

Subir desde Xcode/Transporter, completar App Store Connect y beta interna; beta externa puede necesitar revisión. Publicación y envío a revisión requieren instrucción nueva. No se esperan ni se disparan despliegues Render para construir estos proyectos.

## Transferir partidos de la web

Exportar ZIP desde Ajustes de la web; conservar esa copia. En la app, Ajustes → Elegir archivo ZIP o JSON → revisar resumen → confirmar. Restaurar sustituye las colecciones actuales. PDF es para compartir, no restaura. Los originales y las transcripciones se conservan; el tutorial no traduce datos de usuario ni escribe partidos ficticios.
