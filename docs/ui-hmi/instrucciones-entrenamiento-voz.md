Implementa el entrenamiento de voz que el usuario ha aprobado en ChatGPT. No es una petición de plan: intégralo en /shared/src/bmano-stats. Referencia aprobada: docs/ui-hmi/voz-entrenamiento.html. Es una demo de UX: sus resultados son simulados y su formulario es reducido; NO copies esas limitaciones a producción.

OBJETIVO Y ALCANCE
El usuario prefiere invertir en enseñar la gramática antes de tocar algoritmos de reconocimiento. Añade una introducción didáctica, seguida de 4 retos prácticos con voz real, estados verde/amarillo/rojo y corrección. Reutiliza motor de voz, intérprete, validadores y editor actuales. No cambies el reconocedor ni amplíes arbitrariamente la gramática para acomodar la demo; verifica las frases y documenta cualquier ajuste necesario.

1. INTRODUCCIÓN ANTES DE LOS RETOS
Primera pantalla obligatoria en el recorrido, pero entrenamiento siempre saltable:
Evento + Equipo + Jugador 1 + Jugador 2.
Evento/equipo son lo esencial para los ejemplos; jugadores opcionales, segundo solo si aplica. No sugerir que todos los eventos admiten dos jugadores ni que ese orden sea una restricción del parser si no lo es. Explica que Jugador 1 realiza la acción y los conectores del segundo indican su papel («pase de», «provocado por»). Ejemplo visual segmentado: «Gol» + «nuestro» + «de Marta» + «pase de la 15». Nombre o dorsal; para reconocer nombres deben estar en la plantilla. «Gol nuestro» basta; completar después es normal.
Botón «Entendido · Vamos a practicar». Mantener estética de la demo amarillo/negro, fuente legible, controles táctiles adecuados y adaptación a temas/idiomas existentes.

2. CONTEXTO DE PRÁCTICA AISLADO
Dos equipos ficticios simétricos, con referencia nuestro/ellos explícita en este entrenamiento, y plantillas deterministas: Marta y #15 en nuestro equipo; Elena también en nuestro equipo; #12 y #8 en ellos. Usa IDs/dorsales coherentes sin colisiones. Reutiliza generación REAL de keywords (eventos, nombres, dorsales, equipos). El motor recibe solo contexto normal de equipos/plantillas, no la respuesta esperada del reto. La respuesta esperada solo se usa DESPUÉS para evaluar. No forzar reconocimiento, inventar participantes ni marcar éxito por pulsar grabar.
No escribir eventos/equipos/jugadores de prueba en los partidos, estadísticas, contadores, catálogos, sincronización o exportaciones reales. Puedes persistir únicamente preferencias/progreso mínimo de onboarding sin audio ni transcripciones. Practicar sobre borradores aislados.

3. CUATRO RETOS
A) «Gol nuestro». Esperado gol + nuestro; jugador desconocido es correcto y da verde. Enseña mínimos.
B) «Gol nuestro de Marta, pase de la quince». Esperado gol nuestro, goleadora Marta y asistente dorsal 15, ambos de nuestro equipo. Enseña nombres/dorsales y roles.
C) «Penalti cometido por ellos, número doce, provocado por Elena». Esperado penalti cometido por rival #12 y provocado por Elena de nuestro equipo. Enseña participantes opuestos y conectores. Comprueba equivalencias reales del parser y modelo.
D) «Exclusión de ellos». La consigna adicional dice que fue #8 y pide añadirlo después de hablar. Tras reconocer correctamente la frase, mostrar amarillo válido y pedir completar #8 en el editor; al hacerlo pasa a verde. Es una carencia DELIBERADA, no fallo de voz.
Mostrar «Jugada n de 4», frase grande, una explicación breve y consigna. Mantener pulsado para hablar con el patrón real accesible del proyecto; captura real, transcripción y parseo reales. No mostrar botones de simulación en producción.

4. EVALUACIÓN
Verde + check + texto: TODOS los datos esperados del reto coinciden semánticamente, incluidos roles/equipos. No comparación literal de transcripción; aceptar equivalencias nombre/dorsal de la misma identidad y sinónimos admitidos.
Amarillo + aviso + texto: el borrador sería registrable conforme al validador real, pero falta detalle del reto. Decir exactamente qué falta y que puede computar. Si hay datos erróneos aunque el evento sea válido, indicar «No coincide con el reto; revisa X», nunca presentarlo como correcto.
Rojo + cruz + texto: falta evento/equipo u otro requisito real, o no hay interpretación válida; explicar qué revisar. Distinguir errores de micrófono/modelo de comprensión.
Progresar solo cuando coincide el objetivo, ya sea por voz o después de editar. No exigir jugador en A ni exigir campos no aplicables. Distinguir «Reconocido por voz» y «Completado con ayuda» sin penalización. Repetir es siempre posible; evita afirmaciones de «a la primera» si no llevas contador fiable.
No usar exclusivamente color. Siguiente deshabilitado hasta éxito, pero Salir/Saltar siempre accesible.

5. CORRECCIÓN Y NAVEGACIÓN
«Completar o corregir» abre EL EDITOR HABITUAL COMPLETO con borrador reconocido, en modo práctica. No implementar el mini editor de la demo ni duplicar reglas de negocio. Guardar en modo práctica devuelve borrador al evaluador sin persistir evento real; cancelar conserva resultado anterior. Permite revisar evento, equipo, participantes, minuto/metadatos pertinentes.
«Recordar la gramática» vuelve a introducción y retorna al mismo reto sin perder borrador.
Final: 4/4, reconocimiento de progreso sin rankings ni puntuaciones; volver al punto desde el que se abrió, y repetir práctica. Ofrecer acceso desde Ayuda/Ajustes y entrada visible al primer uso de voz, saltable; nunca bloquear inicio de partido/registro manual por descarga, permisos o tutorial.
Gestionar preparación/error del modelo, permisos denegados, silencio, cancelación, reintentos, cambios de pantalla y liberación de micrófono. Mensajes honestos; completar manualmente o salir si voz no disponible.

6. VALIDACIÓN Y ENTREGA
Inspecciona AGENTS/instrucciones y estado git antes de editar; respeta cambios existentes. Prueba evaluación semántica, datos erróneos válidos, nombres/dorsales y roles cruzados, todos los estados, D amarillo->editor->verde, A verde sin jugador, cancelar/repetir/volver/saltar, permisos/modelo/silencio, ausencia de escrituras reales y convivencia con partido en curso. Usa pipeline real en integración; tests con transcripciones/fakes deben estar identificados como tales. No afirmes prueba de micrófono físico sin realizarla.
Verifica móvil 320/390/430 px, texto al 200%, teclado/foco, tema oscuro, textos traducibles y tests/build apropiados. No añadir dependencias innecesarias. Documenta implementación y límites.
Sigue las autorizaciones de entrega ya vigentes en tu sesión; no ampliar permisos de publicación. Conserva la preferencia del usuario de no esperar al despliegue. Comunica resultado concreto y comprobaciones.
