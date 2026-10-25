# Propuesta de implementación UI/HMI

Revisión: 25 de octubre de 2026. Base: `main`, commit `138fbf1`.

El objetivo es poder anotar y corregir mirando lo menos posible el teléfono: información legible, selección explícita y acciones de posición estable. Propongo adaptar el diseño de `bocetos-partido-v3.html` a los componentes actuales, por entregas pequeñas. El informe es una auditoría y el boceto una referencia visual; ninguno sustituye las reglas del dominio.

Esta propuesta no implementa cambios en la aplicación, no incorpora la rama `mejoras/interfaz-supervisada` y no implica publicar una versión.

## Fuentes y comprobaciones

- Leídos el README de esta carpeta, el informe completo, las tres versiones de bocetos, el índice y los recursos SVG.
- Contrastados los componentes de partido, editor, revisión de voz, ruedas, exclusiones, estadísticas, inicio, ajustes y confirmaciones con el código actual. El commit actual coincide con la referencia auditada.
- Abierto el boceto v3 en Chromium a 320, 390 y 430 CSS px de ancho, con 844 px de alto. Revisadas capturas de partido y editor a 390 px.
- El boceto no produjo desbordamiento horizontal en esos tres anchos. Los botones de jugador midieron 61, 78,5 y 82,5 px de ancho, respectivamente; 84 px de alto y nombres a 13 px.
- En el boceto a 390 × 844, el pie del editor quedó entre aproximadamente y=936 e y=1041, fuera de la pantalla inicial. Estas coordenadas incluyen la navegación de demostración y el marco del boceto; no son medidas de la aplicación. Confirman que el ejemplo no implementa un pie persistente.
- Cambiar al rival limpió la selección y cambió los nombres correctamente. La rejilla del ejemplo contiene cuatro dorsales fijos: la implementación deberá generarla a partir de toda la plantilla del equipo, no trasladar esos botones literalmente.
- No se han ejecutado las suites de la aplicación en esta revisión ni probado dispositivos físicos, audio o el despliegue remoto.

## Decisiones de interacción

Samuel aprobó las recomendaciones el 25 de octubre de 2026 y pidió implementarlas por entregas en `cambios-hmi`. Se conserva esta tabla como trazabilidad de las diferencias con requisitos anteriores. El inicio manual explícito queda autorizado según el acuerdo recogido en `seguimiento.md`.

| Asunto                       | Propuesta                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inicio sin voz, HMI-01       | Aprobado permitir «Iniciar solo con entrada manual» cuando la voz no esté preparada. La descarga y elección de idioma siguen siendo necesarias para usar voz. Implementarlo como bloque separado, sin inicio manual implícito ni cambios en Whistle.                                                       |
| Sustituir ruedas, HMI-04/07  | Tomar como dirección de diseño la selección directa del v3: equipos visibles, acciones y dorsales. Es un cambio respecto a la preferencia anterior por ruedas. Aplicarlo al registro de jugadas y probarlo antes de extenderlo a catálogos e idiomas. Evitar duplicar permanentemente controles y ajustes. |
| Voz iniciar/detener, HMI-20  | Mantener push to talk, conforme a la instrucción anterior. Verificar teclado, pérdida de contacto, foco y lectores de pantalla; una modalidad de grabación alternante quedaría para una decisión posterior.                                                                                                |
| Registro local/rival, HMI-16 | Conservar la identificación por lado solicitada anteriormente. Probar contenido alineado por equipo con acciones en una posición consistente, sin invertir también Editar y el menú. Unificar toda la alineación sería otro cambio explícito.                                                              |
| Navegación inferior, HMI-28  | Conservar el panel lateral. La barra inferior del partido queda reservada a captura; no recuperar una segunda navegación fija sin evidencia de necesidad.                                                                                                                                                  |
| Valores iniciales del boceto | Conservar evento manual neutral. El v3 preselecciona Gol, equipo y dorsal 11; eso es una simplificación que puede producir anotaciones accidentales. La voz mantiene sus valores por defecto actuales, señalados en la revisión.                                                                           |

