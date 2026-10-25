# Entrega 7 · Inicio, ajustes, guía y carga

- `activos-primero.png`: partido activo antes de navegación, acceso existente sin elegir arbitrariamente entre varios. Se reduce la presentación cuando ya hay partido.
- `guia.png`: notas y gramática recuperables desde Ajustes; salto explícito a la app, idioma solo en la primera página. Se conservan los seis pasos y ejemplos.
- Ajustes separa Idioma, Voz y Datos/copias. Explica pérdida al borrar datos del navegador, ZIP restaurable y PDF para compartir. El aviso de exportación afirma inicio de descarga, no guardado comprobado.

HMI-32 reproducido en `tests/review/loading.spec.ts`: tras confirmar una creación real en IndexedDB se retrasa la entrega de snapshots mediante una promesa controlada, manteniendo navegación real. Antes del cambio aparece `Partido no encontrado` (resultado fallido en `test-results/hmi-07-reproduction`). Después se espera una lectura autoritativa sin timeout, conservando el error para un ID inexistente. Dos recorridos correctos, móvil y escritorio. La ruta mantiene la instancia del partido cuando el snapshot general alcanza la lectura de resolución.

La regresión detectó además que el foco de una rueda podía desplazar una fila entre pointer-down y click. Se evita ese desplazamiento durante enfoque por puntero, conservando revelado para teclado. Se verifica 0/99/7, además de los formularios con viewport visual reducido. Capturas revisadas en Chromium emulado; no son ensayos físicos de teclado/voz.
