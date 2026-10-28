# Evidencia y límites de la preparación móvil

Fecha de trabajo: 2026-10-28. Rama de trabajo `main`; ningún envío a tiendas. Los logs y archivos grandes se entregan fuera de git en `artifacts/`.

## Comprobaciones terminadas

| Comprobación | Resultado real |
| --- | --- |
| TypeScript / build web / build móvil | Correctos; `dist` PWA y `dist-native` separados; sincronización Capacitor Android/iOS correcta |
| Unitarias | 166 correctas en 35 archivos: dominio existente y seis casos nuevos de integridad/archivos/capacidades nativas |
| Regresión web | 43 casos de Chromium móvil emulado/escritorio correctos y una omisión prevista del PDF largo móvil; voz real/offline, siete idiomas, tutorial, contadores, ZIP y PDF |
| Bundle móvil servido localmente | 2 casos correctos: sin caché previa ni acceso a hosts externos, Whistle/WASM/workers y PCM de prueba reales; cancelación al evento de segundo plano; recarga, restauración, ZIP y PDF/fonts bajo CSP |
| Atrás / diálogos | 4 casos correctos en navegador de componentes: manejador nativo real cancela restauración sin importar datos y cierra menú restaurando foco |
| Metadata | Siete fichas dentro de límites de Google y Apple; keywords verificadas en bytes UTF-8; versiones coherentes con Android/Xcode |
| Proyecto iOS | OpenStep/plists parseados correctamente; PrivacyInfo en fase Resources y siete InfoPlist.strings referenciados. No equivale a build Xcode |
| Recursos | Balón aprobado en iconos/lanzamiento; iconos 512/1024 y feature 1024×500. Revisión visual de icono y referencias en los siete idiomas |
| Capturas | 42 renderizaciones auténticas de la app en Chromium: 7 idiomas × 2 dimensiones × 3 pantallas. 1080×1920 y 1320×2868; no son capturas Android/iPhone nativos |
| Dependencias / licencias | 42 paquetes NPM de producción inventariados con textos; audit de producción sin vulnerabilidades reportadas en esa consulta. Grafo/binario nativo aún por revisar |

## Lo que se corrigió durante las pruebas

- Con pesos ya incluidos, el estado podía ser cached antes de elegir idioma. La captura intentaba preparar demasiado pronto. Ahora solo prepara automáticamente cuando se ha elegido idioma; el flujo web sigue pasando las pruebas.
- El nuevo test de backup suponía orden de inserción, mientras IndexedDB devuelve por clave. Se comprueban identidades y todos los valores ordenando por ID; no se modifica repositorio ni se omite ningún registro.
- La primera generación de capturas modificó nombres ficticios sin su nameKey y el validador rechazó esa copia. Se corrigió el fixture, sin relajar la validación de la app; la tanda final produce 42 imágenes.
- Al auditar el selector nativo de compartir se conserva cancelación sin descarga alternativa ni falso aviso de éxito. El archivo temporal usa ruta privada y nombre acotado en bytes para nombres Unicode largos; su contenido no cambia.
- Atrás nativo envía cancel al diálogo abierto, no un Escape sintético que no dispararía el comportamiento nativo del navegador. El editor/confirmación conservan sus reglas actuales.
- La comprobación de capacidades nativas consulta las APIs de captura, AudioWorklet y Crypto sin exigir el indicador HTTPS de un navegador. No pide permiso de micrófono durante esa comprobación; el esquema propio de iOS sigue pendiente de prueba en WKWebView.

No se usan sleeps para disimular persistencia o preparación. Se observan cierre de diálogos, estado del micrófono, botones habilitados, cuerpos/hash reales y descargas efectivas.

## Android: bloqueo real

Se preparó JDK 21 y se ejecutaron SDK Manager y `gradlew assembleDebug bundleRelease` sin entrada para aceptar términos. La licencia antigua presente en el entorno no cubre los paquetes requeridos. Gradle falla al instalar Platform 36 y Build Tools 35.0.0 por licencias no aceptadas. Log: `artifacts/mobile/logs/android-build-blocked.log`; intento SDK: `sdk-install-blocked.log`. No se fabrican APK/AAB vacíos ni se renombran ZIPs.

No se ha firmado un APK de debug ni release, no hay AAB, no hay APK instalado y no hay tamaño instalado medido. No se ha validado el manifiesto fusionado ni una actualización instalada; solo las fuentes de app/plugins seleccionados. Se necesitan licencia/autorización o SDK preparado por el titular y repetición de la compilación.

## iOS: límites concretos

Linux no tiene Xcode/macOS ni certificados/profiles del titular. Se genera el proyecto SPM iPhone, sin archive ni IPA. La estructura de recursos se valida con `uv run scripts/validate-ios-project.py`; el informe declara `xcodeBuildExecuted=false`.

WKWebView usa `capacitor://localhost`, distinto del HTTPS local de Android y del HTTP del harness. El SDK acepta bytes de modelo y así evita su comprobación HTTP(S) para la URL de pesos; los workers, fetch de WASM, AudioWorklet, Crypto y permisos de captura deben probarse realmente en WKWebView. No se afirma compatibilidad por haber pasado Chromium, ni se cambia a otro motor. Si falla, voz muestra error y la entrada manual sigue disponible; antes de distribuir hay que resolverlo o decidir explícitamente el alcance de la versión.

## Tamaño, red, almacenamiento y actualización

Whistle exacto: 16.919.407 bytes; una sola copia en `dist-native/models`. Se eliminan los tres pesos Needle que public tenía por trabajos anteriores; no se necesitan para la interpretación determinista. El SDK móvil no persiste otra copia de pesos en CacheStorage. Esto describe archivos/solicitudes, **no ahorro medido de memoria**: el buffer verificado se conserva en memoria durante la sesión y no se ha medido pico RAM en móvil.

El manifest de artefactos calcula bytes reales de ZIPs y de assets descomprimidos; `installedSizeBytes` y `storeDownloadSizeBytes` quedan null. No confundir assets de 20 MB con tamaño instalado de una app ni estimar el procesamiento de tienda como si estuviera medido.

La prueba local registra los recursos solicitados, bloquea cualquier host externo y verifica cero intentos externos en ese recorrido. No demuestra tráfico de un binario instalado ni de otros destinos voluntarios al compartir. No se ha probado voz humana en pista ni dispositivos físicos, alarmas en segundo plano, actualización firmada, selector/hoja de compartir nativos o restauración desde un proveedor cloud real.

Se mantienen `handball-stats-v1`, versión Dexie 2 y la importación compatible. La prueba de recarga valida almacenamiento del harness. La conservación tras update nativo requiere instalar dos builds con mismo appId/firma/origen y comparar backups; sigue pendiente. La web y el contenedor nativo se transfieren datos mediante ZIP, no comparten automáticamente base.