## 1. Base visual e identidad

Aplicar la escala tipográfica del informe por componentes, reorganizando espacio al mismo tiempo:

- Contenido y botones habituales a 16 px; ayudas y estados operativos a 14 px. Excepción deliberada: nombre bajo el dorsal a un mínimo de 13 px, conforme al README más reciente.
- Marcador de 36–40 px, reloj de 24–28 px y cifras tabulares. Nombres de equipos de 16–18 px, sin reducirlos para encajar un nombre largo.
- Objetivos de al menos 44 × 44 px; controles habituales de partido de 48 px y acciones principales de captura/guardado de 56 px. Ampliar el objetivo, no solo el icono.
- Selección, pausa, pendientes y foco reconocibles mediante texto, forma o borde, además del amarillo. Medir contraste de estados renderizados.
- Integrar los 13 SVG mediante un componente de presentación asociado a `EventType`, con etiqueta textual. No añadir componentes React al modelo de dominio ni crear tipos nuevos por tener iconos.
- Incorporar `handball-stats-icon.svg` al favicon y los recursos de instalación. Revisar legibilidad a tamaños pequeños y generar recursos de instalación cuando sean necesarios.

No basta con aumentar globalmente `font-size`: actualmente hay reglas móviles y alturas fijas que volverían a comprimir o recortar el resultado.

## 2. Registro y corrección de jugadas

El editor es la prioridad principal. Propongo este recorrido:

1. **Contexto:** tiempo y minuto capturados al abrir, con una acción Editar compacta. El dato se conserva hasta guardar; no se promete precisión de segundos que el evento no almacena.
2. **Equipo:** dos botones con número, perspectiva y nombre. Ninguno elegido al abrir manualmente. Cambiar de equipo elimina los participantes incompatibles.
3. **Acción:** Gol, Parada, Pérdida y Tiro fallado visibles, con Más acciones para las restantes. Todos los tipos actuales siguen disponibles, incluida Nota.
4. **Participantes:** dorsal grande y nombre debajo en el mismo botón, ordenados por dorsal. Nombre completo en el resumen al seleccionar y en el nombre accesible. Reducir columnas antes que tipografía cuando falte espacio.
5. **Detalle:** solo lo aplicable. Asistente opcional, lanzador rival u otros relacionados según las definiciones existentes; en sustitución, Sale y Entra claramente diferenciados y con equipo identificado. Nota muestra directamente su texto, sin equipos ni jugadores.
6. **Pie persistente:** resumen breve de lo que se guardará, motivos de pendiente y Cancelar/Guardar en posición estable. El cuerpo se desplaza sin llevarse los botones detrás del teclado.

Mantener Sin identificar y Otro dorsal, sin exigir preparar una plantilla. Dorsal cero es válido y distinto del vacío; el nombre sigue siendo opcional. Otro dorsal abre únicamente el mecanismo de entrada necesario, evitando mostrar rejilla, rueda de jugador y dos ruedas de dígitos a la vez.

Los motivos se obtienen de `eventDraftIssues`, que ya reutiliza las reglas del dominio. Gol con equipo y sin dorsal sigue siendo válido; los pendientes siguen sin computar. La sustitución del boceto exige un dorsal de entrada y no debe copiarse como una nueva regla obligatoria.

Si se conservan ruedas en algún lugar, corregir conjuntamente geometría y selección: `ROW_HEIGHT = 40`, la banda de selección y la ventana CSS están acopladas. Comprobar también scroll rápido seguido inmediatamente de Guardar; no limitarse a aumentar filas.

Objetivo verificable: anotar un gol sin dorsal en cuatro activaciones —abrir, elegir equipo, elegir Gol, guardar— a 390 × 844 sin desplazar el formulario al tamaño de texto predeterminado. El texto ampliado y las plantillas largas pueden necesitar scroll, manteniendo el guardado accesible.

## 3. Partido, cabecera y exclusiones

