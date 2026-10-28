# Fuentes oficiales consultadas · 2026-10-28

Revalidar en la consola antes de enviar; los requisitos pueden cambiar. La consulta no acepta términos ni crea cuentas.

| Tema | Fuente y aplicación a esta entrega |
| --- | --- |
| Entorno Capacitor 8 | [Environment setup](https://capacitorjs.com/docs/getting-started/environment-setup): Node 22+, Xcode 26+, Android Studio/SDK. Versiones instaladas se fijan en package-lock. |
| Integración | [Instalar Capacitor](https://capacitorjs.com/docs/getting-started): proyectos nativos y `cap sync` desde `dist-native`, sin `server.url`. |
| Android target | [Target API](https://developer.android.com/google/play/requirements/target-sdk): desde 31-08-2026, apps nuevas/actualizaciones móviles deben usar API 36+. Esta app usa 36. |
| Formato Google | [Android App Bundle](https://developer.android.com/guide/app-bundle): nuevas apps se entregan en AAB. APK sirve para pruebas, no sustituye el AAB de subida. |
| Ficha Google | [Crear/configurar app](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en): título 30, breve 80, descripción 4.000 caracteres. Titular debe aceptar términos en su cuenta. |
| Gráficos Google | [Preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en): icono 512×512; feature graphic 1.024×500; al menos 2 capturas, JPEG/PNG 24 bits sin alfa, lados 320–3.840 y lado mayor ≤2× menor. Preparamos referencias 1.080×1.920, sin considerarlas capturas nativas verificadas. |
| Testing cuenta personal | [Requisitos](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en): cuentas personales creadas después de 13-11-2023 necesitan 12 testers opt-in continuado durante 14 días antes de solicitar producción. Confirmar tipo/fecha de cuenta; no se reclutan testers automáticamente. |
| SDK Apple | [Requisitos próximos/vigentes](https://developer.apple.com/news/upcoming-requirements/?id=02212025a): desde 28-04-2026, Xcode 26+ y SDK iOS 26+ para subir. No confundir SDK de compilación con deployment target. |
| Campos Apple | [Información app](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/): nombre/subtítulo hasta 30 caracteres; privacidad pública requerida. |
| Texto Apple | [Versión de plataforma](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/): descripción/novedades 4.000 caracteres, keywords 100 bytes, texto promocional opcional 170. El validador cuenta bytes UTF-8 de keywords. |
| Capturas Apple | [Especificaciones](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/): 1–10, sin alfa; 6,9 pulgadas admite 1.320×2.868, entre otros tamaños. Propuesta iPhone; no se declara familia iPad nativa. |
| Revisión Apple | [Guidelines](https://developer.apple.com/app-store/review/guidelines/): completitud, URLs funcionales, utilidad más allá de una web reenvasada y permisos opcionales. Esta app incorpora datos locales, voz local, revisión, estadísticas y archivos, pero eso no garantiza aprobación. |
| TestFlight | [Overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/): gestionar beta desde la cuenta del titular; revisión beta externa cuando corresponda. |
| Upload Apple | [Subir builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/): Xcode/Transporter y roles adecuados; no se ejecuta la subida. |
| Edad | [Cuestionario Apple](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/): respuestas del producto actual; la consola calcula el rating, no se promete uno universal. |
| Datos Google | [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en): revisar SDKs y cualquier transmisión fuera del dispositivo; no rellenar por suposición. |
| Datos Apple | [App privacy details](https://developer.apple.com/app-store/app-privacy-details/): procesamiento solo en dispositivo y transferencias se valoran de forma distinta; confirmar hechos del binario final. |
| Filesystem | [API y privacy manifest](https://capacitorjs.com/docs/apis/filesystem): motivo C617.1 para timestamps de archivos privados; no se usan Documents/ExternalStorage ni descarga por plugin. |
| Compartir | [Share](https://capacitorjs.com/docs/apis/share): archivos desde caché privada y FileProvider acotado a `exports/`. |
| Micrófono iOS | [WKUIDelegate](https://developer.apple.com/documentation/webkit/wkuidelegate/webview(_:requestmediacapturepermissionfor:initiatedbyframe:type:decisionhandler:)): petición de captura por WebKit, no Apple Speech Recognition. |
| Modelo | [Whistle, licencia fijada](https://huggingface.co/Cactus-Compute/whistle/blob/b358ddadd89b7a713b5aa131f23032d3cca1b251/LICENSE): Apache-2.0; revisión/hash fijados por cactus-needle 0.3.0. |

El tamaño instalado y comprimido de una tienda depende de su procesamiento, firma y dispositivo. Los límites generales no sustituyen a `bundletool get-size total` ni al informe App Store Connect del binario real.
