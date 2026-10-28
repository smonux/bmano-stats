# Revisión y cuestionarios propuestos

No hay una app enviada a revisión. Estos textos deben revisarse frente al binario definitivo y completarse con el titular/contacto.

## Notas para revisor · propuesta en inglés

Handball Stats records handball matches locally. No sign-in, subscription, external account or review credentials are required. On first launch, choose an interface language and optionally enter the four-step voice practice. The practice uses fictional players and never writes teams, players or matches into the real catalogue. Leave practice at any time; it can be reopened from Settings or the side menu.

To test without microphone permission: create two different teams in New match and use the explicitly labelled manual-start action if voice is not ready. Start the clock, add a play, edit it, and inspect match statistics. Four suspension counters are available while the app is open. They are not background alarms.

To test voice: select the recognition language and prepare voice in Settings. Whistle weights are bundled with the mobile app; no app-backend account is involved. Hold the Voice button, speak event + team + player(s), release, review and confirm. A recognition error does not automatically create an event. Permission denial leaves manual entry available. This path must have passed native-device QA before these notes accompany a submission.

To test files: Settings exports a ZIP backup through the system share sheet. Import a ZIP or JSON through the document picker, inspect the summary, then confirm replacement. PDF sharing is available for a selected match, including an active one. PDF is a report, not a restore format. The reviewer can use fictional data; never include real minors’ names or a user’s backup in review attachments.

Reviewer contact: **[NAME, EMAIL, PHONE]**. Privacy URL: **[REAL HTTPS URL]**. No fabricated account credentials are supplied. Do not submit these markers.

## Edad y contenido · respuestas fundamentables

| Pregunta / categoría | Propuesta basada en el producto actual |
| --- | --- |
| Tipo | App de estadísticas deportivas, no videojuego; categoría Sports / Deportes. Confirmar en consola. |
| Violencia, sexo, drogas, lenguaje ofensivo, miedo, apuestas | No hay contenido de estas categorías incorporado a la app. Registrar una sanción de balonmano no es contenido violento representado. |
| Compras, publicidad, azar, premios monetarios | No hay pagos, IAP, anuncios, loot boxes ni apuestas. |
| Chat, contenido compartido públicamente, UGC social | No hay red social, chat ni catálogo de contenido remoto. El texto libre es local y el envío de un PDF/ZIP es explícito a un destino elegido por el usuario. Revisar cómo lo formula cada cuestionario. |
| Navegación web / ubicación | No hay navegador abierto, ubicación ni exploración de contenido web como función. |
| Edad destinataria / Kids / Families | Herramienta para registrar partidos; no se ha declarado audiencia infantil ni se ha solicitado Kids Category/Families. Elegir audiencia real y contestar responsabilidad del titular, no usar «para niños» sin decisión expresa. |
| Rating final | Lo calcula la tienda según cuestionario y país. No se asigna aquí automáticamente 4+, 3+ ni otro rating. |

Nombres de jugadores y notas pueden referirse a menores o contener datos personales. Eso exige gestión responsable por quien registra; no justifica afirmar cumplimiento legal automático ni una edad objetivo inventada.

## Checklist antes de beta / review

- [ ] Confirmar titular, appId definitivo, precio/países, tipo de cuenta y contactos.
- [x] Android: autorización específica y aceptación de licencia SDK; APK debug y AAB release reales, verificados localmente.
- [ ] Android: firmar AAB con upload key y configurar Play App Signing a nombre del titular; el AAB entregado está sin firmar.
- [ ] Apple: Mac/Xcode 26+, Team, firma/provisioning, archive/IPA real; privacidad del archive y SPM resuelto.
- [ ] Instalación limpia offline: sin caché previa, escoger idioma, cargar modelo, probar voz real y rechazo de micrófono.
- [ ] Probar los siete idiomas, teclado, zonas seguras, atrás Android, interrupciones/permiso, suspensión/reanudación y orientación efectiva en dispositivos soportados.
- [ ] No quedar grabando al bloquear, minimizar, llamar o abrir otra app; no guardar propuestas sin confirmación.
- [ ] Reloj/exclusiones correctos al volver; no prometer avisos con la app cerrada.
- [ ] Exportación nativa, cancelación sin falso éxito, selector de archivos, importación válida/errónea y PDF con nombres largos, notas y transcripción.
- [ ] Persistencia al reiniciar y al actualizar con mismo identificador/firma; migración web por ZIP; copia conservada fuera de la app.
- [ ] Tutorial: salir/repetir/corregir; ningún objeto ficticio en catálogo, estadísticas ni ZIP real.
- [x] Auditar manifiestos finales de APK/AAB: tres permisos previstos y permiso interno AndroidX protegido por firma; sin cámara, contactos, localización ni almacenamiento amplio.
- [ ] Comprobar permisos/comportamiento en ejecución y repetir auditoría en el archive iOS final.
- [ ] Captura de tráfico instalada y revisión de SDKs; aprobar Data Safety/App Privacy, privacy manifests y export compliance.
- [ ] Publicar políticas y soporte con datos reales y acceso desde la app; sustituir marcadores de todos los idiomas.
- [ ] Capturas nativas de producto real, datos ficticios, sin mockups; comparar con referencias de navegador y dimensiones oficiales.
- [ ] Validar licencias de runtime/modelo/fuentes/SDKs y avisos incluidos en el paquete.
- [ ] Completar cuestionarios de edad y contenido sin respuestas automáticas no justificadas.
- [ ] Google: track interno, pruebas cerradas si corresponde (12 testers / 14 días para cuentas personales nuevas), feedback y pre-launch report.
- [ ] Apple: TestFlight interno y externo con revisión beta cuando corresponda; feedback y crash reports.
- [ ] Subida, aceptación de contratos, revisión y publicación: **requieren al titular y autorización nueva**. No forman parte de lo ejecutado.