- Fijar únicamente un bloque compacto de marcador, tiempo, reloj y Pausar/Reanudar. Las pestañas y controles secundarios participan en el scroll normal; evitar observadores o animaciones de colapso.
- Mantener la barra inferior de Evento manual y Voz, incluyendo safe area y espacio final para que no tape la última tarjeta.
- Dar prioridad a exclusiones activas, sin reservar tres tarjetas vacías grandes. Ofrecer un acceso claro a iniciar otra hasta el límite actual de tres. Ninguna activa debe quedar oculta sin una indicación accesible.
- Contadores con equipo/dorsal legibles, tiempo de 20–24 px y aviso Puede volver; acciones de pausa y liberación separadas. Si no caben tres columnas, cambiar distribución.
- La franja de exclusiones no debe aumentar el bloque sticky principal. Medir la combinación de tres activas, nombres largos y pantallas cortas antes de fijar la distribución final.
- Mostrar la explicación de que un contador no registra una exclusión estadística. Conservar reloj común, pausa, dorsal opcional y aviso sonoro.
- Como entrega posterior, ofrecer Iniciar contador después de guardar una exclusión, precargando equipo y dorsal. Debe ser una acción explícita; no enlazar silenciosamente el ciclo de vida del evento y el contador.

## 4. Registro, seguridad de edición y confirmaciones

- Pendientes con motivos concretos mediante `eventIssues` y acción Completar; registrados con Editar. Al completar el último pendiente con el filtro activo, actualizar estado vacío y devolver foco a un destino existente.
- Identificación de equipo por número, nombre y lado; controles estables y zonas táctiles separadas. Borrado dentro de Más, conservando confirmación con tipo, equipo, tiempo/minuto y participantes útiles. Eliminar partido identifica equipos y fecha.
- Acuse discreto después de persistir: qué jugada se registró o quedó pendiente. Recuperar foco del activador sin desplazar el historial inesperadamente.
- Protección de cambios al cerrar un editor modificado. Para una primera entrega, confirmación Continuar editando/Descartar ante Cancelar, X o Escape; sin confirmación para formularios intactos. Tratar navegación atrás y recarga expresamente, sin prometer recuperación persistente que aún no existe.
- Deshacer como entrega propia: empezar por la creación de una jugada y definir aparte la reversión de ediciones. El repositorio tiene borrado lógico, pero no una operación general para restaurar una edición; además, guardar una parada puede actualizar el último portero. No copiar la restauración de todo el array del boceto ni restar un gol directamente.

## 5. Revisión de voz

Primero interpretación y contexto; después transcripción original desplegable. Señalar de forma legible Equipo por defecto o Último portero utilizado. Sustitución muestra Sale/Entra y las notas conservan su texto completo.

Guardar queda en el mismo lado que en el editor manual, con Corrección/Editar y Descartar diferenciados. Conservar guardado exclusivamente explícito, spinner, estado de procesamiento y posibilidad de seguir anotando manualmente. Comprobar un resultado tardío mientras hay otro diálogo abierto y Enter al terminar la pulsación mantenida.

Esto no requiere cambiar Whistle, sus modelos, las reglas de interpretación ni la gramática de voz.

## 6. Estadísticas y resto de pantallas

- Corregir el equipo inicial de estadísticas: actualmente usa `teams[0]`, que depende del orden del catálogo. En un partido debe empezar por Equipo 1, con selección y nombre siempre claros.
- Selección directa entre los dos equipos del partido, métricas y filas legibles, denominadores de eficacia y «—» cuando no hay muestra. Conservar cálculos.
- Gráfico con etiquetas legibles y una tabla desplegable de sus mismos datos por tiempo/minuto/equipo; mantener las diferencias de trazo existentes.
- Completar navegación y asociaciones de pestañas, foco de modales y mensajes de error asociados a sus campos. Extender el comportamiento de teclado/viewport del editor a formularios de equipo, jugador y contador.
- Inicio: situar partidos activos antes de las tarjetas de navegación; reutilizar el acceso existente para continuar, sin elegir uno arbitrariamente si hay varios.
- Ajustes: distinguir Idioma, Voz y Datos; explicar guardado local, ZIP restaurable y PDF para compartir. Una descarga iniciada no demuestra que el usuario haya guardado el archivo.
- Conservar ayuda recuperable y ejemplos de gramática. Simplificar la bienvenida sin quitar las explicaciones de voz solicitadas anteriormente.
- Reproducir el supuesto falso Partido no encontrado antes de cambiar la carga o navegación. No añadir un temporizador para esconderlo.

