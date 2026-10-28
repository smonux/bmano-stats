# Ejemplos y nombres en el idioma de voz

Los [cuatro retos en siete idiomas](../../ejemplos-voz-idiomas.md) mantienen evento → equipo → jugadores. Nombres predefinidos #7/#9: es Marta/Elena; en Martha/Helen; de Martha/Helene; fr Marthe/Hélène; it Marta/Elena; nl Martha/Heleen; pl Marta/Helena. La introducción, consignas, plantilla y keywords coinciden con ese idioma, aunque la interfaz sea otra.

Capturas revisadas de página completa:

- [Interfaz española, ejemplos ingleses](interfaz-es-voz-en.png): «Goal for us», Martha y Helen, conectores ingleses y nombre del idioma visible.
- [Interfaz inglesa, ejemplos franceses en móvil](interfaz-en-voz-fr.png): Marthe/Hélène, mínimo «But pour nous» y ayudas que citan «passe décisive de» y «obtenu par».

También se revisa la captura inglesa a 320 px, tema oscuro y texto al 200 %. La matriz de navegador comprueba siete idiomas a 320/390/430 px, contraste, ajuste de texto, editor y salida. Los recorridos de idiomas cruzados cambian voz de inglés a alemán y de francés a polaco, seleccionan a ambas jugadoras locales en el editor, evalúan la jugada y vuelven a la gramática sin cambiar el idioma de interfaz.

## Validación

160 unitarias correctas en 32 archivos, incluidas 15 de práctica. Los 28 ejemplos y las siete introducciones pasan por intérprete/adaptador/evaluador reales con los nombres de ese idioma. Se exige evento literal, equipo explícito y roles #7/#9 y #12/#9, además de D incompleto/editor y equivalencia de identidades por dorsal. Se verifican keywords locales y traducciones con los mismos parámetros.

La adaptación es exclusiva de los personajes ficticios, no una función de traducción de datos. Una regresión pasa «Marta Álvarez» y «Elena López» al intérprete inglés con sus dorsales 27/18; comprueba que keywords, transcripción, nombres y datos originales no se sustituyen por Martha/Helen. Los recorridos existentes comparan las cuatro colecciones reales e impiden crear/actualizar/borrar durante la práctica.

44 casos de Chromium móvil emulado/escritorio validados: 36 de producción y ocho de componentes/origen. La primera tanda deja 34/36; los dos fallos pertenecen al nuevo test inglés porque el helper solo abría el asistente plegado con su etiqueta española. Se corrige el recorrido del test abriendo el control visible, sin cambiar producto ni añadir sleeps. La repetición de los cuatro casos de idiomas cruzados pasa (dos ya eran correctos). Formato, TypeScript y build correctos; `dist` regenerado.

## Límites del reconocimiento

Se conservan ASR/parser y los WAV españoles. El parser actual interpreta artículos numerales como «une» como dorsales; el francés emplea «passe décisive d’Hélène» para expresar la asistencia dentro de la gramática, sin añadir un «1» involuntario. No se cambia el algoritmo para acomodar el ejemplo.

La prueba con los cuatro audios sintéticos usa Whistle y captura reales, continúa offline y conserva los resultados previos a corregir: [móvil](whistle-movil.json), [escritorio](whistle-escritorio.json). En esta ejecución A/B dan verde a pesar de «Bol»/«Hol»; C omite la beneficiaria y exige corrección; D queda amarillo sin dorsal como está previsto. La variación respecto a pruebas anteriores no demuestra una mejora acústica: modelo/configuración no cambian. No se ha probado audio en los otros seis idiomas, voz humana, ruido de pista, Safari/iOS o Android físico.
