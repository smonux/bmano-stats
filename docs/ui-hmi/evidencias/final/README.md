# Evidencia de auditoría final

Ver [auditoría por HMI y límites](../../auditoria-final.md). Datos ficticios, Chromium emulado y perfiles aislados. No se usan partidos reales.

## Comparación con el mismo fixture

`comparables/` se genera con `scripts/capture-hmi-layout.mjs`. Contiene cinco tamaños/condiciones, vistas iniciales y desplazadas, gráfico y `measurements.json`. Se compara con `01-tipografia/antes`, conservando los mismos nueve eventos y tres contadores (uno vencido).

| Condición | Registro útil antes (px) | Final (px) |
| --- | ---: | ---: |
| 390 × 664, nombres cortos | 336,2 | 374 |
| 390 × 664, nombres largos | 261,2 | 358,4 |
| 320 × 568, nombres largos | 453,2 | 422 |
| 844 × 390, nombres largos | 281,6 | 254 |
| 1440 × 1000, nombres cortos | 662,6 | 710 |

En las alturas cortas la cabecera es estática; la barra inferior mayor reserva tipografía/objetivos legibles. Por eso disminuye el presupuesto geométrico frente a la base de fuentes pequeñas: no se presenta como mejora de espacio en todos los tamaños. La medida es altura menos superficies sticky; no estima cuántas jugadas completas caben. No incluye acuse abierto ni texto ampliado.

## Matriz ampliada

`hmi-final-matrix.spec.ts` prueba ocho tamaños, siete idiomas, 200 eventos con texto largo, equipos de 100 caracteres y plantillas de 0/7/30. Verifica acceso al último evento con edición, retorno de foco entre cabecera y captura, lectura de transcripción, editor neutral y pie completo. La suite de editor añade dorsales 0/7/10/99. Se conservan capturas seleccionadas y medidas de la matriz por separado; no se comparan sus alturas con el fixture de nueve eventos.

## Texto ampliado

`texto-200/antes.png` conserva el recorte reproducido a 320 × 568: el botón manual solo mostraba aproximadamente el 56 % de su superficie. La corrección limita el acuse a una región desplazable con nombre, foco y espacio para el indicador. Manual y Voz quedan completos; cada acción del acuse se revela al enfocar. Una tolerancia máxima de un CSS px en la geometría evita confundir redondeo del scroll nativo con un recorte operativo.

Las capturas finales se toman antes y después de Deshacer; conservan texto al 200 %. No son fotografías de teclado/teléfono ni pruebas de zoom del sistema.

## Límites

WebKit no está instalado (`webkit-2370/pw_run.sh` ausente). Safari/iPhone, Android físico, lectores de pantalla y ruido de pista quedan sin comprobar físicamente. Los tests de audio validan duración/programación y cierre de pistas; no certifican que el aviso se oiga durante un partido.