## Entregas y trazabilidad

Cada fila representa un bloque revisable; dividir los cambios en commits coherentes dentro de cada bloque.

| Orden         | Entrega                                                                                                                     | Referencias                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 0             | Capturas y mediciones de la aplicación actual, fixtures equivalentes, resolver decisiones de interacción                    | HMI-31; decisiones anteriores          |
| 1             | Tipografía, objetivos táctiles, contraste, iconos y equipo inicial de estadísticas                                          | HMI-02, 03, 21, 25; recursos SVG       |
| 2             | Editor con selección directa, participantes por dorsal/nombre, campos aplicables, contexto compacto y pendientes explicados | HMI-04–09, 18                          |
| 3             | Cabecera, pausa y distribución de exclusiones; ayuda visible sobre contador independiente                                   | HMI-12–15                              |
| 4             | Registro, foco, confirmaciones contextualizadas y protección del borrador                                                   | HMI-10, 11 —acuse—, 16, 17             |
| 5             | Revisión de voz y accesibilidad compartida de controles, pestañas y formularios                                             | HMI-19, 20 —sin cambiar PTT—, 24, 26   |
| 6             | Comparación de estadísticas y alternativa textual del gráfico                                                               | HMI-22, 23                             |
| 7             | Inicio, ajustes y bienvenida; investigar transición de carga                                                                | HMI-27, 29, 30, 32                     |
| Separadas     | Inicio manual sin voz; Deshacer; acceso al contador tras exclusión                                                          | HMI-01, 11 —reversión—, 15 —evolución— |
| No priorizada | Cambiar menú lateral por navegación inferior                                                                                | HMI-28                                 |

HMI-31 es transversal: cada entrega debe conservar capturas y resultados. El bloque 1 necesita ajustes de estructura junto con la tipografía; no consiste en subir fuentes y aplazar los desbordamientos al bloque 2.

## Criterios de cierre

- Chromium: 320 × 568, 360 × 640, 390 × 664, 390 × 844, 430 × 932, 844 × 390, tablet y escritorio. WebKit donde esté disponible. Los ensayos automatizados no equivalen a pruebas en iPhone físico.
- Texto al 200 %, traducciones largas, equipos de 100 caracteres, plantillas de 0/7/30 jugadores y dorsales 0/7/10/99. Nombres completos accesibles después de elegir.
- Teclado con viewport efectivo de 420/340/220 px: campo enfocado, errores y acciones accesibles. Cancelar/X/Escape y retorno de foco a controles existentes.
- Guardar justo después de scroll, doble toque, error de persistencia y conflicto en otra ventana; sin duplicar eventos ni perder el borrador en un fallo.
- Tres exclusiones, pausa común, caducidad, aviso visual/sonoro y liberación independiente.
- Voz sin permisos, reconocimiento lento, resultado tardío y revisión de nota; ningún guardado automático.
- Igualdad de marcador, estadísticas, cronología, PDF y copias ZIP/JSON ante los mismos datos. Cualquier operación nueva de reversión se prueba por separado.
- Ejecutar las comprobaciones de formato, TypeScript, unitarias, build y las suites de navegador pertinentes. Revisar capturas, tamaños efectivos y foco, además de resultados automáticos.
- Anotar como pendientes las comprobaciones físicas en Safari/iPhone, Android y tecnologías de asistencia que no se hayan realizado. No convertir hipótesis del informe en fallos resueltos sin reproducción.

La primera implementación que recomiendo es base visual más editor: es donde coinciden legibilidad, número de gestos, espacio vertical y riesgo de registrar una jugada equivocada.
