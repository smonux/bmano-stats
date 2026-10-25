# Entrega 1b: legibilidad y superficie fija

Referencia anterior: build de `8f2faad`. Capturas posteriores: implementación de la entrega 1b, incluida en este bloque de cambios de `cambios-hmi`.

Las capturas usan Chromium headless, un perfil nuevo por caso y datos ficticios. Se repiten los mismos nombres, marcador, periodo y tres contadores —dos pausados y uno terminado—. Son tamaños de viewport CSS, sin emulación de un dispositivo físico en el script de medición.

## Medidas

El presupuesto de altura durante el desplazamiento se calcula como altura del viewport menos cabecera sticky menos barra de captura. Los márgenes y safe areas se conservan fuera de esa fórmula. En pantallas de hasta 640 px de alto, la cabecera se desplaza normalmente y su altura fija computa como cero.

| Vista                       | Cabecera anterior/posterior | Barra anterior/posterior | Altura útil anterior/posterior |
| --------------------------- | --------------------------- | ------------------------ | ------------------------------ |
| 390 × 664, nombres cortos   | 213 / 154 px                | 114,8 / 136 px           | 336,2 / 374 px                 |
| 390 × 664, nombres largos   | 288 / 169,6 px              | 114,8 / 136 px           | 261,2 / 358,4 px               |
| 320 × 568, nombres largos   | Se desplaza                 | 114,8 / 146 px           | 453,2 / 422 px                 |
| 844 × 390, nombres largos   | Se desplaza                 | 108,4 / 136 px           | 281,6 / 254 px                 |
| 1440 × 1000, nombres cortos | 229 / 154 px                | 108,4 / 136 px           | 662,6 / 710 px                 |

A 390 × 664 se ganan unos 38 px con nombres cortos y 97 px con nombres largos. En las pantallas bajas la barra crece para ofrecer texto legible y un enlace Preparar voz de 44 px; el registro conserva desplazamiento normal. Los contadores y controles secundarios ocupan altura de contenido desplazable.

Los JSON de [antes](antes/measurements.json) y [después](despues/measurements.json) incluyen tamaños reales de fuentes, anchuras de documento y cajas táctiles.

| Elemento a 390 × 664      | Antes         | Después       |
| ------------------------- | ------------- | ------------- |
| Perspectiva del equipo    | 7 px          | 14 px         |
| Nombre de equipo          | 13 px         | 16 px         |
| Marcador                  | 30 px         | 36 px         |
| Reloj                     | 18 px         | 24 px         |
| Título de evento          | 12 px         | 18 px         |
| Equipo/jugador del evento | 10 px         | 16 px         |
| Estado del evento         | 9 px          | 14 px         |
| Tiempo de exclusión       | 15 px         | 24 px         |
| Editar                    | 42 × 34 px    | 69 × 48 px    |
| Eliminar evento           | 30 × 32 px    | 48 × 48 px    |
| Liberar contador          | 24 × 44 px    | 48 × 48 px    |
| Captura manual            | 51 px de alto | 56 px de alto |

## Recorridos visuales

- Registro con nombres largos: [antes](antes/390x664-long-scroll.png), [después](despues/390x664-long-scroll.png).
- Vista inicial con tres exclusiones: [antes](antes/390x664-short-top.png), [después](despues/390x664-short-top.png).
- Pantalla estrecha: [antes](antes/320x568-long-scroll.png), [después](despues/320x568-long-scroll.png).
- [Gráfico con etiquetas ampliadas](despues/chart-390x664.png).
- [Editor con texto al 200 %](despues/editor-text-200-percent.png): ampliación simulada de la fuente raíz; opción seleccionada y acciones completas visibles tras desplazar el formulario.

Las capturas iniciales y durante scroll también se conservan para landscape y escritorio. La revisión al 200 % detectó etiquetas partidas en el pie del editor; se ajustaron distribución y tamaños mínimos antes de cerrar el bloque.

## Reproducción

El script carga los mismos fixtures TypeScript mediante el transformador Vite del proyecto. Así funciona con el Node de este entorno, compilado sin soporte TypeScript nativo.

```sh
CHROMIUM_PATH=/ruta/a/chrome-headless-shell node scripts/capture-hmi-layout.mjs \
  https://servidor-de-la-app directorio-de-capturas
```

Debe apuntar al build que se quiere medir. Cada perfil del script guarda únicamente los fixtures en su propio IndexedDB temporal. WebKit, Safari/iPhone físico, Android físico y tecnologías de asistencia siguen pendientes de validación.
