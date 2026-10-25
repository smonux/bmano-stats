# Deshacer una creación

Recibo temporal, solo para la última creación de esta vista. Se pierde al recargar/salir o al guardar una edición; no es un historial general. Manual, revisión de voz y corrección de una propuesta nueva comparten el mismo guardado transaccional. El acuse permite Deshacer creación con teclado/toque y devuelve foco a Evento manual tras completarlo.

La reversión elimina esa creación y los jugadores que creó, restaura jugadores revividos/rol de portero y la selección previa de último portero. A diferencia del borrado ordinario (lógico), esta operación retira físicamente la creación comprobada, para no dejar referencias a jugadores retirados. El marcador/estadísticas se recalculan del dominio habitual. Reloj, contadores y otros equipos/eventos se preservan.

Antes de escribir, la misma transacción comprueba evento completo, jugadores afectados, referencias posteriores y selección de portero. Si han cambiado, rechaza todo sin restaurar versiones ajenas. Los timestamps del portero avanzan incluso con dos guardados en el mismo milisegundo. La comprobación es deliberadamente conservadora: una nueva referencia a un jugador creado/revivido puede exigir corregir desde el registro en vez de deshacer. No promete revertir ediciones ni recuperar Deshacer tras recarga.

Validación: 146 unitarias en 29 archivos; once pruebas nuevas cubren creación, pendiente/nota, portero previo/primero, jugador nuevo/archivado, reloj/contador independientes, conflictos, doble reversión, compatibilidad de copia y rollback de fallo de escritura. Navegador: 34 recorridos correctos, incluidos voz Whistle real/offline y conflicto entre ventanas; 16 de revisión correctos. Tras compactar el acuse se repiten los cuatro casos de Deshacer. Formato, TypeScript y build correctos.

`acuse-movil.png` revisada en Chromium móvil emulado: etiqueta y Deshacer comparten fila cuando caben, sin reducir su objetivo de 48 px. Las pruebas de pista/teclado físico siguen pendientes.
