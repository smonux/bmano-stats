# Entrega Android 0.1.0 · histórica · 2026-10-28

Este informe conserva los datos de los binarios iniciales 0.1.0; no se renombran con cada actualización. Para la versión actual, consultar `artifacts/mobile/manifest.json` y su informe de verificación, generados de nuevo al compilar.

El usuario autorizó expresamente aceptar la licencia necesaria del SDK Android como excepción al encargo inicial. Se aceptó únicamente `android-sdk-license` (texto fechado 16-01-2019) en la instalación de Platform 36, Build Tools 35.0.0 y Platform Tools. No se ejecutó una aceptación global de licencias ni se aceptaron términos de las tiendas.

## Binarios reales

| Archivo en `artifacts/mobile/` | Bytes | Variante y firma |
| --- | ---: | --- |
| `handball-stats-0.1.0-debug.apk` | 21.500.685 | Debug, instalable para pruebas; firma v2 verificada por apksigner |
| `handball-stats-0.1.0-release-unsigned.aab` | 20.180.317 | Release, validado por bundletool 1.18.3; **sin firmar**, requiere upload key antes de Play |

SHA-256 del APK: `689308551baef01626dbbeb5e19dc54266c2a444539d285f443ab4233e6c67ed`.

SHA-256 del AAB: `d16e69fa792e9104dc79e3f4e51aa4a57803e07e1e206c008839bd962eb75a28`.

El manifest y `SHA256SUMS` enumeran también los ZIP y logs actuales. Tamaños de archivos medidos, no tamaño instalado ni descarga procesada por Google Play. Los archivos grandes quedan fuera de git.

La clave debug generada por Gradle permanece en la caché local del SDK, fuera de git y de los ZIP. Su certificado público tiene SHA-256 `f909860f614a02b04c38fb6e822a49d5c9d01b350c80a9844d4b1f73dd743699`. No es una clave de distribución ni se entrega su material privado. Conservar la misma firma si se prueban actualizaciones que deban mantener datos; no desinstalar para esa prueba.

## Qué se ha comprobado

- JDK Temurin 21.0.13, Gradle 8.14.3, AGP 8.13.0 y SDK 36: `:app:assembleDebug`, `:app:bundleRelease`, `:app:lintDebug` y `:app:assembleDebugAndroidTest` terminan correctamente.
- `:app:testDebugUnitTest` es `NO-SOURCE`: no se presenta como una suite JUnit ejecutada. `PackageAssetsTest` se ha compilado dentro del APK de instrumentación, pero **no se ha ejecutado**.
- Firma debug válida; AAB sin firmas JAR y no debuggable. `bundletool validate` correcto. `jarsigner -verify` por sí solo puede terminar con éxito para un JAR sin firmar; el verificador comprueba explícitamente ese estado.
- Identificador provisional, versión 0.1.0, code 1, minSdk 24 y target 36 coherentes en ambos manifiestos finales.
- Permisos finales: `INTERNET`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` y permiso interno `io.github.smonux.bmanostats.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`, protegido por firma. No hay permisos de cámara, contactos, ubicación ni almacenamiento amplio.
- Cada contenedor tiene un solo Whistle de 16.919.407 bytes con el SHA-256 fijado; ningún peso Needle. Todos los assets de `dist-native` coinciden por hash. Capacitor añade dos stubs Cordova vacíos, también comprobados. No hay bibliotecas nativas `.so` ni claves privadas en los contenedores.
- Lint: **0 errores, 28 avisos**. Incluyen versiones más recientes de herramientas/dependencias, orientación fija, reglas de extracción de datos no explícitas, orden del manifiesto y recursos/iconos de plantilla. Se conserva el informe completo; no se silencian los avisos ni se cambian versiones para esta entrega.

La primera invocación agregada de pruebas también intentó compilar los tests de todas las bibliotecas. Falló en el módulo Cordova generado, sin plugins, por dependencias Kotlin incompatibles en su APK de tests. La invocación final está limitada a `:app`, incluye nuestras pruebas instrumentadas y termina correctamente; no se afirma que las suites de las bibliotecas hayan pasado ni se modifica su grafo para ocultarlo. El primer log se conserva como `android-build-aggregate-tests-failed.log`.

## Repetir la verificación

```sh
npm run mobile:android
# SDK/JDK y bundletool en las rutas de caché indicadas por defecto, o usar los argumentos:
uv run scripts/verify-android.py --sdk /ruta/sdk --java-home /ruta/jdk21 --bundletool /ruta/bundletool-all-1.18.3.jar
npm run stores:package
sha256sum -c artifacts/mobile/SHA256SUMS
```

El verificador comprueba el hash del JAR oficial de bundletool 1.18.3. Descarga: [release oficial](https://github.com/google/bundletool/releases/tag/1.18.3). SHA-256 del JAR: `a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29`. La caché de herramientas no forma parte de los entregables.

`stores:package` exige un informe de verificación que corresponda al tamaño y hash actuales de cada binario, evitando adjuntar un resultado antiguo a un APK/AAB nuevo. No firma release, instala ni envía archivos a ningún servicio.

Se ha comprobado también el rechazo de un informe con hash alterado, restaurando después el informe original. El log `android-stale-receipt-test.log` conserva esa prueba negativa. El código de aplicación no cambia respecto a `b917e8c`; esta continuación añade verificadores, documentación y los artefactos Android.

## Pendiente real

ADB no encuentra dispositivos; no hay `/dev/kvm` ni emulador configurado. No se ha instalado el APK, ejecutado audio en WebView, probado compartir/selector nativos ni conservado datos entre dos instalaciones. Siguen pendientes pruebas con dispositivo/emulador, captura de tráfico, capturas nativas y las comprobaciones de teclado, zonas seguras, suspensión y actualización descritas en el checklist.

La orientación solicitada puede ignorarse en pantallas grandes con Android 16, según el aviso lint. `allowBackup=false` está en ambos manifiestos, pero no hay reglas de extracción de datos explícitas; no se garantiza bloquear transferencias de todos los fabricantes. Deben revisarse estos límites durante QA antes de distribución. Los avisos no se presentan como errores de compilación.

Faltan además firma release/Play App Signing, identidad/contactos/URLs del titular y preparación de cuenta. iOS sigue requiriendo macOS/Xcode y firma. No se ha comprado una cuenta, aceptado otro contrato ni subido nada a las tiendas.
