# Seguimiento de la refactorización integral

El objetivo es que todo el código propio se pueda leer y modificar por responsabilidad. Aplicar formato o dividir archivos por longitud no demuestra que esté terminado. Las nuevas indicaciones de interfaz de [tareas-pendientes.md](tareas-pendientes.md) se aplicarán después, por petición expresa del usuario.

## Criterios de cierre

1. Revisar código de aplicación, dominio, datos, voz, informes, estilos, scripts, configuración y pruebas. Los datos de vocabulario, traducciones y ejemplos también se revisan, aunque una tabla clara no necesita convertirse en funciones.
2. Separar responsabilidades mezcladas y usar nombres que expliquen qué representa cada dato. Mantener juntas las decisiones relacionadas; evitar módulos o envoltorios triviales que dificulten seguir el recorrido.
3. Conservar contratos, datos guardados, transacciones, eventos, estadísticas, perspectivas e idiomas. Las correcciones funcionales se deben identificar aparte.
4. Mantener las reglas deterministas y Whistle; no reintroducir Needle ni entrenar modelos.
5. Actualizar la guía de lectura y verificar tipos, formato, pruebas, corpus, compilación y recorridos de navegador. Los cambios de PDF requieren revisar informes renderizados; los de estilos, capturas y estados de interfaz.
6. Hacer una auditoría final por área y comprobar el estado real antes de declarar el objetivo completo. El listado siguiente sigue abierto.

## Estado por área

| Área | Estado comprobado | Revisión restante |
| --- | --- | --- |
| Intérprete y vocabularios | Fases de análisis y siete idiomas separados; regresión congelada de 645 frases | Revisar adaptador al editor, números y auxiliares; comprobación final del corpus |
| Dominio | Esquemas, catálogo, reglas, identidad, reloj, exclusiones y validación de copias separados | Auditoría final de contratos y pruebas |
| Estadísticas e informe de datos | Métricas separadas de consecuencias; tanteo por periodos en su módulo; nombres descriptivos | Auditoría final de cobertura de los doce eventos |
| Persistencia y archivos de copia | Conexión, catálogo, partidos, eventos y copias separados; límites, selección ZIP y decodificación explícitos; recorridos de navegador aprobados | Auditoría final de contratos y cobertura |
| Captura, preparación y ciclo de voz | Motor y grabador existentes; ninguna modificación de modelos | Separar ciclo de captura y revisión de la presentación; revisar preparación y almacenamiento |
| Componentes y páginas | Páginas extraídas de App; participantes/metadatos del editor y audio de exclusiones separados | Revisar estado del editor, partido, estadísticas, galería, componentes comunes y hooks |
| PDF | Generación actual funcional y comprobada en la entrega anterior | Separar composición, tablas, gráficas, fuentes y paginación; comparar/renderizar resultados |
| Traducciones, estilos y configuración | Formato y comprobaciones existentes | Revisar organización y reglas duplicadas; verificar presentación y configuración |
| Scripts y pruebas | Formato y regresión existentes | Revisar generación/evaluación de corpus, experimentos históricos, Python y organización de pruebas |
| Documentación y cierre | Guía actualizada para el núcleo | Completar inventario, enlaces y auditoría global |

## Evidencia del núcleo

Comparación temporal frente a `12d66db`, anterior a los cambios del núcleo: 3.744 combinaciones de evento/equipo/participantes/metadatos/borrado, con cuatro operaciones por combinación; 29 copias válidas o alteradas; 96 cambios de reloj; informe y estadísticas; y un ciclo completo de repositorio con catálogo, doce eventos en ambos equipos, corrección, conflicto, rollback, tres exclusiones, restauración y borrado. Los resultados y mensajes comparados son iguales. El comparador y la copia del código anterior están en `/tmp/bmano-compare-core.mjs` y `/tmp/bmano-core-before/`.

Las 721 pruebas de código pasan tras reorganizar este bloque, junto con tipos, formato, integridad del dataset y compilación. Pasan 11 recorridos de navegador en móvil/escritorio sobre creación, corrección, persistencia, sustituciones, estadísticas, relojes, ZIP/JSON y PDF; se omite intencionadamente la repetición móvil del PDF largo. Esta evidencia cubre el núcleo; no demuestra que las áreas pendientes de la tabla estén refactorizadas.
