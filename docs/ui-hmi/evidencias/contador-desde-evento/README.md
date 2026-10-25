# Contador tras guardar exclusión

Después de persistir una exclusión, una acción explícita abre el contador con su equipo/dorsal. Incluye dorsal vacío, cero y dorsal creado al guardar (99), sin depender del snapshot anterior. Cancelar no inicia nada y vuelve al activador. Activar usa el siguiente hueco libre, sin sobreescribir; con tres ocupados, la acción lleva al bloque para liberar uno. El formulario conserva Cancelar/Activar visibles y explica ambos ciclos de vida.

El contador y evento no comparten ID ni persistencia nueva. Iniciar no añade otra jugada. Deshacer/borrar/editar evento conserva el contador; liberarlo conserva la jugada. Tras activar, el foco pasa al bloque de contadores porque el activador ya desapareció. Una edición o borrado posterior en otra ventana invalida la oferta mediante versión del evento.

18 recorridos de Chromium correctos en móvil y escritorio, incluidos los cuatro tamaños de contadores. Dos recorridos adicionales de borrado/copia verifican que ZIP restaura dos contadores y una exclusión borrada lógicamente sin mostrarla en el registro. La primera ampliación del test buscaba incorrectamente `Eliminar evento` pese al nombre accesible contextual del botón; se corrigió el selector, sin cambiar el producto para ocultarlo.

146 unitarias correctas; formato, TypeScript y build correctos. `precargado-99.png` y `contador-sin-evento.png` revisadas: equipo rival identificado, 99 precargado, acciones completas y contador independiente tras Deshacer/recarga. Emulación móvil; sin validación física de audio o teclado.
