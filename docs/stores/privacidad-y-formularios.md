# Auditoría y respuestas propuestas de privacidad

Estado: propuesta fundada en código y pruebas disponibles, **no formulario presentado ni dictamen legal**. Deben confirmarse titular, contacto, URLs públicas y comportamiento del binario final. [Políticas en siete idiomas](privacy/) listas para completar; sus marcadores impiden considerarlas publicables.

## Flujos observados

| Dato / destino | Código y evidencia | Retención / declaración |
| --- | --- | --- |
| Audio PCM | `VoiceRecorder`, `useVoiceCapture`, Whistle Worker | Memoria durante captura/inferencia; no archivo de audio persistido por la app; micrófono solo por gesto. Cancelación/cierre detienen pistas. |
| Nombres, dorsales, partidos, notas, transcripciones | Dexie `handball-stats-v1`, esquema existente | Se conservan localmente; algunos borrados son lógicos. La exportación puede incluir registros borrados. No hay servidor de sincronización. |
| Pesos/WASM/workers | `dist-native`, SHA-256 y CSP local | Whistle incluido; preparación móvil no usa CDN. CacheStorage del SDK desactivado en móvil; la web mantiene su descarga habitual desde Hugging Face. |
| PDF / ZIP | `native/files.ts`, Filesystem Cache, Share | Archivo temporal privado; otro destino lo recibe solo por acción de compartir. FileProvider limitado a `exports/`. No se puede garantizar eliminación de copias de terceros. |
| Importación | `<input type=file>` y validación ZIP/JSON | Selector de documentos, sin acceso amplio al almacenamiento; reemplazo transaccional tras confirmar. |
| Analítica/publicidad/cuenta | Auditoría de imports/URLs y plugins seleccionados | No hay SDK de anuncios, tracking ni cuenta. Auditoría de dependencias NPM; revisar también grafo Maven/SPM y binario resuelto. |
| Copias del SO / informes de tiendas | Fuera del servidor de la app | Android desactiva allowBackup. iOS/servicios del SO y tiendas pueden aplicar sus opciones; no prometer que ningún tercero verá jamás datos. |

La prueba del bundle empaquetado registra solicitudes y bloquea cualquier host distinto del servidor de assets local. Comprueba Whistle/WASM real sin caché previa y sin solicitudes externas en ese recorrido. **No es** captura de tráfico de un APK/IPA instalado. Antes de envío: repetir con app limpia en dispositivo, red bloqueada, captura de tráfico y compartir/importar, distinguiendo acciones voluntarias del usuario de telemetría. Evitar registrar audio/transcripciones reales en logs de diagnóstico.

## Google Data Safety · propuesta a revisar

- ¿Recoge datos fuera del dispositivo? La propuesta para el bundle nativo es «No» para audio/nombres/partidos según los flujos propios auditados, **condicionada** a confirmar tráfico/SDKs del binario final. No aplicar esta respuesta automáticamente a una web que descargue recursos de terceros.
- ¿Comparte datos? El envío explícito a un destino elegido por el usuario debe revisarse con la excepción de transferencias iniciadas por el usuario y la definición vigente. No marcar publicidad/venta/tracking: no existen en el producto.
- Tipos tratados localmente: audio, nombres/dorsales y contenido libre. Se describen en política aunque no sean recogida remota. Si se añade soporte con envío de logs, analítica, sincronización o backend, reevaluar todos los tipos.
- Cifrado en tránsito/eliminación de cuenta: no inventar cuenta ni un servicio de borrado de servidor. No hay login; borrado local completo mediante controles del sistema y gestión separada de copias.
- Micrófono: permiso para registro voluntario de jugadas, sin servicio de grabación de fondo. Los manifiestos finales de APK/AAB tienen INTERNET, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS y un permiso interno AndroidX protegido por firma. No tienen ubicación, contactos, cámara, fotos, publicidad ni acceso amplio a archivos. Esto no sustituye las pruebas de permisos y comportamiento en ejecución antes de responder definitivamente.

## Apple App Privacy · propuesta a revisar

«Data Not Collected» es una propuesta **pendiente de verificar el archive y tráfico nativos**; no una selección ya realizada. Los datos procesados solo en dispositivo no se declaran igual que datos enviados a un servidor. La app contiene texto libre y nombres, por lo que cualquier futura transmisión puede implicar Other User Content, Names y Audio Data según el flujo real. No hay tracking, IDFA ni ATT configurado.

Se añade `PrivacyInfo.xcprivacy` al target: tracking false, categorías de recogida vacías y `NSPrivacyAccessedAPICategoryFileTimestamp` con motivo `C617.1`, por operaciones de archivos en el contenedor privado (Filesystem). No se usan timestamps para fingerprinting. El core Capacitor incluye su manifest; SPM/FileSystem pueden añadir otros, que deberán agregarse en el informe de privacidad del archive y revisarse con versiones resueltas. No se inventan motivos para APIs no auditadas.

`NSMicrophoneUsageDescription` tiene recursos `InfoPlist.strings` en los siete idiomas. No se incluye `NSSpeechRecognitionUsageDescription`: no se llama a Apple Speech Recognition. `ITSAppUsesNonExemptEncryption=false` corresponde al diseño actual sin criptografía propia no exenta; el titular debe revisar export compliance/territorios antes de enviar, sin tratar este valor como asesoría legal.

## Datos pendientes de publicar una política

Titular/forma jurídica, domicilio si aplica, email de privacidad/soporte, jurisdicción y base jurídica aplicable al responsable, URLs HTTPS reales y fecha. El copyright MIT «smonux» no sustituye a estos datos. Publicar la política accesible públicamente y añadir acceso desde la app antes de distribución; este repo no publica una URL ficticia ni envía formularios.
