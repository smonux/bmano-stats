# Conversación C3

https://chatgpt.com/share/6ad1047f-dc74-83eb-80f8-6cb78ea67b66

## C3.1 user

quiero diseñar esta aplicación. vamos paso a paso. La parte tecnológica, que opciones hay. Manten estilo conversacional.





## Introducción



Es una app destinada a registrar estadísticas de balonmano de manera rápida, apoyándose en el reconocimiento de voz y en interfaces móviles que estén adaptados y diseñados para una entrada ergonómica y que en la medida de lo posible ayuden a reducir los errores, mediante redundancia y señales visuales. La toma de datos en tiempo real durante un partido es compleja y debe hacerse con ruido y de forma muy rápida, por lo que esta aplicación debe destacar en hacer este trabajo lo más sencillo posible.



La aplicación, una vez iniciado el partido, muestra la estadística como una serie de eventos con metadatos, algunos obligatorios y otros opcionales. Si los obligatorios no se cumplen el evento se queda en estado especial, no cuenta para el resumen, pero puede ser revisado fácilmente. Igualmente los  datos opcionales pueden ser completados, aunque el dato parcial ya es contemplado como parte del conjunto de estadísticas del partido (goles, exclusiones, juego pasivo, penalti, parada, tiro fallado, balón robado, etc...)



Ejemplo de interacción para ilustrar la filosofía:



El usuario presiona un botón, tipo push to talk y dice



“gol nuestro, Ana”



Lo que se traduce en un evento, 

GOL

Equipo -> El elegido como nuestro

Jugador -> El reconocimiento de voz no ha encontrado ningún jugador “Ana”, por lo que se asigna al jugador desconocido de este equipo.

Nota -> el texto reconocido tal cual lo ha mandado el 

Minuto -> calculado a partir del tiempo desde el inicio, si se ha marcado el inicio del partido. Puede modificarse con una “ruleta”, aunque no puede ser anterior al evento anterior.

Fecha de creación -> (común a todos)

Fecha de modificación ->

Marcador de soft delete



Este evento se muestra como una tarjeta con los datos fundamentales pero con un color que indique que tiene datos por completar. El marcador, visible en la parte superior se ha actualizado, pero la vista por jugador no marca el gol como de Ana. 

En la vista ampliada, el usuario puede mover los dos dígitos para introducir el número de Ana. Una vez introducido el número se muestra el nombre si está introducido y el gol queda completo.



Las tarjetas se pueden reordenar de forma que se puede introducir la infracción del penalti después del gol, por ejemplo, y completar los datos aunque se recojan de forma no secuencial.



El énfasis en la aplicación es que debe ser simple y tener un UI muy intuitivo y rápido de utilizar. También debe dar confianza y ser robusto. Es más importante la recolección de datos que la funcionalidad para explotarlos.

## Notas tecnológicas

La intención es que sea una aplicación 100% local (una vez descargados los recursos en caso de que  se distribuya vía web)



Debe ser una aplicación que funcione al menos en iOS y Android.



El core de la utilidad de Speech- to text tiene que ser Cactus Whistle and Needle y por tanto éso puede limitar las opciones de framework, etc...



Como almacenamiento debe utilizar un único SQLite, con un diseño que minimice los cambios de DDL en la aplicación según vayan saliendo versiones.

## Eventos

Inicio Partido (implica inicio primer tiempo)

Inicio Tiempo (hay partidos que se juegan con más de 1 o de solo un 1 tiempo)

Fin Tiempo

Fin de Partido

Gol

Exclusion (también llamado 2 minutos)

Tiro fallado

Parada del portero (implica tiro fallado)

Balon perdido (destinado a pases fallados, no robos de balón)

Balon recuperado (solo se marca este evento, implica balón perdido del otro equipo)

Pasivo

Pasos/dobles

tarjeta amarilla

tarjeta roja

tarjeta azul



## Casos de Uso

- Equipos (crear, editar. borrar). Dentro de un equipo se pueden añadir y borrar jugadores (softdelete si ya tiene stats). El número se puede cambiar,dado que es algo mutable, hay que
- Partidos (editar, borrar, exportar). Elegir un partido pasado ya lo permite editar como si fuera en tiempo real, con la excepción de que no computa los minutos.
- Partido en juego/Editar partido. Es la principal. Tiene la pestaña de eventos y la de estadísticas, el marcador y algunos datos fundamentarles están siempre visibles.
  - La ventana de eventos es toda la sucesión de eventos ordenados en el tiempo
  - En estadísticas hay:
    - por jugador las metricoas principales (goles, exclusiones, perdidas, robos o paradas para 
    - por equipo, la gráfica de evolución del marcador
- Estadísticas históricas. (no es el objetivo primordial del software)
  - por jugador
  - por equipo



## Pantallas y menús



por desarrollar

## C3.6 user

Original custom instructions no longer available

## C3.17 assistant

Yo empezaría por una decisión fundamental: **¿queremos una aplicación nativa multiplataforma, una aplicación web o una solución híbrida?**

La buena noticia es que Cactus no nos obliga a escoger un framework determinado. La mala es que algunas opciones van a exigir más trabajo de integración que otras.

## 1. Lo que condiciona la arquitectura: Cactus

He revisado la documentación actual de Cactus. Hay un detalle importante: **Whistle se publicó el 2 de octubre de 2026**, así que estamos hablando de tecnología muy reciente.

Tenemos dos componentes distintos:

- **Whistle:** convierte voz en texto. Funciona localmente, soporta español y su modelo ocupa unos 16,9 MB.
- **Needle 3:** interpreta instrucciones y puede convertirlas en llamadas estructuradas con argumentos. Por ejemplo, transformar «gol nuestro, Ana» en una operación con tipo de evento, equipo y jugadora.

Ambos comparten un motor de inferencia escrito en C/C++, con una API accesible desde otros lenguajes.

Y esto es importante: **el motor ya dispone de versiones para iOS, Android y WebAssembly (navegador)**. <Cite refs={["turn591420search0","turn530798search2"]}/>

Por tanto, tenemos bastante libertad para elegir la tecnología del resto de la aplicación.

También haría una distinción desde el principio: la interpretación que devuelva Needle debe considerarse una propuesta, no un evento válido automáticamente. La aplicación tendrá que validar los datos, resolver jugadores y decidir qué queda pendiente. Esto encaja muy bien con tu filosofía de registrar primero y completar después.



## C3.30 assistant

Yo empezaría por una decisión fundamental: **¿queremos una aplicación nativa multiplataforma, una aplicación web o una solución híbrida?**

La buena noticia es que Cactus no nos obliga a escoger un framework determinado. La mala es que algunas opciones van a exigir más trabajo de integración que otras.

## 1. Lo que condiciona la arquitectura: Cactus

He revisado la documentación actual de Cactus. Hay un detalle importante: **Whistle se publicó el 2 de octubre de 2026**, así que estamos hablando de tecnología muy reciente.

Tenemos dos componentes distintos:

- **Whistle:** convierte voz en texto. Funciona localmente, soporta español y su modelo ocupa unos 16,9 MB.
- **Needle 3:** interpreta instrucciones y puede convertirlas en llamadas estructuradas con argumentos. Por ejemplo, transformar «gol nuestro, Ana» en una operación con tipo de evento, equipo y jugadora.

Ambos comparten un motor de inferencia escrito en C/C++, con una API accesible desde otros lenguajes.

Y esto es importante: **el motor ya dispone de versiones para iOS, Android y WebAssembly (navegador)**. <Cite refs={["turn591420search0","turn530798search2"]}/>

Por tanto, tenemos bastante libertad para elegir la tecnología del resto de la aplicación.

También haría una distinción desde el principio: la interpretación que devuelva Needle debe considerarse una propuesta, no un evento válido automáticamente. La aplicación tendrá que validar los datos, resolver jugadores y decidir qué queda pendiente. Esto encaja muy bien con tu filosofía de registrar primero y completar después.

## 2. Las cuatro opciones de framework

| Opción | Ventajas | Inconvenientes | Mi valoración |
|---|---|---|---|
| **Flutter** (Dart) | Una UI para iOS y Android, gran control visual, SQLite local e integración con C mediante FFI | Hay que desarrollar y mantener la integración con Needle 3 | Mi favorita |
| **React Native** (TypeScript) | Ecosistema amplio, desarrollo ágil, módulos nativos en C++ | La integración nativa añade complejidad | Buena alternativa |
| **Kotlin Multiplatform** | Muy buena integración con APIs nativas, posibilidad de compartir lógica y UI | Mayor complejidad de desarrollo y distribución | Muy sólida |
| **PWA** (TypeScript + WebAssembly) | Distribución mediante URL, actualizaciones sencillas, sin tiendas | Mayor incertidumbre con almacenamiento persistente, micrófono y comportamiento en segundo plano | La estudiaría, pero con reservas |

Flutter tiene soporte oficial para invocar código C mediante FFI. React Native también permite módulos C++ compartidos. Por tanto, ambos son candidatos reales. <Cite refs={["turn309726search11","turn309726search9"]}/>

Una precaución: existen bindings de Cactus para Flutter y Kotlin, pero **no daría por hecho que sean directamente compatibles con la versión recién publicada de Needle 3**. Hay que comprobar esa integración concreta.

## 3. Mi propuesta inicial

Me inclinaría por **Flutter + Needle/Whistle nativo + SQLite**.

La arquitectura podría ser muy sencilla conceptualmente:

<box border radius="lg" padding={3} gap={2} align="center">
  <box background="surface-secondary" radius="md" padding={3} width="100" align="center">
    **Flutter**

    <text color="secondary" size="xs">Interfaz, controles táctiles, gestión del partido</text>
  </box>
  <icon name="arrow-down" color="tertiary"/>
  <box background="surface-secondary" radius="md" padding={3} width="100" align="center">
    **Servicio de captura e interpretación**

    <text color="secondary" size="xs">Audio → Whistle → Needle</text>
  </box>
  <icon name="arrow-down" color="tertiary"/>
  <box background="surface-secondary" radius="md" padding={3} width="100" align="center">
    **Lógica de negocio**

    <text color="secondary" size="xs">Validación, eventos incompletos, ordenación, estadísticas</text>
  </box>
  <icon name="arrow-down" color="tertiary"/>
  <box background="surface-secondary" radius="md" padding={3} width="100" align="center">
    **SQLite**

    <text color="secondary" size="xs">Un único archivo local, exportable</text>
  </box>
</box>

Me gusta especialmente separar la lógica de negocio del reconocimiento de voz. Así, tanto un evento capturado por voz como uno introducido manualmente pasan por las mismas reglas.

Y SQLite no representa ningún problema con Flutter. Hay soluciones consolidadas como Drift, que permiten trabajar directamente con una base SQLite local. <Cite ref="turn309726search5"/>

## 4. ¿Por qué no empezaría por una PWA?

No la descartaría. De hecho, que Needle disponga de WebAssembly la convierte en una opción bastante interesante.

Pero hay un problema que para esta aplicación considero especialmente delicado: **la garantía de persistencia de los datos**.

Los navegadores pueden gestionar y, bajo determinadas condiciones, eliminar almacenamiento local. WebKit documenta expresamente estas políticas. <Cite ref="turn309726search1"/>

Podemos mitigar ese riesgo, pero una app nativa con un SQLite en su almacenamiento privado me parece una base más predecible.

## 5. Lo que comprobaría antes de comprometernos

No empezaría construyendo la aplicación completa.

Haría una pequeña prueba técnica que permita mantener pulsado un botón, decir «gol nuestro, Ana» en un entorno ruidoso, obtener la transcripción de Whistle y la interpretación de Needle, y guardar el evento en SQLite.

Hay además una característica muy prometedora: Whistle admite un vocabulario de palabras favorecidas (*keywords*), por lo que podemos proporcionarle los nombres de los jugadores de ambos equipos y el vocabulario del balonmano. <Cite ref="turn309726search0"/>

Esa prueba debería comprobar especialmente la latencia, la precisión en un pabellón, el consumo de batería y que todo funcione con el dispositivo sin conexión. También verificaría que no haya telemetría ni llamadas de red inesperadas.

---

**Mi posición por ahora:** Flutter es mi primera opción, Kotlin Multiplatform la segunda, y mantendría la PWA como alternativa si distribuir sin tiendas tiene mucho peso.

Pero antes de darla por cerrada, hay una cuestión que merece nuestra siguiente conversación: **¿cuánto valor tiene para ti que la aplicación se pueda abrir desde una URL, sin instalarla desde una tienda?** Esa respuesta puede cambiar bastante la elección.

## C3.31 assistant

## 2. Las cuatro opciones de framework

| Opción | Ventajas | Inconvenientes | Mi valoración |
|---|---|---|---|
| **Flutter** (Dart) | Una UI para iOS y Android, gran control visual, SQLite local e integración con C mediante FFI | Hay que desarrollar y mantener la integración con Needle 3 | Mi favorita |
| **React Native** (TypeScript) | Ecosistema amplio, desarrollo ágil, módulos nativos en C++ | La integración nativa añade complejidad | Buena alternativa |
| **Kotlin Multiplatform** | Muy buena integración con APIs nativas, posibilidad de compartir lógica y UI | Mayor complejidad de desarrollo y distribución | Muy sólida |
| **PWA** (TypeScript + WebAssembly) | Distribución mediante URL, actualizaciones sencillas, sin tiendas | Mayor incertidumbre con almacenamiento persistente, micrófono y comportamiento en segundo plano | La estudiaría, pero con reservas |

Flutter tiene soporte oficial para invocar código C mediante FFI. React Native también permite módulos C++ compartidos. Por tanto, ambos son candidatos reales. <Cite refs={["turn309726search11","turn309726search9"]}/>

Una precaución: existen bindings de Cactus para Flutter y Kotlin, pero **no daría por hecho que sean directamente compatibles con la versión recién publicada de Needle 3**. Hay que comprobar esa integración concreta.

## 3. Mi propuesta inicial

Me inclinaría por **Flutter + Needle/Whistle nativo + SQLite**.

La arquitectura podría ser muy sencilla conceptualmente:

<box border radius="lg" padding={3} gap={2} align="center">
  <box background="surface-secondary" radius="md" padding={3} width="100" align="center">
    **Flutter**

    <text color="secondary" size="xs">Interfaz, controles táctiles, gestión del partido</text>
  </box>
  <icon name="arrow-down" color="tertiary"/>
  <box background="surface-secondary" radius="md" padding={3} width="100" align="center">
    **Servicio de captura e interpretación**

    <text color="secondary" size="xs">Audio → Whistle → Needle</text>
  </box>
  <icon name="arrow-down" color="tertiary"/>
  <box background="surface-secondary" radius="md" padding={3} width="100" align="center">
    **Lógica de negocio**

    <text color="secondary" size="xs">Validación, eventos incompletos, ordenación, estadísticas</text>
  </box>
  <icon name="arrow-down" color="tertiary"/>
  <box background="surface-secondary" radius="md" padding={3} width="100" align="center">
    **SQLite**

    <text color="secondary" size="xs">Un único archivo local, exportable</text>
  </box>
</box>

Me gusta especialmente separar la lógica de negocio del reconocimiento de voz. Así, tanto un evento capturado por voz como uno introducido manualmente pasan por las mismas reglas.

Y SQLite no representa ningún problema con Flutter. Hay soluciones consolidadas como Drift, que permiten trabajar directamente con una base SQLite local. <Cite ref="turn309726search5"/>

## 4. ¿Por qué no empezaría por una PWA?

No la descartaría. De hecho, que Needle disponga de WebAssembly la convierte en una opción bastante interesante.

Pero hay un problema que para esta aplicación considero especialmente delicado: **la garantía de persistencia de los datos**.

Los navegadores pueden gestionar y, bajo determinadas condiciones, eliminar almacenamiento local. WebKit documenta expresamente estas políticas. <Cite ref="turn309726search1"/>

Podemos mitigar ese riesgo, pero una app nativa con un SQLite en su almacenamiento privado me parece una base más predecible.

## 5. Lo que comprobaría antes de comprometernos

No empezaría construyendo la aplicación completa.

Haría una pequeña prueba técnica que permita mantener pulsado un botón, decir «gol nuestro, Ana» en un entorno ruidoso, obtener la transcripción de Whistle y la interpretación de Needle, y guardar el evento en SQLite.

Hay además una característica muy prometedora: Whistle admite un vocabulario de palabras favorecidas (*keywords*), por lo que podemos proporcionarle los nombres de los jugadores de ambos equipos y el vocabulario del balonmano. <Cite ref="turn309726search0"/>

Esa prueba debería comprobar especialmente la latencia, la precisión en un pabellón, el consumo de batería y que todo funcione con el dispositivo sin conexión. También verificaría que no haya telemetría ni llamadas de red inesperadas.

---

**Mi posición por ahora:** Flutter es mi primera opción, Kotlin Multiplatform la segunda, y mantendría la PWA como alternativa si distribuir sin tiendas tiene mucho peso.

Pero antes de darla por cerrada, hay una cuestión que merece nuestra siguiente conversación: **¿cuánto valor tiene para ti que la aplicación se pueda abrir desde una URL, sin instalarla desde una tienda?** Esa respuesta puede cambiar bastante la elección.

## C3.32 user

me parece de gran importancia salvo que condicione rendimiento o fluidez

## C3.42 assistant

Entonces cambiaría mi recomendación: **exploraría primero una PWA**, y solo pasaría a una aplicación nativa si encontramos limitaciones importantes de rendimiento o fiabilidad.

Creo que tu aplicación es una buena candidata para este enfoque. La interfaz no es especialmente exigente: tarjetas, botones, marcadores, estadísticas y controles táctiles. Todo eso puede funcionar con mucha fluidez en una aplicación web moderna.

**El verdadero riesgo no está en la interfaz, sino en el reconocimiento de voz y el almacenamiento.**

## La opción que estudiaría

Una arquitectura web que también permita generar aplicaciones nativas si finalmente resulta necesario.

| Componente | Tecnología candidata |
|---|---|
| Interfaz | React o Svelte + TypeScript |
| Distribución | PWA instalable desde una URL |
| Reconocimiento de voz | Cactus Whistle mediante WebAssembly |
| Interpretación | Needle 3 mediante WebAssembly |
| Base de datos | SQLite WebAssembly + OPFS |
| Alternativa nativa | Capacitor para iOS y Android |

He confirmado que Cactus distribuye un motor WebAssembly para navegador, con recursos descargables y ejecución local. Esto hace técnicamente plausible la solución, aunque todavía no demuestra que Whistle y Needle funcionen con suficiente rapidez en móviles reales. <Cite ref="turn793130view0"/>

Además, Capacitor nos permitiría reutilizar la interfaz web y recurrir a las bibliotecas nativas de Cactus si necesitáramos más rendimiento. <Cite ref="turn793130search2"/>

Esto es atractivo porque no tendríamos que rehacer toda la aplicación para cambiar el sistema de distribución.



## C3.48 assistant

Entonces cambiaría mi recomendación: **exploraría primero una PWA**, y solo pasaría a una aplicación nativa si encontramos limitaciones importantes de rendimiento o fiabilidad.

Creo que tu aplicación es una buena candidata para este enfoque. La interfaz no es especialmente exigente: tarjetas, botones, marcadores, estadísticas y controles táctiles. Todo eso puede funcionar con mucha fluidez en una aplicación web moderna.

**El verdadero riesgo no está en la interfaz, sino en el reconocimiento de voz y el almacenamiento.**

## La opción que estudiaría

Una arquitectura web que también permita generar aplicaciones nativas si finalmente resulta necesario.

| Componente | Tecnología candidata |
|---|---|
| Interfaz | React o Svelte + TypeScript |
| Distribución | PWA instalable desde una URL |
| Reconocimiento de voz | Cactus Whistle mediante WebAssembly |
| Interpretación | Needle 3 mediante WebAssembly |
| Base de datos | SQLite WebAssembly + OPFS |
| Alternativa nativa | Capacitor para iOS y Android |

He confirmado que Cactus distribuye un motor WebAssembly para navegador, con recursos descargables y ejecución local. Esto hace técnicamente plausible la solución, aunque todavía no demuestra que Whistle y Needle funcionen con suficiente rapidez en móviles reales. <Cite ref="turn793130view0"/>

Además, Capacitor nos permitiría reutilizar la interfaz web y recurrir a las bibliotecas nativas de Cactus si necesitáramos más rendimiento. <Cite ref="turn793130search2"/>

Esto es atractivo porque no tendríamos que rehacer toda la aplicación para cambiar el sistema de distribución.

## Las dos condiciones que pondría

**1. La voz debe funcionar sin bloquear la interfaz.** Ejecutaríamos Whistle y Needle fuera del hilo principal, mediante *Web Workers*. Así, mientras se procesa el audio, el usuario puede seguir interactuando con las tarjetas. Lo que falta medir es la latencia real en iPhone y Android de gama media.

**2. No podemos arriesgarnos a perder un partido.** SQLite funciona en navegador mediante WebAssembly y OPFS, pero el almacenamiento web puede ser eliminado por el sistema en determinadas circunstancias. Safari permite solicitar almacenamiento persistente, aunque no debemos asumir que siempre se concederá. <Cite refs={["turn144408search8","turn527630view0"]}/>

Diseñaría por tanto una estrategia de persistencia y exportación del archivo SQLite, con copias de seguridad fáciles de generar. La PWA también tendría que comprobar antes de comenzar un partido que dispone de todos sus recursos locales.

## El siguiente paso

Antes de escoger React, Svelte o cualquier otro framework, haría una **prueba de viabilidad de la cadena de voz en navegador**:

1. Grabar audio desde un botón *push to talk*.
2. Transcribirlo con Whistle, sin conexión.
3. Interpretarlo con Needle, también sin conexión.
4. Medir latencia, memoria y fiabilidad en Safari/iOS y Chrome/Android.

No necesitaríamos todavía una aplicación completa, ni siquiera SQLite.

Si funciona satisfactoriamente, apostaría por una PWA. Si falla por una limitación de WebAssembly, estudiaríamos la misma interfaz web con Capacitor y ejecución nativa de Cactus.

**Mi propuesta es que dejemos provisionalmente fijada una arquitectura web-first, con posibilidad de distribución nativa.** Es la que mejor responde a tus prioridades sin comprometernos todavía con una tecnología que no hayamos validado.

## C3.49 assistant

## Las dos condiciones que pondría

**1. La voz debe funcionar sin bloquear la interfaz.** Ejecutaríamos Whistle y Needle fuera del hilo principal, mediante *Web Workers*. Así, mientras se procesa el audio, el usuario puede seguir interactuando con las tarjetas. Lo que falta medir es la latencia real en iPhone y Android de gama media.

**2. No podemos arriesgarnos a perder un partido.** SQLite funciona en navegador mediante WebAssembly y OPFS, pero el almacenamiento web puede ser eliminado por el sistema en determinadas circunstancias. Safari permite solicitar almacenamiento persistente, aunque no debemos asumir que siempre se concederá. <Cite refs={["turn144408search8","turn527630view0"]}/>

Diseñaría por tanto una estrategia de persistencia y exportación del archivo SQLite, con copias de seguridad fáciles de generar. La PWA también tendría que comprobar antes de comenzar un partido que dispone de todos sus recursos locales.

## El siguiente paso

Antes de escoger React, Svelte o cualquier otro framework, haría una **prueba de viabilidad de la cadena de voz en navegador**:

1. Grabar audio desde un botón *push to talk*.
2. Transcribirlo con Whistle, sin conexión.
3. Interpretarlo con Needle, también sin conexión.
4. Medir latencia, memoria y fiabilidad en Safari/iOS y Chrome/Android.

No necesitaríamos todavía una aplicación completa, ni siquiera SQLite.

Si funciona satisfactoriamente, apostaría por una PWA. Si falla por una limitación de WebAssembly, estudiaríamos la misma interfaz web con Capacitor y ejecución nativa de Cactus.

**Mi propuesta es que dejemos provisionalmente fijada una arquitectura web-first, con posibilidad de distribución nativa.** Es la que mejor responde a tus prioridades sin comprometernos todavía con una tecnología que no hayamos validado.

## C3.50 user

se podría, una vez validado la parte web, empaquetarlo como apps?

## C3.57 assistant

**Sí. Y precisamente esa es una de las principales ventajas de elegir una arquitectura web con Capacitor.**

Podríamos desarrollar y validar la aplicación como PWA y, posteriormente, empaquetar prácticamente el mismo código para iOS y Android, sin reescribir la interfaz. Capacitor está diseñado específicamente para eso. <Cite ref="turn189126search5"/>

El resultado serían tres distribuciones:

- **PWA:** accesible mediante URL, instalable y operativa offline.
- **Android:** aplicación APK/AAB, distribuible directamente o mediante Google Play.
- **iOS:** aplicación instalable mediante los canales de distribución permitidos por Apple, incluida la App Store.

## ¿Qué tendríamos que adaptar?

La interfaz, la lógica de los eventos, las estadísticas y las reglas de validación podrían ser exactamente las mismas.

Hay dos componentes en los que convendría prever implementaciones diferentes:

**1. Reconocimiento de voz**

En la PWA utilizaríamos Cactus mediante WebAssembly. En las aplicaciones empaquetadas podríamos mantener WebAssembly o integrar directamente las bibliotecas nativas de Cactus.

Esta segunda alternativa podría mejorar el rendimiento, aunque habría que medirlo. Empaquetar una web no proporciona por sí solo una mejora de velocidad.

**2. SQLite**

En navegador usaríamos SQLite sobre OPFS. En las aplicaciones empaquetadas podríamos utilizar SQLite nativo, con almacenamiento más predecible. Existen plugins de Capacitor que contemplan ambos sistemas. <Cite ref="turn189126search7"/>

Aquí diseñaría desde el principio una capa de acceso a datos independiente de la plataforma. La estructura SQL sería común, aunque el almacenamiento físico fuera diferente.

## Mi recomendación

<box border radius="lg" padding={3} gap={2} align="center">
  <box background="surface-secondary" padding={3} radius="md" width="100" align="center">
    **Código común: TypeScript + interfaz web**

    <text color="secondary" size="xs">Eventos, estadísticas, validación y lógica de negocio</text>
  </box>
  <icon name="arrow-down" color="tertiary"/>
  <grid columns={3} gap={2}>
    {#each [{name:"PWA",sub:"Navegador"},{name:"iOS",sub:"Capacitor"},{name:"Android",sub:"Capacitor"}] as item}
      <grid-item>
        <box border radius="md" padding={2} align="center" gap={1}>
          **{item.name}**
          <text size="2xs" color="secondary">{item.sub}</text>
        </box>
      </grid-item>
    {/each}
  </grid>
</box>

**Diseñaría la aplicación desde el primer día como multiplataforma, pero desarrollaría inicialmente solo la PWA.**

Eso implica una pequeña disciplina arquitectónica: no acceder directamente al micrófono o a SQLite desde cualquier parte del código, sino hacerlo mediante interfaces que permitan sustituir la implementación web por una nativa.

Es un esfuerzo adicional pequeño al principio que puede ahorrarnos mucho trabajo después.

Hay una última precaución: cuando validemos la PWA, también deberíamos probar una compilación mínima con Capacitor en ambos sistemas, para detectar diferencias entre Safari/Chrome y sus respectivos WebViews.

Con esto, **consideraría la opción web-first + Capacitor como nuestra arquitectura tecnológica provisional**. El siguiente asunto que abordaría es elegir entre React y Svelte para la interfaz, porque ahí sí hay diferencias interesantes para una aplicación tan centrada en la rapidez de interacción.

## C3.58 user

vale, ahora quiero definir la interfaz, como podría definir cada una de laspantallas?

## C3.61 assistant

Te propongo definir la interfaz **pantalla por pantalla, empezando por la más importante: el partido en curso**. No empezaría programando, sino diseñando primero cómo debe comportarse la aplicación.

Lo haría de forma bastante visual, con bocetos (*wireframes*) que podamos ir modificando juntos.

## 1. Primero, un mapa de pantallas

Esta sería mi propuesta inicial de estructura:

<box border radius="lg" padding={3} gap={2} align="center">
  <box background="surface-secondary" radius="md" padding={3} width="85%" align="center">
    **Inicio**

    <text color="secondary" size="xs">Partidos · Equipos · Estadísticas históricas</text>
  </box>
  <icon name="arrow-down" color="tertiary"/>
  <grid columns={2} gap={3}>
    <grid-item>
      <box border radius="md" padding={3} align="center" gap={1}>
        **Equipos**
        <text size="xs" color="secondary" textAlign="center">Crear / editar equipo y plantilla</text>
      </box>
    </grid-item>
    <grid-item>
      <box border radius="md" padding={3} align="center" gap={1}>
        **Partidos**
        <text size="xs" color="secondary" textAlign="center">Lista, nuevo partido y edición</text>
      </box>
    </grid-item>
  </grid>
  <icon name="arrow-down" color="tertiary"/>
  <box border={{size:2,color:"default"}} radius="md" padding={3} width="85%" align="center" gap={1}>
    **Partido en curso / Editar partido**

    <text size="xs" color="secondary">Eventos | Estadísticas</text>
    <text size="xs" color="secondary">Captura por voz, edición y marcador</text>
  </box>
  <icon name="arrow-down" color="tertiary"/>
  <box background="surface-secondary" radius="md" padding={3} width="85%" align="center">
    **Estadísticas históricas y exportación**
  </box>
</box>

No todas las operaciones necesitan una pantalla. Por ejemplo, editar un evento o asignar un jugador puede hacerse en un panel que aparece sobre el partido, sin abandonar la vista principal.

## 2. Cómo definiría cada pantalla

Para cada una documentaría cinco aspectos:

1. **Objetivo:** qué necesita conseguir el usuario.
2. **Distribución:** qué elementos aparecen y dónde.
3. **Interacciones:** pulsaciones, gestos, botones y navegación.
4. **Estados:** normal, incompleto, editando, error, etc.
5. **Comportamiento:** qué ocurre al ejecutar cada acción y cómo se refleja en los datos.

Al principio nos concentraríamos en los tres primeros. Después precisaríamos las reglas de comportamiento.

## 3. Ejemplo: partido en curso

Este podría ser un primer boceto conceptual, pensado para un móvil en vertical.

<box background="surface-secondary" padding={3} radius="xl" align="center">
  <box background="surface" border radius="2xl" width="100%" maxWidth="340px" padding={3} gap={3}>
    <row justify="between" align="center">
      <text size="xs" color="secondary">2.º tiempo · 18:42</text>
      <icon name="settings-2" color="secondary"/>
    </row>
    <grid columns={3} gap={2}>
      <grid-item>
        <text weight="medium" textAlign="center">Local</text>
      </grid-item>
      <grid-item>
        <title size="xl" textAlign="center" tabularNums>18 - 16</title>
      </grid-item>
      <grid-item>
        <text weight="medium" textAlign="center">Visitante</text>
      </grid-item>
    </grid>
    <divider color="subtle"/>
    <segmented-control size="md" block options={[{label:"Eventos",value:"events"},{label:"Estadísticas",value:"stats"}]} defaultValue="events"/>
    <col gap={2}>
      <row justify="between" align="center">
        <text color="secondary" size="xs">ÚLTIMOS EVENTOS</text>
        <text color="secondary" size="xs">Editar orden</text>
      </row>
      <box border radius="lg" padding={3} gap={1}>
        <row justify="between">
          **Gol · Local**
          <text color="secondary" size="xs">18:34</text>
        </row>
        <row align="center" gap={1}>
          <icon name="circle-alert" color="caution" size="sm"/>
          <text size="sm">Jugador sin identificar</text>
        </row>
        <text color="secondary" size="xs">«gol nuestro, Ana»</text>
      </box>
      <box border radius="lg" padding={3} gap={1}>
        <row justify="between">
          **Parada · Visitante**
          <text color="secondary" size="xs">18:05</text>
        </row>
        <text size="sm">N.º 12 · Marta</text>
      </box>
      <box border radius="lg" padding={3} gap={1}>
        <row justify="between">
          **Exclusión · Local**
          <text color="secondary" size="xs">17:42</text>
        </row>
        <text size="sm">N.º 8 · Lucía</text>
      </box>
    </col>
    <spacer/>
    <divider color="subtle"/>
    <grid columns={2} gap={2}>
      <grid-item>
        <box background="surface-tertiary" radius="lg" padding={3} align="center" gap={1}>
          <icon name="plus" size="lg"/>
          <text size="xs" weight="medium">Evento manual</text>
        </box>
      </grid-item>
      <grid-item>
        <box background="rgba(31,99,186,0.12)" border={{size:1,color:"info"}} radius="lg" padding={3} align="center" gap={1}>
          <icon name="mic" color="info" size="lg"/>
          <text color="info" size="xs" weight="medium">Mantener para hablar</text>
        </box>
      </grid-item>
    </grid>
    <caption textAlign="center">Boceto conceptual, no interactivo</caption>
  </box>
</box>

Aquí hay decisiones importantes que iremos discutiendo: tamaño del botón de voz, cómo corregir rápidamente eventos, qué información merece estar siempre visible y cómo evitar pulsaciones accidentales.

## 4. Cómo avanzaría

Primero definiría la pantalla principal con bastante precisión, incluso varios bocetos alternativos. Después abordaríamos las pantallas secundarias manteniendo los mismos patrones visuales y de interacción.

Para empezar, te planteo una sola decisión:

**¿Diseñamos prioritariamente para un móvil utilizado con una mano y en vertical, o quieres dar la misma importancia a tabletas y uso horizontal?**

Mi preferencia sería móvil vertical como diseño principal y adaptación posterior a pantallas grandes. Esta decisión afecta mucho a la ergonomía del botón de voz y la edición de eventos.

## C3.62 user

me preocupa la compatibilidad del opfs con navegadores y sistemas antiguos

## C3.79 assistant

Es una preocupación fundada. Y creo que conviene resolverla antes de seguir con la interfaz, porque **OPFS tiene una compatibilidad razonablemente amplia, pero no universal, y plantea un problema de fiabilidad distinto al de la compatibilidad**.

## 1. ¿Qué dispositivos soportan OPFS con SQLite?

Según la documentación oficial de SQLite WebAssembly:

| Navegador / sistema | Compatibilidad |
|---|---|
| Safari / iOS 17 o posterior | Compatible |
| Safari / iOS 16.4–16.x | Compatible con una variante específica |
| Safari / iOS anterior a 16.4 | No lo consideraría compatible |
| Chrome / Android, versiones desde finales de 2022 | Compatible, con matices según la versión |
| Firefox 111 o posterior | Compatible |

<Cite refs={["turn255264search0","turn255264search1"]}/>

Hay un detalle interesante: SQLite ofrece varias implementaciones para OPFS. Una de ellas, `opfs-sahpool`, está recomendada cuando prima el rendimiento sobre el acceso concurrente.

Tiene tres ventajas para nosotros:

- Funciona en navegadores principales desde aproximadamente marzo de 2023.
- No necesita las cabeceras especiales COOP/COEP.
- Es especialmente rápida.

Su principal limitación es el acceso simultáneo a una misma base de datos desde varias pestañas, algo que podemos controlar en nuestra aplicación. <Cite ref="turn621947view1"/>

**Empezaría probando `opfs-sahpool`, no la implementación OPFS estándar.**

## 2. ¿Podemos dar soporte a dispositivos más antiguos?

Sí. Hay otra solución interesante: **SQLite sobre IndexedDB**.

El proyecto <Link url="https://github.com/rhashimoto/wa-sqlite" title="wa-sqlite"/> implementa sistemas de almacenamiento (*VFS*) que permiten ejecutar SQLite WebAssembly sobre IndexedDB, sin depender de OPFS.

Esto nos permitiría plantear dos mecanismos:

<box border radius="lg" padding={3} gap={2} align="center">
  <box background="surface-secondary" radius="md" padding={3} width="100%" align="center">
    **Aplicación web**

    <text color="secondary" size="xs">Una sola lógica de negocio y consultas SQL</text>
  </box>
  <icon name="arrow-down" color="tertiary"/>
  <grid columns={2} gap={2}>
    <grid-item>
      <box border radius="md" padding={3} align="center" gap={1}>
        **OPFS**
        <text color="secondary" textAlign="center" size="xs">Navegadores compatibles</text>
      </box>
    </grid-item>
    <grid-item>
      <box border radius="md" padding={3} align="center" gap={1}>
        **IndexedDB**
        <text color="secondary" textAlign="center" size="xs">Alternativa para navegadores antiguos</text>
      </box>
    </grid-item>
  </grid>
</box>

Seguiríamos utilizando SQLite, aunque la representación física del almacenamiento sería diferente. Se podría mantener una única base de datos lógica y exportarla como un archivo SQLite.

Eso sí: habría que validar las transacciones, el rendimiento y las migraciones entre ambos sistemas. No asumiría que el cambio de uno a otro es trivial.

## 3. El problema más importante: la persistencia

Aquí es donde sería especialmente prudente.

**Que OPFS funcione no garantiza que el navegador conserve los datos indefinidamente.**

Safari, por ejemplo, puede eliminar datos de aplicaciones web por presión de almacenamiento o inactividad. Desde Safari 17 permite solicitar almacenamiento persistente, pero debemos comprobar que se concede. <Cite refs={["turn255264search5","turn219053search2"]}/>

Y lo mismo puede ocurrir con IndexedDB. Cambiar OPFS por IndexedDB no resuelve ese riesgo.

Para una aplicación que registra un partido en directo, diseñaría tres salvaguardas:

1. Comprobar al abrir la aplicación que la base de datos funciona y que el almacenamiento está disponible.
2. Confirmar que cada evento se ha guardado realmente antes de considerarlo registrado.
3. Facilitar copias de seguridad fuera del almacenamiento del navegador, por ejemplo exportando el archivo SQLite. Una copia guardada en otro espacio del mismo navegador no sería suficiente.

## 4. Qué haría yo

No implementaría de entrada dos motores de almacenamiento.

**Propondría esta estrategia:**

- **Primera versión:** PWA con SQLite WASM y `opfs-sahpool`, estableciendo un mínimo de navegadores compatibles.
- **Arquitectura:** acceso a SQLite abstraído para poder cambiar el almacenamiento sin tocar la lógica del partido.
- **Segunda fase:** valorar IndexedDB como alternativa si las pruebas demuestran que necesitamos soportar dispositivos antiguos.
- **Apps empaquetadas:** SQLite nativo mediante Capacitor, evitando depender de OPFS dentro de las aplicaciones instaladas.

Hay además una consideración: si queremos soportar teléfonos realmente antiguos, posiblemente el mayor problema termine siendo **la ejecución local de Whistle y Needle**, por memoria y capacidad de procesamiento, antes que SQLite.

Por eso establecería la compatibilidad mínima a partir de pruebas de voz y base de datos conjuntamente.

---

Hay una cuestión que me ayudaría a decidir cuánto esfuerzo merece el soporte para navegadores antiguos:

**¿Te interesa que funcione en móviles de hace 5–7 años, por ejemplo iPhone 8, iPhone X o Android antiguos, o estaríamos pensando principalmente en dispositivos de los últimos 3–4 años?**

La diferencia puede justificar o no desarrollar ese segundo sistema de almacenamiento.

## C3.80 user

y usar indexeddb sin usar sqlite?

## C3.88 assistant

Sí. Y, de hecho, **para esta aplicación me parece una alternativa muy interesante a SQLite**. Incluso podría ser más adecuada si priorizamos la compatibilidad con navegadores antiguos y la sencillez tecnológica.

## ¿Qué ganaríamos usando IndexedDB directamente?

IndexedDB es una base de datos integrada en los navegadores. No necesita SQLite, WebAssembly ni ningún motor adicional.

Sus principales ventajas son:

- **Compatibilidad:** está disponible desde iOS 8 y versiones antiguas de Android, aunque las primeras implementaciones tenían problemas. A partir de Safari 14 su funcionamiento es bastante más fiable. <Cite refs={["turn301494search8","turn301494search0"]}/>
- **Rendimiento:** para almacenar cientos o miles de eventos de balonmano, su rendimiento debería ser más que suficiente.
- **Flexibilidad:** permite guardar objetos JavaScript directamente, incluyendo propiedades opcionales y estructuras anidadas.
- **Transacciones:** permite operaciones atómicas, importantes para mantener la consistencia.
- **Simplicidad:** eliminamos completamente una dependencia tecnológica.

## ¿Y qué perderíamos respecto a SQLite?

Principalmente tres cosas.

**1. Las consultas SQL**

IndexedDB no tiene `JOIN`, `GROUP BY` ni consultas SQL. Las estadísticas tendríamos que calcularlas en TypeScript.

Para nuestra aplicación no me preocupa demasiado. Podemos recuperar todos los eventos de un partido y calcular goles, exclusiones, paradas y evolución del marcador en memoria. El volumen de datos es pequeño.

**2. El archivo SQLite único**

IndexedDB no genera directamente un archivo SQLite exportable.

Podríamos exportar todos los datos a un único archivo JSON, que además sería legible y fácil de importar. También podríamos generar un SQLite durante la exportación, pero necesitaríamos código adicional.

**3. La portabilidad entre plataformas**

IndexedDB funciona también dentro de aplicaciones empaquetadas con Capacitor, por lo que podríamos conservar exactamente el mismo sistema.

Sin embargo, para obtener las ventajas de SQLite nativo tendríamos que desarrollar un adaptador o una migración. Y el almacenamiento de una PWA y el de una aplicación instalada con Capacitor no se comparten automáticamente.

## Hay algo que me gusta especialmente para tu modelo de eventos

Podríamos almacenar cada evento directamente como un objeto:

```json
{
  "id": "evt-123",
  "matchId": "match-456",
  "type": "goal",
  "teamId": "team-1",
  "playerId": null,
  "minute": 18,
  "status": "partial",
  "rawText": "gol nuestro Ana",
  "metadata": {},
  "createdAt": 1791972000,
  "updatedAt": 1791972000,
  "deletedAt": null
}
```

Si en futuras versiones incorporamos características nuevas, simplemente añadimos propiedades a los objetos.

**No necesitaríamos migraciones de estructura para añadir campos no indexados**, aunque sí para modificar índices o colecciones. Los eventos antiguos pueden seguir siendo válidos sin tener esos nuevos campos.

Esto encaja muy bien con tu requisito de minimizar cambios de esquema.

## ¿Qué tecnología utilizaría?

Usaría <Entity category="software" value="Dexie.js" disambig="biblioteca JavaScript para IndexedDB"/> sobre IndexedDB.

Dexie simplifica el acceso, las transacciones, los índices y las actualizaciones reactivas de la interfaz. También incorpora soluciones para algunos problemas de Safari. <Cite ref="turn301494search1"/>

## La única preocupación que seguiríamos teniendo

IndexedDB comparte con OPFS el problema de la persistencia: Safari puede eliminar datos almacenados por una web en determinadas circunstancias. Cambiar de OPFS a IndexedDB **no elimina ese riesgo**. <Cite ref="turn301494search2"/>

Por tanto, mantendría una estrategia explícita de copias de seguridad y recuperación, independientemente de la base de datos elegida.

---

**Mi recomendación ahora sería React o Svelte + TypeScript + Dexie/IndexedDB**, con exportación e importación de los datos mediante JSON.

Para la captura de eventos y las estadísticas que describes, no veo ninguna necesidad técnica importante que obligue a usar SQL.

Eso sí, hay una decisión que cambiaría con respecto a tus requisitos originales: abandonaríamos la idea de tener un único archivo SQLite como formato principal de almacenamiento.

¿Ese requisito del archivo SQLite respondía a alguna necesidad concreta —interoperabilidad, copias de seguridad, inspección manual— o simplemente lo elegiste porque te parecía una tecnología robusta? Esa distinción es importante para decidir.

## C3.89 user

Robustez o. Otra cuestión, que complemento se puede usar para diseñar los wireframes desde chatgpt?

## C3.94 assistant

The output of this plugin was redacted.

## C3.98 assistant

The output of this plugin was redacted.

## C3.103 assistant

Si elegiste SQLite principalmente por robustez, creo que **IndexedDB es perfectamente viable**, siempre que diseñemos bien las copias de seguridad. La principal amenaza no es la integridad de cada operación, sino que el navegador pueda eliminar los datos. Eso lo tendremos que resolver independientemente de la tecnología.

Respecto a los wireframes, he encontrado varios complementos que funcionan directamente desde ChatGPT. Para nuestro proyecto destacaría tres:

<box gap={3}>
  <row align="start" gap={3}>
    <AsyncImage query="Whimsical wireframe editor mobile app screen mockup interface" aspectRatio="4:3" maxWidth="124px"/>
    <box flex="1" gap={1}>
      **1. <Entity category="software" value="Whimsical" disambig="herramienta de diagramas y wireframes"/>**

      Mi primera opción para definir las pantallas. Podemos describirlas conversando, generar wireframes, modificarlos y organizar los flujos de navegación. Los elementos siguen siendo editables.
    </box>
  </row>
  <divider color="subtle"/>
  <row align="start" gap={3}>
    <AsyncImage query="MagicPath AI app prototyping interface mobile app design editor" aspectRatio="4:3" maxWidth="124px"/>
    <box flex="1" gap={1}>
      **2. <Entity category="software" value="MagicPath" disambig="herramienta de prototipado interactivo con inteligencia artificial"/>**

      Especialmente interesante si queremos pasar de wireframes a prototipos interactivos. Permite diseñar pantallas, probar interacciones y continuar iterando desde ChatGPT.
    </box>
  </row>
  <divider color="subtle"/>
  <row align="start" gap={3}>
    <AsyncImage query="Figma mobile application UI UX wireframe design editor frames" aspectRatio="4:3" maxWidth="124px"/>
    <box flex="1" gap={1}>
      **3. <Entity category="software" value="Figma" disambig="software de diseño de interfaces y prototipos"/>**

      Más apropiado para convertir el diseño en una especificación visual detallada, con componentes reutilizables y medidas precisas que después faciliten la implementación.
    </box>
  </row>
</box>

Te he facilitado las opciones para conectar Whimsical y MagicPath directamente con ChatGPT.

**Para nuestra aplicación empezaría con Whimsical.** Me interesa que podamos discutir el tamaño y la posición del botón de voz, la representación de los eventos incompletos y la navegación, sin distraernos todavía con colores o acabados.

Cuando tengamos clara la ergonomía, podemos pasar a MagicPath para probar interacciones reales.

La idea sería trabajar aquí pantalla por pantalla, generar el wireframe y corregirlo mediante instrucciones como «haz el marcador más pequeño», «deja fijo el botón del micrófono» o «muestra los últimos cuatro eventos sin desplazamiento».

Así estaríamos diseñando la interfaz conjuntamente, no simplemente generando imágenes de cómo podría quedar.

## C3.104 user

Pero requiere cuenta en estos servicios?

## C3.111 assistant

**Sí, generalmente requieren una cuenta en el servicio externo**, aunque no necesariamente una suscripción de pago.

- **Whimsical:** requiere conectar el servicio y completar la autorización. <Cite ref="turn800493search2"/>
- **MagicPath:** ofrece integración con ChatGPT, pero para mantener y editar los proyectos en su plataforma contempla iniciar sesión. <Cite ref="turn800493search10"/>
- **Figma:** puedes generar contenido desde ChatGPT, pero necesitas una cuenta de Figma para guardarlo en tu espacio y editarlo allí. <Cite ref="turn800493search0"/>

**Pero podemos prescindir de todos ellos.**

Dentro de esta misma conversación puedo diseñar wireframes y prototipos interactivos, sin cuentas adicionales.

Esto nos permitiría:

1. Diseñar una pantalla de la aplicación.
2. Visualizarla aquí, con controles y datos de ejemplo.
3. Probar ciertas interacciones, como desplegar un evento, cambiar de pestaña o seleccionar un jugador.
4. Modificarla conversando hasta llegar a un diseño satisfactorio.
5. Posteriormente, trasladar el diseño a React o Svelte.

Mi recomendación sería **empezar directamente aquí**, sin depender de servicios externos. Para una aplicación como la tuya, en la que importa especialmente estudiar la ergonomía y la velocidad de uso, un prototipo interactivo puede ser más útil que un wireframe estático.

Podemos empezar con la pantalla del partido en curso y trabajar sobre ella de forma iterativa.

## C3.112 user

Empezamos

## C3.117 assistant

Vamos a hacer una primera versión de la **pantalla principal de partido en curso**, pensada para móvil vertical y uso con una mano.

He priorizado tres cosas: marcador siempre visible, identificación inmediata de eventos incompletos y acceso rápido a la captura. Este primer prototipo permite cambiar de pestaña, corregir jugadores y añadir eventos de prueba.

{@body const [tab,setTab] = DIL.useState("events")}
{@body const [events,setEvents] = DIL.useState([{id:"e1",type:"Gol",team:"Local",playerId:"",player:"",time:"18:34",rawText:"gol nuestro, Ana"},{id:"e2",type:"Parada",team:"Visitante",playerId:"v12",player:"12 · Marta",time:"18:05",rawText:""},{id:"e3",type:"Exclusión",team:"Local",playerId:"l8",player:"8 · Lucía",time:"17:42",rawText:""}])}
{@body const [editing,setEditing] = DIL.useState("")}
{@body const [draft,setDraft] = DIL.useState("")}
{@body const [manualOpen,setManualOpen] = DIL.useState(false)}
{@body const [manualType,setManualType] = DIL.useState("Gol")}
{@body const [manualTeam,setManualTeam] = DIL.useState("Local")}
{@body const [captureCount,setCaptureCount] = DIL.useState(0)}
{@body const pending = events.filter(e=>!e.playerId).length}
{@body const homeScore = 18+events.filter(e=>e.newEvent&&e.type==="Gol"&&e.team==="Local").length}
{@body const awayScore = 16+events.filter(e=>e.newEvent&&e.type==="Gol"&&e.team==="Visitante").length}
{@body const nameMap = {"l9":"9 · Ana Ruiz","l8":"8 · Lucía","l1":"1 · Paula","v12":"12 · Marta","v7":"7 · Sara"}}
{@body const addEvent = (type,team,rawText) => {setEvents(old=>[{id:"n"+(old.length+1),type,team,playerId:"",player:"",time:"18:43",rawText,newEvent:true},...old]);setTab("events");setEditing("");setManualOpen(false);}}
<box background="surface-secondary" padding={3} radius="2xl" align="center">
  <box background="surface" border radius="2xl" padding={3} width="100%" maxWidth="390px" gap={3}>
    <row align="center" justify="between">
      <row gap={2} align="center">
        <icon name="activity" color="success"/>
        <text weight="medium" size="xs">Partido en curso</text>
      </row>
      <text color="secondary" size="xs">2.º tiempo · 18:42</text>
    </row>
    <grid columns={3} gap={1}>
      <grid-item>
        <box align="center" justify="center" gap={1} height="100%">
          <text weight="medium" textAlign="center" size="sm">Nuestro</text>
          <text size="2xs" color="secondary">Local</text>
        </box>
      </grid-item>
      <grid-item>
        <box align="center" justify="center" gap={1}>
          <title size="2xl" tabularNums>{homeScore} : {awayScore}</title>
          <text size="2xs" color="secondary">MARCADOR</text>
        </box>
      </grid-item>
      <grid-item>
        <box align="center" justify="center" gap={1} height="100%">
          <text weight="medium" textAlign="center" size="sm">Rival</text>
          <text size="2xs" color="secondary">Visitante</text>
        </box>
      </grid-item>
    </grid>
    <segmented-control block size="md" value={tab} onChange={setTab} options={[{"label":"Eventos","value":"events"},{"label":"Estadísticas","value":"stats"}]}/>
    {#if tab==="events"}
      <row justify="between" align="center">
        <text weight="medium" size="sm">Eventos recientes</text>
        <row align="center" gap={1}>
          {#if pending>0}
            <icon name="alert-circle" color="caution" size="sm"/>
            <text size="xs" color="secondary">{pending} pendientes</text>
          {:else}
            <icon name="check-circle" color="success" size="sm"/>
            <text size="xs" color="secondary">Todo completo</text>
          {/if}
        </row>
      </row>
      <box gap={2} maxHeight="336px" scrollable>
        {#each events as ev}
          <box key={ev.id} border={{size:1,color:!ev.playerId?"warning":"default"}} radius="lg" padding={3} gap={2}>
            <row justify="between" align="start">
              <box gap={1} flex="1">
                <row gap={2} align="center">
                  <icon name={ev.type==="Gol"?"circle-dot":ev.type==="Parada"?"shield-check":ev.type==="Exclusión"?"timer-off":"circle"} size="sm" color="secondary"/>
                  <text weight="medium" size="sm">{ev.type} · {ev.team}</text>
                </row>
                {#if !ev.playerId}
                  <row align="center" gap={1}>
                    <icon name="alert-triangle" color="caution" size="xs"/>
                    <text size="xs" color="secondary">Jugador sin identificar</text>
                  </row>
                {:else}
                  <text size="sm">{ev.player}</text>
                {/if}
              </box>
              <text size="xs" color="secondary" tabularNums>{ev.time}</text>
            </row>
            {#if ev.rawText}
              <text size="xs" color="secondary">«{ev.rawText}»</text>
            {/if}
            {#if editing===ev.id}
              <divider color="subtle"/>
              <text size="xs" weight="medium">Asignar jugador</text>
              <select block size="md" value={draft} onChange={setDraft} options={ev.team==="Local"?[{label:"Sin identificar",value:""},{label:"9 · Ana Ruiz",value:"l9"},{label:"8 · Lucía",value:"l8"},{label:"1 · Paula",value:"l1"}]:[{label:"Sin identificar",value:""},{label:"12 · Marta",value:"v12"},{label:"7 · Sara",value:"v7"}]}/>
              <row justify="end" gap={2}>
                <button size="sm" color="secondary" variant="outline" onClick={()=>setEditing("")}>Cancelar</button>
                <button size="sm" onClick={()=>{setEvents(old=>old.map(e=>e.id===ev.id?{...e,playerId:draft,player:nameMap[draft]||""}:e));setEditing("");}}>Guardar</button>
              </row>
            {:else}
              <row justify="end">
                <button size="xs" color="secondary" variant="outline" onClick={()=>{setEditing(ev.id);setDraft(ev.playerId)}}><icon name="pencil" size="xs"/> Editar jugador</button>
              </row>
            {/if}
          </box>
        {/each}
      </box>
    {:else}
      <box gap={3} minHeight="260px">
        <text weight="medium" size="sm">Resumen del partido</text>
        <grid columns={2} gap={2}>
          <grid-item>
            <box background="surface-secondary" radius="lg" padding={3} gap={1}>
              <text color="secondary" size="xs">Goles local</text>
              <title size="xl" tabularNums>{homeScore}</title>
            </box>
          </grid-item>
          <grid-item>
            <box background="surface-secondary" radius="lg" padding={3} gap={1}>
              <text color="secondary" size="xs">Goles visitante</text>
              <title size="xl" tabularNums>{awayScore}</title>
            </box>
          </grid-item>
        </grid>
        <text size="xs" weight="medium">Eventos visibles en esta demostración</text>
        <table>
          <table-row><table-cell>Goles atribuidos a jugador</table-cell><table-cell align="end">{events.filter(e=>e.type==="Gol"&&!!e.playerId).length}</table-cell></table-row>
          <table-row><table-cell>Paradas registradas</table-cell><table-cell align="end">{events.filter(e=>e.type==="Parada").length}</table-cell></table-row>
          <table-row><table-cell>Exclusiones registradas</table-cell><table-cell align="end">{events.filter(e=>e.type==="Exclusión").length}</table-cell></table-row>
          <table-row><table-cell>Eventos pendientes</table-cell><table-cell align="end">{pending}</table-cell></table-row>
        </table>
        <caption>La lista de ejemplo solo contiene los últimos eventos, no todo el historial del marcador.</caption>
      </box>
    {/if}
    {#if manualOpen}
      <box background="surface-secondary" radius="lg" padding={3} gap={2}>
        <text size="sm" weight="medium">Nuevo evento manual</text>
        <label>Tipo</label>
        <select block value={manualType} onChange={setManualType} options={[{label:"Gol",value:"Gol"},{label:"Exclusión",value:"Exclusión"},{label:"Parada",value:"Parada"},{label:"Balón perdido",value:"Balón perdido"}]}/>
        <label>Equipo</label>
        <segmented-control block size="md" value={manualTeam} onChange={setManualTeam} options={[{label:"Nuestro",value:"Local"},{label:"Rival",value:"Visitante"}]}/>
        <row gap={2} justify="end">
          <button size="sm" color="secondary" variant="outline" onClick={()=>setManualOpen(false)}>Cancelar</button>
          <button size="sm" onClick={()=>addEvent(manualType,manualTeam,"")}>Registrar</button>
        </row>
      </box>
    {/if}
    <divider color="subtle"/>
    <grid columns={2} gap={2}>
      <grid-item>
        <pressable background="surface-secondary" radius="xl" padding={3} align="center" gap={2} onClick={()=>setManualOpen(!manualOpen)}>
          <icon name="plus-circle" size="xl"/>
          <text size="sm" weight="medium">Evento manual</text>
        </pressable>
      </grid-item>
      <grid-item>
        <pressable background="rgba(30,102,204,0.12)" border={{size:1,color:"info"}} radius="xl" padding={3} align="center" gap={2} onClick={()=>{addEvent("Gol","Local","gol nuestro, Ana");setCaptureCount(n=>n+1)}}>
          <icon name="mic" color="info" size="xl"/>
          <text size="sm" weight="medium" color="info">Simular voz</text>
        </pressable>
      </grid-item>
    </grid>
    <caption textAlign="center">Prototipo · La voz es simulada; todavía no se utiliza el micrófono.</caption>
  </box>
</box>

## Qué quiero que probemos

Puedes hacer tres pruebas en el prototipo:

- Pulsa **Editar jugador** en el primer gol y asígnalo a Ana Ruiz. Observa cómo desaparece su estado pendiente.
- Entra en **Estadísticas** y comprueba que el gol se atribuye a una jugadora sin alterar el marcador.
- Pulsa **Simular voz** para registrar otro gol incompleto, o usa **Evento manual**.

Todavía no hemos diseñado el cronómetro, la reordenación de tarjetas, la edición completa de eventos ni los controles de tiempo. Prefiero resolverlos después.

**Mi primera pregunta es ergonómica:** ¿te convence que los dos botones de captura ocupen la parte inferior, o preferirías un botón de voz mucho más grande y dominante, dejando la entrada manual como una acción secundaria?

Esa decisión va a condicionar bastante el diseño.

## C3.118 user

Así está bien. Hace falta un botón de parar tiempo y las tarjetas tienen que ser más reducidas. El botón es editar, ya que se pueden cambiar más cosas, hasta el evento. Los eventos propios left aligned y los otros right. Iconos para cada evento está genial

## C3.121 assistant

Me parecen buenos cambios. He reducido las tarjetas, separado visualmente los eventos propios (izquierda) de los rivales (derecha) y añadido el control de pausa del cronómetro.

El botón **Editar** ahora permite modificar el tipo de evento, equipo, jugador, tiempo y nota, no solo asignar un jugador.

{@body const types = [{label:"Gol",value:"Gol"},{label:"Exclusión (2 min)",value:"Exclusión"},{label:"Tiro fallado",value:"Tiro fallado"},{label:"Parada",value:"Parada"},{label:"Balón perdido",value:"Balón perdido"},{label:"Balón recuperado",value:"Balón recuperado"},{label:"Pasivo",value:"Pasivo"},{label:"Pasos / dobles",value:"Pasos / dobles"},{label:"Tarjeta amarilla",value:"Tarjeta amarilla"},{label:"Tarjeta roja",value:"Tarjeta roja"},{label:"Tarjeta azul",value:"Tarjeta azul"}]}
{@body const icons = {"Gol":"circle-dot","Exclusión":"timer-off","Tiro fallado":"target","Parada":"shield-check","Balón perdido":"arrow-down-left","Balón recuperado":"arrow-up-right","Pasivo":"hourglass","Pasos / dobles":"footprints","Tarjeta amarilla":"square","Tarjeta roja":"square","Tarjeta azul":"square"}}
{@body const playerTypes = ["Gol","Exclusión","Tiro fallado","Parada","Tarjeta amarilla","Tarjeta roja","Tarjeta azul"]}
{@body const homePlayers = [{label:"Sin identificar",value:""},{label:"9 · Ana Ruiz",value:"l9"},{label:"8 · Lucía",value:"l8"},{label:"1 · Paula",value:"l1"}]}
{@body const awayPlayers = [{label:"Sin identificar",value:""},{label:"12 · Marta",value:"v12"},{label:"7 · Sara",value:"v7"}]}
{@body const allNames = {l9:"9 · Ana Ruiz",l8:"8 · Lucía",l1:"1 · Paula",v12:"12 · Marta",v7:"7 · Sara"}}
{@body const [tab,setTab] = DIL.useState("events")}
{@body const [paused,setPaused] = DIL.useState(false)}
{@body const [events,setEvents] = DIL.useState([{id:"e1",type:"Gol",team:"Local",playerId:"",time:"18:34",rawText:"gol nuestro, Ana",note:""},{id:"e2",type:"Parada",team:"Visitante",playerId:"v12",time:"18:05",rawText:"",note:""},{id:"e3",type:"Exclusión",team:"Local",playerId:"l8",time:"17:42",rawText:"",note:""},{id:"e4",type:"Tiro fallado",team:"Visitante",playerId:"v7",time:"16:58",rawText:"",note:""},{id:"e5",type:"Gol",team:"Local",playerId:"l9",time:"16:22",rawText:"",note:""}])}
{@body const [editing,setEditing] = DIL.useState("")}
{@body const [draft,setDraft] = DIL.useState({type:"Gol",team:"Local",playerId:"",time:"18:42",note:""})}
{@body const [manual,setManual] = DIL.useState(false)}
{@body const [manualType,setManualType] = DIL.useState("Gol")}
{@body const [manualTeam,setManualTeam] = DIL.useState("Local")}
{@body const incomplete = events.filter(e=>playerTypes.includes(e.type)&&!e.playerId).length}
{@body const localScore = 17+events.filter(e=>e.type==="Gol"&&e.team==="Local").length}
{@body const visitorScore = 16+events.filter(e=>e.type==="Gol"&&e.team==="Visitante").length}
{@body const validTime = /^\d{1,2}:[0-5]\d$/.test(draft.time||"")}
{@body const addEvent = (type,team,rawText="")=>{setEvents(old=>[{id:"new"+(old.length+1),type,team,playerId:"",time:"18:42",rawText,note:""},...old]);setTab("events");setManual(false);setEditing("");}}
<box background="surface-secondary" radius="2xl" padding={3} align="center">
  <box background="surface" border radius="2xl" padding={3} maxWidth="390px" width="100%" gap={3}>
    <row justify="between" align="center">
      <box gap="2px">
        <text size="xs" color="secondary">2.º tiempo</text>
        <row align="center" gap={2}>
          <title size="xl" tabularNums>18:42</title>
          <icon name={paused?"pause-circle":"play-circle"} color={paused?"caution":"success"} size="sm"/>
          <text size="2xs" color="secondary">{paused?"Pausado":"En juego"}</text>
        </row>
      </box>
      <button color={paused?"success":"secondary"} variant="outline" size="md" onClick={()=>setPaused(v=>!v)}>
        <icon name={paused?"play":"pause"} size="sm"/> {paused?"Reanudar":"Parar tiempo"}
      </button>
    </row>
    <box background="surface-secondary" radius="lg" padding={3}>
      <grid columns={3} gap={1}>
        <grid-item>
          <box align="start" justify="center" height="100%" gap={1}>
            <text size="sm" weight="medium">Nuestro</text>
            <text size="2xs" color="secondary">Local</text>
          </box>
        </grid-item>
        <grid-item>
          <box align="center" gap={1}>
            <title size="2xl" tabularNums>{localScore} : {visitorScore}</title>
            <text color="secondary" size="2xs">MARCADOR</text>
          </box>
        </grid-item>
        <grid-item>
          <box align="end" justify="center" height="100%" gap={1}>
            <text size="sm" weight="medium">Rival</text>
            <text size="2xs" color="secondary">Visitante</text>
          </box>
        </grid-item>
      </grid>
    </box>
    <segmented-control block size="md" value={tab} onChange={setTab} options={[{label:"Eventos",value:"events"},{label:"Estadísticas",value:"stats"}]}/>
    {#if tab==="events"}
      <row justify="between" align="center">
        <text color="secondary" size="xs">EVENTOS · MÁS RECIENTES PRIMERO</text>
        {#if incomplete>0}
          <row align="center" gap={1}>
            <icon name="alert-circle" color="caution" size="sm"/>
            <text color="secondary" size="xs">{incomplete} pendientes</text>
          </row>
        {/if}
      </row>
      <box gap={2} scrollable maxHeight="340px">
        {#each events as ev}
          <row key={ev.id} justify={ev.team==="Local"?"start":"end"}>
            <box width="93%" gap={1}>
              <box border={{size:1,color:playerTypes.includes(ev.type)&&!ev.playerId?"warning":"default"}} background="surface" radius="md" padding={2}>
                <row align="center" gap={2}>
                  {#if ev.team==="Local"}
                    <icon name={icons[ev.type]||"circle"} color={ev.type==="Tarjeta roja"?"danger":ev.type==="Tarjeta amarilla"?"warning":ev.type==="Tarjeta azul"?"info":"secondary"} size="md"/>
                    <box flex="1" gap="2px">
                      <text size="sm" weight="medium">{ev.type}</text>
                      <row align="center" gap={1}>
                        {#if playerTypes.includes(ev.type)&&!ev.playerId}
                          <icon name="alert-triangle" color="caution" size="xs"/>
                        {/if}
                        <text size="xs" color="secondary">{ev.playerId?allNames[ev.playerId]:"Sin jugador"}</text>
                      </row>
                    </box>
                    <text size="2xs" color="secondary" tabularNums>{ev.time}</text>
                    <button size="xs" color="secondary" variant="ghost" onClick={()=>{setEditing(editing===ev.id?"":ev.id);setDraft({...ev})}}>Editar</button>
                  {:else}
                    <button size="xs" color="secondary" variant="ghost" onClick={()=>{setEditing(editing===ev.id?"":ev.id);setDraft({...ev})}}>Editar</button>
                    <text size="2xs" color="secondary" tabularNums>{ev.time}</text>
                    <box flex="1" align="end" gap="2px">
                      <text size="sm" weight="medium" textAlign="right">{ev.type}</text>
                      <row align="center" justify="end" gap={1}>
                        {#if playerTypes.includes(ev.type)&&!ev.playerId}
                          <icon name="alert-triangle" color="caution" size="xs"/>
                        {/if}
                        <text size="xs" color="secondary">{ev.playerId?allNames[ev.playerId]:"Sin jugador"}</text>
                      </row>
                    </box>
                    <icon name={icons[ev.type]||"circle"} color={ev.type==="Tarjeta roja"?"danger":ev.type==="Tarjeta amarilla"?"warning":ev.type==="Tarjeta azul"?"info":"secondary"} size="md"/>
                  {/if}
                </row>
              </box>
              {#if editing===ev.id}
                <box background="surface-secondary" radius="lg" padding={3} gap={2}>
                  <row align="center" justify="between">
                    **Editar evento**
                    <button size="xs" color="secondary" variant="ghost" onClick={()=>setEditing("")}><icon name="x"/></button>
                  </row>
                  <label>Tipo de evento</label>
                  <select block size="md" value={draft.type} onChange={v=>setDraft(d=>({...d,type:v}))} options={types}/>
                  <label>Equipo</label>
                  <segmented-control block size="md" value={draft.team} onChange={v=>setDraft(d=>({...d,team:v,playerId:""}))} options={[{label:"Nuestro",value:"Local"},{label:"Rival",value:"Visitante"}]}/>
                  <label>Jugador</label>
                  <select block size="md" value={draft.playerId} onChange={v=>setDraft(d=>({...d,playerId:v}))} options={draft.team==="Local"?homePlayers:awayPlayers}/>
                  <label>Tiempo (MM:SS)</label>
                  <input size="md" value={draft.time} onChange={v=>setDraft(d=>({...d,time:v}))} invalid={!validTime}/>
                  <label>Nota</label>
                  <textarea rows={2} value={draft.note||""} onChange={v=>setDraft(d=>({...d,note:v}))} placeholder="Comentario opcional"/>
                  {#if draft.rawText}
                    <text color="secondary" size="xs">Voz original: «{draft.rawText}»</text>
                  {/if}
                  <row justify="end" gap={2}>
                    <button size="sm" color="secondary" variant="outline" onClick={()=>setEditing("")}>Cancelar</button>
                    <button size="sm" disabled={!validTime} onClick={()=>{setEvents(old=>old.map(item=>item.id===ev.id?{...draft}:item));setEditing("")}}>Guardar</button>
                  </row>
                </box>
              {/if}
            </box>
          </row>
        {/each}
      </box>
    {:else}
      <box gap={3} minHeight="240px">
        <text weight="medium">Estadísticas del partido</text>
        <grid columns={2} gap={2}>
          <grid-item>
            <box background="surface-secondary" radius="lg" padding={3}>
              <text size="xs" color="secondary">Goles propios</text>
              <title size="xl">{localScore}</title>
            </box>
          </grid-item>
          <grid-item>
            <box background="surface-secondary" radius="lg" padding={3}>
              <text size="xs" color="secondary">Goles rivales</text>
              <title size="xl">{visitorScore}</title>
            </box>
          </grid-item>
        </grid>
        <text size="sm" weight="medium">Eventos de la demostración</text>
        <table>
          <table-row><table-cell>Goles asignados a jugador</table-cell><table-cell align="end">{events.filter(e=>e.type==="Gol"&&e.playerId).length}</table-cell></table-row>
          <table-row><table-cell>Paradas</table-cell><table-cell align="end">{events.filter(e=>e.type==="Parada").length}</table-cell></table-row>
          <table-row><table-cell>Exclusiones</table-cell><table-cell align="end">{events.filter(e=>e.type==="Exclusión").length}</table-cell></table-row>
          <table-row><table-cell>Identificaciones pendientes</table-cell><table-cell align="end">{incomplete}</table-cell></table-row>
        </table>
        <caption>El marcador incluye goles anteriores no mostrados en el prototipo.</caption>
      </box>
    {/if}
    {#if manual}
      <box background="surface-secondary" radius="lg" padding={3} gap={2}>
        <text weight="medium" size="sm">Nuevo evento manual</text>
        <select block value={manualType} onChange={setManualType} options={types}/>
        <segmented-control block value={manualTeam} onChange={setManualTeam} options={[{label:"Nuestro",value:"Local"},{label:"Rival",value:"Visitante"}]}/>
        <row gap={2} justify="end">
          <button size="sm" color="secondary" variant="outline" onClick={()=>setManual(false)}>Cancelar</button>
          <button size="sm" onClick={()=>addEvent(manualType,manualTeam)}>Registrar</button>
        </row>
      </box>
    {/if}
    <divider color="subtle"/>
    <grid columns={2} gap={2}>
      <grid-item>
        <pressable background="surface-secondary" radius="xl" padding={3} align="center" gap={2} onClick={()=>setManual(v=>!v)}>
          <icon name="plus-circle" size="xl"/>
          <text size="sm" weight="medium">Evento manual</text>
        </pressable>
      </grid-item>
      <grid-item>
        <pressable background="rgba(30,102,204,0.12)" border={{size:1,color:"info"}} radius="xl" padding={3} align="center" gap={2} onClick={()=>addEvent("Gol","Local","gol nuestro, Ana")}>
          <icon name="mic" color="info" size="xl"/>
          <text size="sm" color="info" weight="medium">Simular voz</text>
        </pressable>
      </grid-item>
    </grid>
    <caption textAlign="center">Prototipo interactivo. El cronómetro muestra un tiempo de ejemplo y la captura de voz es simulada.</caption>
  </box>
</box>

Hay una decisión de interacción que me parece interesante: **al pulsar Editar, ¿prefieres que los campos se desplieguen debajo de la tarjeta, como ahora, o que aparezca un panel desde la parte inferior de la pantalla?**

Me inclino por el panel inferior: permite mantener las tarjetas muy compactas y editar sin desplazar la lista de eventos.

## C3.122 user

Muestra un ejemplo 

## C3.125 assistant

Así quedaría la edición mediante un **panel inferior (*bottom sheet*)**. Al pulsar «Editar», aparece desde abajo sin abandonar el partido. La lista permanece detrás y la tarjeta seleccionada queda identificada.

Puedes modificar los campos, guardar y volver a abrir el panel.

{@body const initialRows = [{id:"a",type:"Gol",team:"Nuestro",player:"",time:"18:34",note:"",raw:"gol nuestro, Ana"},{id:"b",type:"Parada",team:"Rival",player:"12 · Marta",time:"18:05",note:"",raw:""},{id:"c",type:"Exclusión",team:"Nuestro",player:"8 · Lucía",time:"17:42",note:"",raw:""}]}
{@body const [rows,setRows] = DIL.useState(initialRows)}
{@body const [selected,setSelected] = DIL.useState("a")}
{@body const [sheet,setSheet] = DIL.useState(true)}
{@body const [paused,setPaused] = DIL.useState(false)}
{@body const [draft,setDraft] = DIL.useState({...initialRows[0]})}
{@body const eventOptions = [{label:"Gol",value:"Gol"},{label:"Parada",value:"Parada"},{label:"Exclusión",value:"Exclusión"},{label:"Tiro fallado",value:"Tiro fallado"},{label:"Balón perdido",value:"Balón perdido"},{label:"Balón recuperado",value:"Balón recuperado"},{label:"Pasivo",value:"Pasivo"},{label:"Tarjeta amarilla",value:"Tarjeta amarilla"},{label:"Tarjeta roja",value:"Tarjeta roja"}]}
{@body const iconNames = {"Gol":"circle-dot","Parada":"shield-check","Exclusión":"timer-off","Tiro fallado":"target","Balón perdido":"arrow-down-left","Balón recuperado":"arrow-up-right","Pasivo":"hourglass","Tarjeta amarilla":"square","Tarjeta roja":"square"}}
{@body const ownScore = 17+rows.filter(x=>x.type==="Gol"&&x.team==="Nuestro").length}
{@body const rivalScore = 16+rows.filter(x=>x.type==="Gol"&&x.team==="Rival").length}
{@body const edit = (e)=>{setDraft({...e});setSelected(e.id);setSheet(true)}}
<box background="surface-secondary" padding={3} radius="2xl" align="center">
  <box background="surface" border radius="2xl" width="100%" maxWidth="390px" padding={3} gap={3}>
    <row justify="between" align="center">
      <box gap="2px">
        <text size="xs" color="secondary">2.º tiempo</text>
        <row align="center" gap={2}>
          <title size="xl" tabularNums>18:42</title>
          <text color="secondary" size="2xs">{paused?"Pausado":"En juego"}</text>
        </row>
      </box>
      <button size="sm" color="secondary" variant="outline" onClick={()=>setPaused(v=>!v)}>
        <icon name={paused?"play":"pause"}/> {paused?"Reanudar":"Parar tiempo"}
      </button>
    </row>
    <box background="surface-secondary" radius="lg" padding={3}>
      <row justify="between" align="center">
        <text weight="medium" size="sm">Nuestro</text>
        <title size="2xl" tabularNums>{ownScore} : {rivalScore}</title>
        <text weight="medium" size="sm">Rival</text>
      </row>
    </box>
    <segmented-control block size="md" value="Eventos" options={[{label:"Eventos",value:"Eventos"},{label:"Estadísticas",value:"Estadísticas"}]} disabled/>
    <box gap={2}>
      <row justify="between" align="center">
        <text color="secondary" size="xs">EVENTOS</text>
        <text color="secondary" size="xs">18:42</text>
      </row>
      {#each rows as e}
        <row key={e.id} justify={e.team==="Nuestro"?"start":"end"}>
          <pressable width="91%" onClick={()=>edit(e)} border={{size:sheet&&selected===e.id?2:1,color:sheet&&selected===e.id?"info":!e.player?"warning":"default"}} radius="md" background={sheet&&selected===e.id?"surface-secondary":"surface"} padding={2} gap={1}>
            <row align="center" gap={2} justify={e.team==="Nuestro"?"start":"end"}>
              {#if e.team==="Nuestro"}
                <icon name={iconNames[e.type]||"circle"} color="secondary" size="md"/>
              {/if}
              <box flex="1" align={e.team==="Nuestro"?"start":"end"} gap="2px">
                <text size="sm" weight="medium">{e.type}</text>
                <text color="secondary" size="xs">{e.player||"Jugador sin identificar"}</text>
              </box>
              <text size="2xs" color="secondary" tabularNums>{e.time}</text>
              <icon name="pencil" size="xs" color="secondary"/>
              {#if e.team==="Rival"}
                <icon name={iconNames[e.type]||"circle"} color="secondary" size="md"/>
              {/if}
            </row>
          </pressable>
        </row>
      {/each}
    </box>
    {#if sheet}
      <box background="surface-secondary" radius="xl" padding={3} gap={3} border={{top:{size:2,color:"default"}}}>
        <box align="center" gap={1}>
          <box background="border-strong" width="42px" height="4px" radius="full"/>
        </box>
        <row justify="between" align="center">
          <title size="lg">Editar evento</title>
          <button color="secondary" variant="ghost" size="sm" onClick={()=>setSheet(false)}><icon name="x"/></button>
        </row>
        <box gap={1}>
          <label>Tipo de evento</label>
          <select block size="lg" value={draft.type} options={eventOptions} onChange={v=>setDraft(d=>({...d,type:v}))}/>
        </box>
        <box gap={1}>
          <label>Equipo</label>
          <segmented-control block size="lg" value={draft.team} onChange={v=>setDraft(d=>({...d,team:v,player:""}))} options={[{label:"Nuestro",value:"Nuestro"},{label:"Rival",value:"Rival"}]}/>
        </box>
        <box gap={1}>
          <label>Jugador</label>
          <select block size="lg" value={draft.player} onChange={v=>setDraft(d=>({...d,player:v}))} options={draft.team==="Nuestro"?[{label:"Sin identificar",value:""},{label:"9 · Ana Ruiz",value:"9 · Ana Ruiz"},{label:"8 · Lucía",value:"8 · Lucía"},{label:"1 · Paula",value:"1 · Paula"}]:[{label:"Sin identificar",value:""},{label:"12 · Marta",value:"12 · Marta"},{label:"7 · Sara",value:"7 · Sara"}]}/>
        </box>
        <box gap={1}>
          <label>Minuto del evento</label>
          <input value={draft.time} onChange={v=>setDraft(d=>({...d,time:v}))} placeholder="MM:SS" size="lg"/>
        </box>
        <box gap={1}>
          <label>Nota</label>
          <textarea rows={2} value={draft.note} placeholder="Añadir comentario..." onChange={v=>setDraft(d=>({...d,note:v}))}/>
        </box>
        {#if draft.raw}
          <box gap={1}>
            <text size="xs" color="secondary">Transcripción original</text>
            <text size="sm" italic>«{draft.raw}»</text>
          </box>
        {/if}
        <row gap={2}>
          <box flex="1">
            <button block color="secondary" variant="outline" onClick={()=>setSheet(false)}>Cancelar</button>
          </box>
          <box flex="1">
            <button block onClick={()=>{setRows(old=>old.map(e=>e.id===selected?{...draft}:e));setSheet(false)}}>Guardar cambios</button>
          </box>
        </row>
      </box>
    {:else}
      <grid columns={2} gap={2}>
        <grid-item>
          <box border radius="xl" padding={3} align="center" gap={1}>
            <icon name="plus-circle" size="xl"/>
            <text size="sm">Evento manual</text>
          </box>
        </grid-item>
        <grid-item>
          <box background="rgba(30,102,204,0.12)" radius="xl" padding={3} align="center" gap={1}>
            <icon name="mic" color="info" size="xl"/>
            <text size="sm" color="info">Mantener para hablar</text>
          </box>
        </grid-item>
      </grid>
    {/if}
  </box>
</box>

<text color="secondary" size="xs">Prototipo de interacción: el panel se muestra dentro del teléfono para ilustrar su contenido; en la implementación real se deslizaría sobre la parte inferior de la lista. El tiempo es simulado.</text>

Me gusta más esta solución que expandir las tarjetas. Además, permitiría una mejora posterior: **abrir el panel inicialmente a media altura, y ampliarlo deslizando hacia arriba** para acceder a campos menos frecuentes.

Así podríamos mantener tipo de evento, equipo y jugador siempre a mano, mientras que nota, transcripción y otras opciones quedarían en la parte ampliada.

## C3.126 user

Ok me gusta. Los segundos no son importantes y el minuto tiene que poder editarse con "roll" (no sé el hnmbre del widget). Lo mismo para el número del jugador (puede haber 2 controles, uno desplegable y otro combo box)

## C3.129 assistant

El control que buscas se llama **wheel picker** o *selector de rueda*, típico de iOS.

Me parece especialmente adecuado para esta aplicación: permite cambiar un valor con el dedo sin utilizar el teclado.

Haría estos cambios:

- **Tiempo:** únicamente minutos, con una rueda vertical.
- **Dorsal:** dos ruedas independientes, una para las decenas y otra para las unidades.
- **Jugador:** además de las ruedas, un selector de la plantilla para encontrarlo directamente por nombre o dorsal. Ambos métodos estarán sincronizados.

Al elegir el dorsal 09, por ejemplo, aparecerá automáticamente «Ana Ruiz».

Te muestro cómo quedaría dentro del editor inferior. En este prototipo las flechas simulan el movimiento de las ruedas; en la aplicación real se deslizarían con el dedo.



## C3.132 assistant

El control que buscas se llama **wheel picker** o *selector de rueda*, típico de iOS.

Me parece especialmente adecuado para esta aplicación: permite cambiar un valor con el dedo sin utilizar el teclado.

Haría estos cambios:

- **Tiempo:** únicamente minutos, con una rueda vertical.
- **Dorsal:** dos ruedas independientes, una para las decenas y otra para las unidades.
- **Jugador:** además de las ruedas, un selector de la plantilla para encontrarlo directamente por nombre o dorsal. Ambos métodos estarán sincronizados.

Al elegir el dorsal 09, por ejemplo, aparecerá automáticamente «Ana Ruiz».

Te muestro cómo quedaría dentro del editor inferior. En este prototipo las flechas simulan el movimiento de las ruedas; en la aplicación real se deslizarían con el dedo.

{@body const roster = [{team:"Nuestro",number:9,name:"Ana Ruiz"},{team:"Nuestro",number:8,name:"Lucía"},{team:"Nuestro",number:1,name:"Paula"},{team:"Nuestro",number:23,name:"Clara"},{team:"Rival",number:12,name:"Marta"},{team:"Rival",number:7,name:"Sara"},{team:"Rival",number:16,name:"Elena"}]}
{@body const eventIcons = {"Gol":"circle-dot","Parada":"shield-check","Exclusión":"timer-off","Tiro fallado":"target","Balón perdido":"arrow-down-left","Balón recuperado":"arrow-up-right","Pasivo":"hourglass","Pasos / dobles":"footprints","Tarjeta amarilla":"square","Tarjeta roja":"square"}}
{@body const seed = [{id:1,type:"Gol",team:"Nuestro",minute:18,number:null,note:"gol nuestro, Ana"},{id:2,type:"Parada",team:"Rival",minute:18,number:12,note:""},{id:3,type:"Exclusión",team:"Nuestro",minute:17,number:8,note:""}]}
{@body const [evs,setEvs] = DIL.useState(seed)}
{@body const [active,setActive] = DIL.useState(1)}
{@body const [sheet,setSheet] = DIL.useState(true)}
{@body const [paused,setPaused] = DIL.useState(false)}
{@body const [draft,setDraft] = DIL.useState({...seed[0]})}
{@body const [tens,setTens] = DIL.useState(0)}
{@body const [ones,setOnes] = DIL.useState(9)}
{@body const [picked,setPicked] = DIL.useState(false)}
{@body const [search,setSearch] = DIL.useState("")}
{@body const [showMatches,setShowMatches] = DIL.useState(false)}
{@body const jersey = tens*10+ones}
{@body const matchingPlayer = roster.find(p=>p.team===draft.team&&p.number===jersey)}
{@body const available = roster.filter(p=>p.team===draft.team)}
{@body const suggestions = available.filter(p=>(p.name+" "+p.number).toLowerCase().includes(search.toLowerCase())).slice(0,4)}
{@body const openEdit = e => {setActive(e.id);setDraft({...e});setPicked(e.number!==null);setTens(Math.floor((e.number??9)/10));setOnes((e.number??9)%10);setSearch("");setShowMatches(false);setSheet(true)}}
{@body const choosePlayer = n => {setTens(Math.floor(n/10));setOnes(n%10);setPicked(true);setSearch("");setShowMatches(false)}}
{@body const adjustDigit = (which,delta) => {if(which==="tens")setTens(v=>(v+delta+10)%10);else setOnes(v=>(v+delta+10)%10);setPicked(true);setSearch("");setShowMatches(false)}}
<box background="surface-secondary" padding={3} radius="2xl" align="center">
  <box width="100%" maxWidth="390px" background="surface" border radius="2xl" padding={3} gap={3}>
    <row align="center" justify="between">
      <box gap="2px">
        <text color="secondary" size="xs">2.º tiempo · {paused?"Pausado":"En juego"}</text>
        <title size="lg" tabularNums>18'</title>
      </box>
      <button color="secondary" variant="outline" size="sm" onClick={()=>setPaused(v=>!v)}>
        <icon name={paused?"play":"pause"} size="sm"/> {paused?"Reanudar":"Parar"}
      </button>
    </row>
    <box background="surface-secondary" radius="lg" padding={3}>
      <row justify="between" align="center">
        **Nuestro**
        <title size="2xl" tabularNums>{17+evs.filter(e=>e.type==="Gol"&&e.team==="Nuestro").length} : {16+evs.filter(e=>e.type==="Gol"&&e.team==="Rival").length}</title>
        **Rival**
      </row>
    </box>
    <row justify="between" align="center">
      <text size="sm" weight="medium">Eventos</text>
      <text color="secondary" size="xs">Toca para editar</text>
    </row>
    <box gap={2}>
      {#each evs as e}
        <row key={e.id} justify={e.team==="Nuestro"?"start":"end"}>
          <pressable onClick={()=>openEdit(e)} width="89%" background={sheet&&active===e.id?"surface-secondary":"surface"} border={{size:sheet&&active===e.id?2:1,color:sheet&&active===e.id?"info":e.number===null?"warning":"default"}} radius="md" padding={2}>
            <row gap={2} align="center">
              {#if e.team==="Nuestro"}
                <icon name={eventIcons[e.type]||"circle"} size="md" color="secondary"/>
              {/if}
              <box flex="1" gap="2px" align={e.team==="Nuestro"?"start":"end"}>
                <text size="sm" weight="medium">{e.type}</text>
                <text size="xs" color="secondary">{e.number===null?"Jugador sin identificar":`${String(e.number).padStart(2,"0")} · ${roster.find(p=>p.team===e.team&&p.number===e.number)?.name||"Sin ficha"}`}</text>
              </box>
              <text size="xs" color="secondary" tabularNums>{e.minute}'</text>
              {#if e.team==="Rival"}
                <icon name={eventIcons[e.type]||"circle"} size="md" color="secondary"/>
              {/if}
            </row>
          </pressable>
        </row>
      {/each}
    </box>
    {#if sheet}
      <box border={{top:{size:2,color:"default"}}} background="surface-secondary" radius="xl" padding={3} gap={3}>
        <box align="center">
          <box width="40px" height="4px" background="border-strong" radius="full"/>
        </box>
        <row justify="between" align="center">
          <title size="lg">Editar evento</title>
          <button color="secondary" variant="ghost" size="sm" onClick={()=>setSheet(false)}><icon name="x"/></button>
        </row>
        <box gap={1}>
          <label>Tipo de evento</label>
          <select block size="md" value={draft.type} onChange={v=>setDraft(d=>({...d,type:v}))} options={[{label:"Gol",value:"Gol"},{label:"Parada",value:"Parada"},{label:"Exclusión",value:"Exclusión"},{label:"Tiro fallado",value:"Tiro fallado"},{label:"Balón perdido",value:"Balón perdido"},{label:"Balón recuperado",value:"Balón recuperado"},{label:"Pasivo",value:"Pasivo"},{label:"Pasos / dobles",value:"Pasos / dobles"},{label:"Tarjeta amarilla",value:"Tarjeta amarilla"},{label:"Tarjeta roja",value:"Tarjeta roja"}]}/>
        </box>
        <box gap={1}>
          <label>Equipo</label>
          <segmented-control block size="md" value={draft.team} onChange={v=>{setDraft(d=>({...d,team:v}));setPicked(false);setSearch("");setShowMatches(false)}} options={[{label:"Nuestro",value:"Nuestro"},{label:"Rival",value:"Rival"}]}/>
        </box>
        <grid columns={2} gap={3}>
          <grid-item>
            <box align="center" gap={2}>
              <text size="sm" weight="medium">Minuto</text>
              <box border radius="lg" padding={2} width="100%" align="center" gap={1}>
                <button size="sm" color="secondary" variant="ghost" uniform onClick={()=>setDraft(d=>({...d,minute:Math.max(0,d.minute-1)}))}><icon name="chevron-up"/></button>
                <text color="tertiary" size="xs" tabularNums>{Math.max(0,draft.minute-1)}'</text>
                <box background="surface-tertiary" width="100%" align="center" padding={2} radius="md">
                  <title size="2xl" tabularNums>{draft.minute}'</title>
                </box>
                <text size="xs" color="tertiary" tabularNums>{Math.min(60,draft.minute+1)}'</text>
                <button size="sm" color="secondary" variant="ghost" uniform onClick={()=>setDraft(d=>({...d,minute:Math.min(60,d.minute+1)}))}><icon name="chevron-down"/></button>
              </box>
            </box>
          </grid-item>
          <grid-item>
            <box align="center" gap={2}>
              <text size="sm" weight="medium">Dorsal</text>
              <row gap={1} width="100%">
                {#each [{digit:"tens",value:tens},{digit:"ones",value:ones}] as d}
                  <box flex="1" border radius="lg" padding={1} align="center" gap={1} key={d.digit}>
                    <button uniform size="sm" color="secondary" variant="ghost" onClick={()=>adjustDigit(d.digit,-1)}><icon name="chevron-up"/></button>
                    <text color="tertiary" size="xs" tabularNums>{(d.value+9)%10}</text>
                    <box background="surface-tertiary" radius="md" width="100%" align="center" padding={2}>
                      <title size="2xl" tabularNums>{d.value}</title>
                    </box>
                    <text color="tertiary" size="xs" tabularNums>{(d.value+1)%10}</text>
                    <button uniform size="sm" color="secondary" variant="ghost" onClick={()=>adjustDigit(d.digit,1)}><icon name="chevron-down"/></button>
                  </box>
                {/each}
              </row>
            </box>
          </grid-item>
        </grid>
        <box gap={2}>
          <row align="center" justify="between">
            <text weight="medium" size="sm">Jugador</text>
            {#if picked}
              {#if matchingPlayer}
                <badge color="success">{matchingPlayer.name}</badge>
              {:else}
                <badge color="warning">Dorsal sin ficha</badge>
              {/if}
            {:else}
              <text color="secondary" size="xs">Sin asignar</text>
            {/if}
          </row>
          {#if !picked}
            <row justify="end">
              <button size="xs" variant="outline" color="secondary" onClick={()=>setPicked(true)}>Usar dorsal {String(jersey).padStart(2,"0")}</button>
            </row>
          {/if}
          <row align="center" gap={2}>
            <box flex="1">
              <input size="md" value={search} onChange={v=>{setSearch(v);setShowMatches(true)}} placeholder="Buscar dorsal o nombre"/>
            </box>
            <button uniform size="md" variant="outline" color="secondary" onClick={()=>setShowMatches(v=>!v)}><icon name="chevron-down"/></button>
          </row>
          {#if showMatches}
            <box border radius="md" gap={1} padding={1}>
              {#each suggestions as p}
                <pressable key={p.number} padding={2} radius="sm" onClick={()=>choosePlayer(p.number)}>
                  <row justify="between" align="center">
                    <text size="sm">{String(p.number).padStart(2,"0")} · {p.name}</text>
                    {#if picked&&jersey===p.number}
                      <icon name="check" color="success" size="sm"/>
                    {/if}
                  </row>
                </pressable>
              {/each}
              {#if suggestions.length===0}
                <text size="xs" color="secondary">Ningún jugador encontrado</text>
              {/if}
            </box>
          {/if}
          {#if picked}
            <button size="xs" color="secondary" variant="ghost" onClick={()=>{setPicked(false);setSearch("");setShowMatches(false)}}>Dejar jugador sin asignar</button>
          {/if}
        </box>
        <row gap={2}>
          <box flex="1">
            <button block color="secondary" variant="outline" onClick={()=>setSheet(false)}>Cancelar</button>
          </box>
          <box flex="1">
            <button block onClick={()=>{setEvs(old=>old.map(e=>e.id===active?{...draft,number:picked?jersey:null}:e));setSheet(false)}}>Guardar</button>
          </box>
        </row>
      </box>
    {:else}
      <grid columns={2} gap={2}>
        <grid-item>
          <box background="surface-secondary" radius="lg" padding={3} align="center" gap={1}>
            <icon name="plus-circle" size="lg"/>
            <text size="xs">Evento manual</text>
          </box>
        </grid-item>
        <grid-item>
          <box background="rgba(30,102,204,0.12)" radius="lg" padding={3} align="center" gap={1}>
            <icon name="mic" size="lg" color="info"/>
            <text color="info" size="xs">Captura de voz</text>
          </box>
        </grid-item>
      </grid>
    {/if}
  </box>
</box>

En la versión definitiva, las ruedas tendrían inercia de desplazamiento y una pequeña vibración al pasar de número. Además, el minuto respetaría los límites temporales de los eventos vecinos.

**Una decisión adicional:** mantendría el dorsal como dato principal para la entrada rápida y el nombre como confirmación visual. Así, durante el partido el usuario puede trabajar exclusivamente con números, sin tener que leer listas de jugadores.

¿Te resulta cómodo tener las ruedas de minuto y dorsal una junto a otra, o preferirías el minuto más pequeño y dedicar más espacio a seleccionar al jugador?

## C3.133 assistant

{@body const roster = [{team:"Nuestro",number:9,name:"Ana Ruiz"},{team:"Nuestro",number:8,name:"Lucía"},{team:"Nuestro",number:1,name:"Paula"},{team:"Nuestro",number:23,name:"Clara"},{team:"Rival",number:12,name:"Marta"},{team:"Rival",number:7,name:"Sara"},{team:"Rival",number:16,name:"Elena"}]}
{@body const eventIcons = {"Gol":"circle-dot","Parada":"shield-check","Exclusión":"timer-off","Tiro fallado":"target","Balón perdido":"arrow-down-left","Balón recuperado":"arrow-up-right","Pasivo":"hourglass","Pasos / dobles":"footprints","Tarjeta amarilla":"square","Tarjeta roja":"square"}}
{@body const seed = [{id:1,type:"Gol",team:"Nuestro",minute:18,number:null,note:"gol nuestro, Ana"},{id:2,type:"Parada",team:"Rival",minute:18,number:12,note:""},{id:3,type:"Exclusión",team:"Nuestro",minute:17,number:8,note:""}]}
{@body const [evs,setEvs] = DIL.useState(seed)}
{@body const [active,setActive] = DIL.useState(1)}
{@body const [sheet,setSheet] = DIL.useState(true)}
{@body const [paused,setPaused] = DIL.useState(false)}
{@body const [draft,setDraft] = DIL.useState({...seed[0]})}
{@body const [tens,setTens] = DIL.useState(0)}
{@body const [ones,setOnes] = DIL.useState(9)}
{@body const [picked,setPicked] = DIL.useState(false)}
{@body const [search,setSearch] = DIL.useState("")}
{@body const [showMatches,setShowMatches] = DIL.useState(false)}
{@body const jersey = tens*10+ones}
{@body const matchingPlayer = roster.find(p=>p.team===draft.team&&p.number===jersey)}
{@body const available = roster.filter(p=>p.team===draft.team)}
{@body const suggestions = available.filter(p=>(p.name+" "+p.number).toLowerCase().includes(search.toLowerCase())).slice(0,4)}
{@body const openEdit = e => {setActive(e.id);setDraft({...e});setPicked(e.number!==null);setTens(Math.floor((e.number??9)/10));setOnes((e.number??9)%10);setSearch("");setShowMatches(false);setSheet(true)}}
{@body const choosePlayer = n => {setTens(Math.floor(n/10));setOnes(n%10);setPicked(true);setSearch("");setShowMatches(false)}}
{@body const adjustDigit = (which,delta) => {if(which==="tens")setTens(v=>(v+delta+10)%10);else setOnes(v=>(v+delta+10)%10);setPicked(true);setSearch("");setShowMatches(false)}}
<box background="surface-secondary" padding={3} radius="2xl" align="center">
  <box width="100%" maxWidth="390px" background="surface" border radius="2xl" padding={3} gap={3}>
    <row align="center" justify="between">
      <box gap="2px">
        <text color="secondary" size="xs">2.º tiempo · {paused?"Pausado":"En juego"}</text>
        <title size="lg" tabularNums>18'</title>
      </box>
      <button color="secondary" variant="outline" size="sm" onClick={()=>setPaused(v=>!v)}>
        <icon name={paused?"play":"pause"} size="sm"/> {paused?"Reanudar":"Parar"}
      </button>
    </row>
    <box background="surface-secondary" radius="lg" padding={3}>
      <row justify="between" align="center">
        **Nuestro**
        <title size="2xl" tabularNums>{17+evs.filter(e=>e.type==="Gol"&&e.team==="Nuestro").length} : {16+evs.filter(e=>e.type==="Gol"&&e.team==="Rival").length}</title>
        **Rival**
      </row>
    </box>
    <row justify="between" align="center">
      <text size="sm" weight="medium">Eventos</text>
      <text color="secondary" size="xs">Toca para editar</text>
    </row>
    <box gap={2}>
      {#each evs as e}
        <row key={e.id} justify={e.team==="Nuestro"?"start":"end"}>
          <pressable onClick={()=>openEdit(e)} width="89%" background={sheet&&active===e.id?"surface-secondary":"surface"} border={{size:sheet&&active===e.id?2:1,color:sheet&&active===e.id?"info":e.number===null?"warning":"default"}} radius="md" padding={2}>
            <row gap={2} align="center">
              {#if e.team==="Nuestro"}
                <icon name={eventIcons[e.type]||"circle"} size="md" color="secondary"/>
              {/if}
              <box flex="1" gap="2px" align={e.team==="Nuestro"?"start":"end"}>
                <text size="sm" weight="medium">{e.type}</text>
                <text size="xs" color="secondary">{e.number===null?"Jugador sin identificar":`${String(e.number).padStart(2,"0")} · ${roster.find(p=>p.team===e.team&&p.number===e.number)?.name||"Sin ficha"}`}</text>
              </box>
              <text size="xs" color="secondary" tabularNums>{e.minute}'</text>
              {#if e.team==="Rival"}
                <icon name={eventIcons[e.type]||"circle"} size="md" color="secondary"/>
              {/if}
            </row>
          </pressable>
        </row>
      {/each}
    </box>
    {#if sheet}
      <box border={{top:{size:2,color:"default"}}} background="surface-secondary" radius="xl" padding={3} gap={3}>
        <box align="center">
          <box width="40px" height="4px" background="border-strong" radius="full"/>
        </box>
        <row justify="between" align="center">
          <title size="lg">Editar evento</title>
          <button color="secondary" variant="ghost" size="sm" onClick={()=>setSheet(false)}><icon name="x"/></button>
        </row>
        <box gap={1}>
          <label>Tipo de evento</label>
          <select block size="md" value={draft.type} onChange={v=>setDraft(d=>({...d,type:v}))} options={[{label:"Gol",value:"Gol"},{label:"Parada",value:"Parada"},{label:"Exclusión",value:"Exclusión"},{label:"Tiro fallado",value:"Tiro fallado"},{label:"Balón perdido",value:"Balón perdido"},{label:"Balón recuperado",value:"Balón recuperado"},{label:"Pasivo",value:"Pasivo"},{label:"Pasos / dobles",value:"Pasos / dobles"},{label:"Tarjeta amarilla",value:"Tarjeta amarilla"},{label:"Tarjeta roja",value:"Tarjeta roja"}]}/>
        </box>
        <box gap={1}>
          <label>Equipo</label>
          <segmented-control block size="md" value={draft.team} onChange={v=>{setDraft(d=>({...d,team:v}));setPicked(false);setSearch("");setShowMatches(false)}} options={[{label:"Nuestro",value:"Nuestro"},{label:"Rival",value:"Rival"}]}/>
        </box>
        <grid columns={2} gap={3}>
          <grid-item>
            <box align="center" gap={2}>
              <text size="sm" weight="medium">Minuto</text>
              <box border radius="lg" padding={2} width="100%" align="center" gap={1}>
                <button size="sm" color="secondary" variant="ghost" uniform onClick={()=>setDraft(d=>({...d,minute:Math.max(0,d.minute-1)}))}><icon name="chevron-up"/></button>
                <text color="tertiary" size="xs" tabularNums>{Math.max(0,draft.minute-1)}'</text>
                <box background="surface-tertiary" width="100%" align="center" padding={2} radius="md">
                  <title size="2xl" tabularNums>{draft.minute}'</title>
                </box>
                <text size="xs" color="tertiary" tabularNums>{Math.min(60,draft.minute+1)}'</text>
                <button size="sm" color="secondary" variant="ghost" uniform onClick={()=>setDraft(d=>({...d,minute:Math.min(60,d.minute+1)}))}><icon name="chevron-down"/></button>
              </box>
            </box>
          </grid-item>
          <grid-item>
            <box align="center" gap={2}>
              <text size="sm" weight="medium">Dorsal</text>
              <row gap={1} width="100%">
                {#each [{digit:"tens",value:tens},{digit:"ones",value:ones}] as d}
                  <box flex="1" border radius="lg" padding={1} align="center" gap={1} key={d.digit}>
                    <button uniform size="sm" color="secondary" variant="ghost" onClick={()=>adjustDigit(d.digit,-1)}><icon name="chevron-up"/></button>
                    <text color="tertiary" size="xs" tabularNums>{(d.value+9)%10}</text>
                    <box background="surface-tertiary" radius="md" width="100%" align="center" padding={2}>
                      <title size="2xl" tabularNums>{d.value}</title>
                    </box>
                    <text color="tertiary" size="xs" tabularNums>{(d.value+1)%10}</text>
                    <button uniform size="sm" color="secondary" variant="ghost" onClick={()=>adjustDigit(d.digit,1)}><icon name="chevron-down"/></button>
                  </box>
                {/each}
              </row>
            </box>
          </grid-item>
        </grid>
        <box gap={2}>
          <row align="center" justify="between">
            <text weight="medium" size="sm">Jugador</text>
            {#if picked}
              {#if matchingPlayer}
                <badge color="success">{matchingPlayer.name}</badge>
              {:else}
                <badge color="warning">Dorsal sin ficha</badge>
              {/if}
            {:else}
              <text color="secondary" size="xs">Sin asignar</text>
            {/if}
          </row>
          {#if !picked}
            <row justify="end">
              <button size="xs" variant="outline" color="secondary" onClick={()=>setPicked(true)}>Usar dorsal {String(jersey).padStart(2,"0")}</button>
            </row>
          {/if}
          <row align="center" gap={2}>
            <box flex="1">
              <input size="md" value={search} onChange={v=>{setSearch(v);setShowMatches(true)}} placeholder="Buscar dorsal o nombre"/>
            </box>
            <button uniform size="md" variant="outline" color="secondary" onClick={()=>setShowMatches(v=>!v)}><icon name="chevron-down"/></button>
          </row>
          {#if showMatches}
            <box border radius="md" gap={1} padding={1}>
              {#each suggestions as p}
                <pressable key={p.number} padding={2} radius="sm" onClick={()=>choosePlayer(p.number)}>
                  <row justify="between" align="center">
                    <text size="sm">{String(p.number).padStart(2,"0")} · {p.name}</text>
                    {#if picked&&jersey===p.number}
                      <icon name="check" color="success" size="sm"/>
                    {/if}
                  </row>
                </pressable>
              {/each}
              {#if suggestions.length===0}
                <text size="xs" color="secondary">Ningún jugador encontrado</text>
              {/if}
            </box>
          {/if}
          {#if picked}
            <button size="xs" color="secondary" variant="ghost" onClick={()=>{setPicked(false);setSearch("");setShowMatches(false)}}>Dejar jugador sin asignar</button>
          {/if}
        </box>
        <row gap={2}>
          <box flex="1">
            <button block color="secondary" variant="outline" onClick={()=>setSheet(false)}>Cancelar</button>
          </box>
          <box flex="1">
            <button block onClick={()=>{setEvs(old=>old.map(e=>e.id===active?{...draft,number:picked?jersey:null}:e));setSheet(false)}}>Guardar</button>
          </box>
        </row>
      </box>
    {:else}
      <grid columns={2} gap={2}>
        <grid-item>
          <box background="surface-secondary" radius="lg" padding={3} align="center" gap={1}>
            <icon name="plus-circle" size="lg"/>
            <text size="xs">Evento manual</text>
          </box>
        </grid-item>
        <grid-item>
          <box background="rgba(30,102,204,0.12)" radius="lg" padding={3} align="center" gap={1}>
            <icon name="mic" size="lg" color="info"/>
            <text color="info" size="xs">Captura de voz</text>
          </box>
        </grid-item>
      </grid>
    {/if}
  </box>
</box>

En la versión definitiva, las ruedas tendrían inercia de desplazamiento y una pequeña vibración al pasar de número. Además, el minuto respetaría los límites temporales de los eventos vecinos.

**Una decisión adicional:** mantendría el dorsal como dato principal para la entrada rápida y el nombre como confirmación visual. Así, durante el partido el usuario puede trabajar exclusivamente con números, sin tener que leer listas de jugadores.

¿Te resulta cómodo tener las ruedas de minuto y dorsal una junto a otra, o preferirías el minuto más pequeño y dedicar más espacio a seleccionar al jugador?

## C3.134 user

El minuto a la derecha del evento, hay espacio. El jugador, mejora el diseño

## C3.138 assistant

Pondría **el minuto junto al tipo de evento**, en la parte superior del editor. Así dejamos la zona central para el jugador, que es la información que más frecuentemente habrá que corregir.

Para el jugador propongo dos mecanismos sincronizados: ruedas para introducir el dorsal y un buscador desplegable por nombre o número. El nombre identificado aparecerá destacado debajo.

{@body const roster = [{team:"Nuestro",num:9,name:"Ana Ruiz"},{team:"Nuestro",num:8,name:"Lucía"},{team:"Nuestro",num:1,name:"Paula"},{team:"Nuestro",num:23,name:"Clara"},{team:"Rival",num:12,name:"Marta"},{team:"Rival",num:7,name:"Sara"},{team:"Rival",num:16,name:"Elena"}]}
{@body const eventTypes = [{label:"Gol",value:"Gol"},{label:"Parada",value:"Parada"},{label:"Exclusión",value:"Exclusión"},{label:"Tiro fallado",value:"Tiro fallado"},{label:"Balón perdido",value:"Balón perdido"},{label:"Balón recuperado",value:"Balón recuperado"},{label:"Pasivo",value:"Pasivo"},{label:"Pasos/dobles",value:"Pasos/dobles"},{label:"Tarjeta amarilla",value:"Tarjeta amarilla"},{label:"Tarjeta roja",value:"Tarjeta roja"},{label:"Tarjeta azul",value:"Tarjeta azul"}]}
{@body const eventIcons={"Gol":"circle-dot","Parada":"shield-check","Exclusión":"timer-off","Tiro fallado":"target","Balón perdido":"arrow-down-left","Balón recuperado":"arrow-up-right","Pasivo":"hourglass","Pasos/dobles":"footprints","Tarjeta amarilla":"square","Tarjeta roja":"square","Tarjeta azul":"square"}}
{@body const seed=[{id:"a",type:"Gol",team:"Nuestro",minute:18,number:null,note:"gol nuestro, Ana"},{id:"b",type:"Parada",team:"Rival",minute:17,number:12,note:""},{id:"c",type:"Exclusión",team:"Nuestro",minute:16,number:8,note:""}]}
{@body const [evs,setEvs]=DIL.useState(seed)}
{@body const [active,setActive]=DIL.useState("a")}
{@body const [sheet,setSheet]=DIL.useState(true)}
{@body const [draft,setDraft]=DIL.useState({...seed[0]})}
{@body const [wheel,setWheel]=DIL.useState(0)}
{@body const [query,setQuery]=DIL.useState("")}
{@body const [optionsOpen,setOptionsOpen]=DIL.useState(false)}
{@body const [paused,setPaused]=DIL.useState(false)}
{@body const [tab,setTab]=DIL.useState("events")}
{@body const player=roster.find(x=>x.team===draft.team&&x.num===draft.number)}
{@body const candidates=roster.filter(x=>x.team===draft.team&&(x.name+" "+x.num).toLowerCase().includes(query.toLowerCase()))}
{@body const selectedIndex=evs.findIndex(e=>e.id===active)}
{@body const lowerMinute=selectedIndex>=0&&selectedIndex<evs.length-1?evs[selectedIndex+1].minute:0}
{@body const upperMinute=selectedIndex>0?evs[selectedIndex-1].minute:30}
{@body const openEditor=e=>{setActive(e.id);setDraft({...e});setWheel(e.number??0);setQuery("");setOptionsOpen(false);setSheet(true)}}
{@body const changeDigit=(place,delta)=>{const prev=place===10?Math.floor(wheel/10):wheel%10;const next=(prev+delta+10)%10;const n=place===10?next*10+wheel%10:Math.floor(wheel/10)*10+next;setWheel(n);setDraft(d=>({...d,number:n}));setQuery("");setOptionsOpen(false)}}
{@body const choosePlayer=(n)=>{setWheel(n);setDraft(d=>({...d,number:n}));setQuery("");setOptionsOpen(false)}}
<box background="surface-secondary" radius="2xl" padding={3} align="center">
  <box background="surface" border radius="2xl" width="100%" maxWidth="400px" padding={3} gap={3}>
    <row justify="between" align="center">
      <box gap="2px">
        <text size="xs" color="secondary">2.º tiempo · {paused?"Pausado":"En juego"}</text>
        <title size="lg" tabularNums>18'</title>
      </box>
      <button size="sm" color="secondary" variant="outline" onClick={()=>setPaused(p=>!p)}>
        <icon name={paused?"play":"pause"}/> {paused?"Reanudar":"Parar tiempo"}
      </button>
    </row>
    <box background="surface-secondary" radius="lg" padding={3}>
      <row justify="between" align="center">
        <text weight="medium" size="sm">Nuestro</text>
        <title size="2xl" tabularNums>{17+evs.filter(e=>e.team==="Nuestro"&&e.type==="Gol").length} : {16+evs.filter(e=>e.team==="Rival"&&e.type==="Gol").length}</title>
        <text weight="medium" size="sm">Rival</text>
      </row>
    </box>
    <segmented-control block size="md" value={tab} onChange={setTab} options={[{label:"Eventos",value:"events"},{label:"Estadísticas",value:"stats"}]}/>
    {#if tab==="events"}
      <box gap={2}>
        {#each evs as e}
          <row justify={e.team==="Nuestro"?"start":"end"} key={e.id}>
            <pressable width="90%" radius="md" padding={2} background={sheet&&active===e.id?"surface-secondary":"surface"} border={{size:sheet&&active===e.id?2:1,color:sheet&&active===e.id?"info":e.number===null?"warning":"default"}} onClick={()=>openEditor(e)}>
              <row align="center" gap={2}>
                {#if e.team==="Nuestro"}
                  <icon name={eventIcons[e.type]||"circle"} size="md" color="secondary"/>
                {/if}
                <box flex="1" align={e.team==="Nuestro"?"start":"end"} gap="2px">
                  <text weight="medium" size="sm">{e.type}</text>
                  <text size="xs" color="secondary">{e.number===null?"Jugador pendiente":(roster.find(p=>p.team===e.team&&p.num===e.number)?.name||"Dorsal sin ficha")}</text>
                </box>
                <text size="xs" color="secondary" tabularNums>{e.minute}'</text>
                {#if e.team==="Rival"}
                  <icon name={eventIcons[e.type]||"circle"} size="md" color="secondary"/>
                {/if}
              </row>
            </pressable>
          </row>
        {/each}
      </box>
    {:else}
      <box minHeight="100px" gap={2}>
        **Resumen**
        <text size="sm">Goles propios: {17+evs.filter(e=>e.team==="Nuestro"&&e.type==="Gol").length}</text>
        <text size="sm">Goles rivales: {16+evs.filter(e=>e.team==="Rival"&&e.type==="Gol").length}</text>
      </box>
    {/if}
    {#if sheet}
      <box background="surface-secondary" radius="xl" border={{top:{size:2,color:"default"}}} padding={3} gap={3}>
        <box align="center">
          <box background="border-strong" radius="full" width="40px" height="4px"/>
        </box>
        <row justify="between" align="center">
          <title size="lg">Editar evento</title>
          <button variant="ghost" color="secondary" size="sm" onClick={()=>setSheet(false)}><icon name="x"/></button>
        </row>
        <grid columns={3} gap={2}>
          <grid-item span={2}>
            <box gap={2}>
              <label>Evento</label>
              <select block size="lg" value={draft.type} onChange={v=>setDraft(d=>({...d,type:v}))} options={eventTypes}/>
            </box>
          </grid-item>
          <grid-item>
            <box gap={1} align="center">
              <label>Minuto</label>
              <row align="center" gap="2px">
                <button size="xs" color="secondary" variant="ghost" uniform disabled={draft.minute<=lowerMinute} onClick={()=>setDraft(d=>({...d,minute:Math.max(lowerMinute,d.minute-1)}))}><icon name="minus" size="sm"/></button>
                <box align="center" minWidth="37px">
                  <title size="xl" tabularNums>{draft.minute}'</title>
                </box>
                <button size="xs" color="secondary" variant="ghost" uniform disabled={draft.minute>=upperMinute} onClick={()=>setDraft(d=>({...d,minute:Math.min(upperMinute,d.minute+1)}))}><icon name="plus" size="sm"/></button>
              </row>
            </box>
          </grid-item>
        </grid>
        <box gap={1}>
          <label>Equipo</label>
          <segmented-control block size="md" value={draft.team} onChange={v=>{setDraft(d=>({...d,team:v,number:null}));setWheel(0);setQuery("");setOptionsOpen(false)}} options={[{label:"Nuestro",value:"Nuestro"},{label:"Rival",value:"Rival"}]}/>
        </box>
        <box border radius="lg" padding={3} background="surface" gap={3}>
          <row justify="between" align="center">
            **Jugador**
            {#if player}
              <badge color="success">Identificado</badge>
            {:else}
              <badge color="warning">Pendiente</badge>
            {/if}
          </row>
          <grid columns={2} gap={3}>
            <grid-item>
              <box gap={2} align="center">
                <text size="xs" color="secondary">DORSAL</text>
                <row gap={2} justify="center">
                  {#each [10,1] as place}
                    <box key={place} align="center" gap={1} flex="1">
                      <button size="sm" color="secondary" variant="ghost" uniform onClick={()=>changeDigit(place,-1)}><icon name="chevron-up"/></button>
                      <text size="xs" color="tertiary" tabularNums>{((place===10?Math.floor(wheel/10):wheel%10)+9)%10}</text>
                      <box width="100%" background="surface-tertiary" radius="md" padding={{x:1,y:3}} align="center">
                        <title size="2xl" tabularNums>{place===10?Math.floor(wheel/10):wheel%10}</title>
                      </box>
                      <text size="xs" color="tertiary" tabularNums>{((place===10?Math.floor(wheel/10):wheel%10)+1)%10}</text>
                      <button size="sm" color="secondary" variant="ghost" uniform onClick={()=>changeDigit(place,1)}><icon name="chevron-down"/></button>
                    </box>
                  {/each}
                </row>
              </box>
            </grid-item>
            <grid-item>
              <box gap={2}>
                <text color="secondary" size="xs">BUSCAR EN PLANTILLA</text>
                <row gap={1} align="center">
                  <box flex="1">
                    <input size="md" value={query} onChange={v=>{setQuery(v);setOptionsOpen(true)}} placeholder="Nombre o nº"/>
                  </box>
                  <button uniform size="md" color="secondary" variant="outline" onClick={()=>setOptionsOpen(v=>!v)}><icon name="chevron-down" size="sm"/></button>
                </row>
                {#if optionsOpen}
                  <box border radius="md" padding={1} gap={1} maxHeight="150px" scrollable>
                    {#each candidates as p}
                      <pressable key={p.num} padding={2} radius="sm" background={p.num===draft.number?"surface-tertiary":undefined} onClick={()=>choosePlayer(p.num)}>
                        <row justify="between" align="center" gap={1}>
                          <text size="xs">{String(p.num).padStart(2,"0")} · {p.name}</text>
                          {#if p.num===draft.number}
                            <icon name="check" size="xs" color="success"/>
                          {/if}
                        </row>
                      </pressable>
                    {/each}
                    {#if candidates.length===0}
                      <text size="xs" color="secondary">Sin coincidencias</text>
                    {/if}
                  </box>
                {:else}
                  <text size="xs" color="secondary">Escribe o despliega los jugadores</text>
                {/if}
              </box>
            </grid-item>
          </grid>
          <divider color="subtle"/>
          <row justify="between" align="center">
            <box gap={1} flex="1">
              {#if player}
                <text weight="medium" size="sm"><icon name="check-circle" color="success" inline size="sm"/> {String(player.num).padStart(2,"0")} · {player.name}</text>
              {:else if draft.number!==null}
                <text weight="medium" size="sm">Dorsal {String(draft.number).padStart(2,"0")} sin jugador registrado</text>
              {:else}
                <text size="sm" color="secondary">Jugador sin asignar</text>
              {/if}
            </box>
            <button size="xs" color="secondary" variant="outline" onClick={()=>{setDraft(d=>({...d,number:null}));setQuery("");setOptionsOpen(false)}}>Sin asignar</button>
          </row>
        </box>
        <row gap={2}>
          <box flex="1">
            <button block color="secondary" variant="outline" onClick={()=>setSheet(false)}>Cancelar</button>
          </box>
          <box flex="1">
            <button block onClick={()=>{setEvs(prev=>prev.map(e=>e.id===active?{...draft}:e));setSheet(false)}}>Guardar</button>
          </box>
        </row>
      </box>
    {:else}
      <grid columns={2} gap={2}>
        <grid-item>
          <box background="surface-secondary" radius="lg" padding={3} align="center">
            <icon name="plus-circle" size="lg"/>
            <text size="xs">Evento manual</text>
          </box>
        </grid-item>
        <grid-item>
          <box background="rgba(30,102,204,0.12)" radius="lg" padding={3} align="center">
            <icon name="mic" color="info" size="lg"/>
            <text size="xs" color="info">Captura de voz</text>
          </box>
        </grid-item>
      </grid>
    {/if}
  </box>
</box>

<text color="secondary" size="xs">Prototipo: las flechas sustituyen provisionalmente al desplazamiento táctil de las ruedas. El minuto está limitado por los eventos adyacentes.</text>

Creo que esta distribución funciona mejor: el minuto ocupa poco espacio y toda la atención se concentra en identificar al jugador.

**Hay una cuestión que decidiría ahora:** si se introduce un dorsal que no existe en la plantilla, ¿lo conservamos como dorsal válido sin nombre, o lo dejamos pendiente de identificación? Yo conservaría el número, pero marcaría el evento como incompleto hasta asociarlo a un jugador.

## C3.139 user

Dorsal válido. Hace falta marcar nuevo tiempo(con confirmación para evitar mis clicks) puede haber más de dos, algunas categorías lo hacen así. 

Ya no son eventos la gestión del reloj. Mejor se gestiona arriba

## C3.142 user

En gol hace falta un netdato que sea penalti

## C3.145 user

Y en para da también

## C3.148 assistant

De acuerdo. Incorporamos tres decisiones al diseño:

- **El dorsal es válido aunque no exista en la plantilla.** El nombre es información adicional, no un requisito.
- **El reloj y los tiempos dejan de ser eventos.** Se gestionan arriba, con un botón «Nuevo tiempo» que exige confirmación. No hay límite de dos tiempos.
- **Gol y Parada tienen un atributo «Penalti (7 m)».** Una parada de penalti sigue contando como parada y un gol de penalti como gol. El atributo permite desglosar las estadísticas.

He actualizado el prototipo para que puedas probarlo.

{@body const players=[{team:"Nuestro",n:9,name:"Ana Ruiz"},{team:"Nuestro",n:8,name:"Lucía"},{team:"Nuestro",n:1,name:"Paula"},{team:"Nuestro",n:23,name:"Clara"},{team:"Rival",n:12,name:"Marta"},{team:"Rival",n:7,name:"Sara"},{team:"Rival",n:16,name:"Elena"}]}
{@body const typeOptions=[{label:"Gol",value:"Gol"},{label:"Parada",value:"Parada"},{label:"Exclusión",value:"Exclusión"},{label:"Tiro fallado",value:"Tiro fallado"},{label:"Balón perdido",value:"Balón perdido"},{label:"Balón recuperado",value:"Balón recuperado"},{label:"Pasivo",value:"Pasivo"},{label:"Pasos / dobles",value:"Pasos / dobles"},{label:"Tarjeta amarilla",value:"Tarjeta amarilla"},{label:"Tarjeta roja",value:"Tarjeta roja"},{label:"Tarjeta azul",value:"Tarjeta azul"}]}
{@body const icons={"Gol":"circle-dot","Parada":"shield-check","Exclusión":"timer-off","Tiro fallado":"target","Balón perdido":"arrow-down-left","Balón recuperado":"arrow-up-right","Pasivo":"hourglass","Pasos / dobles":"footprints","Tarjeta amarilla":"square","Tarjeta roja":"square","Tarjeta azul":"square"}}
{@body const seed=[{id:"a",type:"Gol",team:"Nuestro",period:2,minute:18,number:null,penalty:true,note:"gol nuestro, Ana"},{id:"b",type:"Parada",team:"Rival",period:2,minute:17,number:12,penalty:true,note:""},{id:"c",type:"Exclusión",team:"Nuestro",period:2,minute:16,number:8,penalty:false,note:""},{id:"d",type:"Gol",team:"Nuestro",period:2,minute:15,number:42,penalty:false,note:""}]}
{@body const [evs,setEvs]=DIL.useState(seed)}
{@body const [period,setPeriod]=DIL.useState(2)}
{@body const [minute,setMinute]=DIL.useState(18)}
{@body const [paused,setPaused]=DIL.useState(false)}
{@body const [confirmPeriod,setConfirmPeriod]=DIL.useState(false)}
{@body const [tab,setTab]=DIL.useState("events")}
{@body const [sheet,setSheet]=DIL.useState(true)}
{@body const [active,setActive]=DIL.useState("a")}
{@body const [draft,setDraft]=DIL.useState({...seed[0]})}
{@body const [query,setQuery]=DIL.useState("")}
{@body const [searchOpen,setSearchOpen]=DIL.useState(false)}
{@body const ownGoals=evs.filter(e=>e.type==="Gol"&&e.team==="Nuestro").length}
{@body const rivalGoals=evs.filter(e=>e.type==="Gol"&&e.team==="Rival").length}
{@body const penaltyGoals=evs.filter(e=>e.type==="Gol"&&e.penalty).length}
{@body const penaltySaves=evs.filter(e=>e.type==="Parada"&&e.penalty).length}
{@body const wheelNum=draft.number??0}
{@body const who=players.find(p=>p.team===draft.team&&p.n===draft.number)}
{@body const candidates=players.filter(p=>p.team===draft.team&&(p.name+" "+p.n).toLowerCase().includes(query.toLowerCase()))}
{@body const selectedIndex=evs.findIndex(e=>e.id===active)}
{@body const older=selectedIndex>=0?evs[selectedIndex+1]:null}
{@body const newer=selectedIndex>0?evs[selectedIndex-1]:null}
{@body const minAllowed=older&&older.period===draft.period?older.minute:0}
{@body const maxAllowed=newer&&newer.period===draft.period?newer.minute:draft.period===period?Math.max(minute,draft.minute):60}
{@body const openEditor=e=>{setDraft({...e});setActive(e.id);setQuery("");setSearchOpen(false);setSheet(true)}}
{@body const changeDigit=(place,delta)=>{const prev=place===10?Math.floor(wheelNum/10):wheelNum%10;const next=(prev+delta+10)%10;const n=place===10?next*10+wheelNum%10:Math.floor(wheelNum/10)*10+next;setDraft(d=>({...d,number:n}));setQuery("");setSearchOpen(false)}}
{@body const saveEvent=()=>{if(active==="new"){setEvs(old=>[draft,...old])}else{setEvs(old=>old.map(e=>e.id===active?{...draft}:e))}setSheet(false)}}
{@body const addManual=()=>{setActive("new");setDraft({id:"new"+(evs.length+1),type:"Gol",team:"Nuestro",period,minute,number:null,penalty:false,note:""});setQuery("");setSearchOpen(false);setSheet(true);setTab("events")}}
{@body const voiceDemo=()=>{setEvs(old=>[{id:"voice"+(old.length+1),type:"Gol",team:"Nuestro",period,minute,number:null,penalty:false,note:"gol nuestro, Ana"},...old]);setSheet(false);setTab("events")}}
<box background="surface-secondary" radius="2xl" padding={3} align="center">
  <box background="surface" border radius="2xl" padding={3} width="100%" maxWidth="400px" gap={3}>
    <row align="center" justify="between">
      <box gap={1}>
        <text color="secondary" size="xs">Tiempo {period} · {paused?"Pausado":"En juego"}</text>
        <title size="xl" tabularNums>{minute}'</title>
      </box>
      <row gap={1}>
        <button size="sm" color="secondary" variant="outline" onClick={()=>setPaused(v=>!v)}><icon name={paused?"play":"pause"} size="sm"/> {paused?"Reanudar":"Parar"}</button>
        <button size="sm" color="secondary" variant="outline" onClick={()=>setConfirmPeriod(true)}><icon name="plus" size="sm"/> Nuevo tiempo</button>
      </row>
    </row>
    {#if confirmPeriod}
      <box border radius="lg" padding={3} gap={2} background="surface-secondary">
        <row align="center" gap={2}>
          <icon name="alert-circle" color="caution"/>
          **Iniciar tiempo {period+1}**
        </row>
        <text size="sm">¿Finalizar el tiempo {period} e iniciar el siguiente desde el minuto 0? Los eventos anteriores se conservan.</text>
        <row gap={2} justify="end">
          <button size="sm" color="secondary" variant="outline" onClick={()=>setConfirmPeriod(false)}>Cancelar</button>
          <button size="sm" onClick={()=>{setPeriod(p=>p+1);setMinute(0);setPaused(false);setConfirmPeriod(false);setSheet(false)}}>Confirmar</button>
        </row>
      </box>
    {/if}
    <box background="surface-secondary" radius="lg" padding={3}>
      <row align="center" justify="between">
        <text weight="medium" size="sm">Nuestro</text>
        <title size="2xl" tabularNums>{16+ownGoals} : {16+rivalGoals}</title>
        <text weight="medium" size="sm">Rival</text>
      </row>
    </box>
    <segmented-control block size="md" value={tab} onChange={setTab} options={[{label:"Eventos",value:"events"},{label:"Estadísticas",value:"stats"}]}/>
    {#if tab==="events"}
      <box gap={2} maxHeight={sheet?"195px":"320px"} scrollable>
        {#each evs as e}
          <row key={e.id} justify={e.team==="Nuestro"?"start":"end"}>
            <pressable width="91%" border={{size:sheet&&active===e.id?2:1,color:sheet&&active===e.id?"info":e.number===null?"warning":"default"}} radius="md" padding={2} background={sheet&&active===e.id?"surface-secondary":"surface"} onClick={()=>openEditor(e)}>
              <row gap={2} align="center">
                {#if e.team==="Nuestro"}
                  <icon name={icons[e.type]||"circle"} size="md" color="secondary"/>
                {/if}
                <box flex="1" align={e.team==="Nuestro"?"start":"end"} gap="2px">
                  <row gap={1} align="center" justify={e.team==="Nuestro"?"start":"end"}>
                    <text weight="medium" size="sm">{e.type}</text>
                    {#if e.penalty&&(e.type==="Gol"||e.type==="Parada")}
                      <badge color="secondary">7 m</badge>
                    {/if}
                  </row>
                  <text size="xs" color="secondary">{e.number===null?"Jugador pendiente":`${String(e.number).padStart(2,"0")} · ${players.find(p=>p.team===e.team&&p.n===e.number)?.name||"Dorsal válido"}`}</text>
                </box>
                <text color="secondary" size="xs" tabularNums>{e.minute}'</text>
                {#if e.team==="Rival"}
                  <icon name={icons[e.type]||"circle"} size="md" color="secondary"/>
                {/if}
              </row>
            </pressable>
          </row>
        {/each}
      </box>
    {:else}
      <box gap={2} minHeight="150px">
        <text weight="medium" size="sm">Resumen de eventos de ejemplo</text>
        <table>
          <table-row><table-cell>Goles de penalti</table-cell><table-cell align="end">{penaltyGoals}</table-cell></table-row>
          <table-row><table-cell>Paradas de penalti</table-cell><table-cell align="end">{penaltySaves}</table-cell></table-row>
          <table-row><table-cell>Jugadores sin dorsal</table-cell><table-cell align="end">{evs.filter(e=>e.number===null).length}</table-cell></table-row>
        </table>
      </box>
    {/if}
    {#if sheet}
      <box background="surface-secondary" border={{top:{size:2,color:"default"}}} radius="xl" padding={3} gap={3}>
        <box align="center">
          <box width="40px" height="4px" background="border-strong" radius="full"/>
        </box>
        <row justify="between" align="center">
          <title size="lg">{active==="new"?"Nuevo evento":"Editar evento"}</title>
          <button size="sm" color="secondary" variant="ghost" onClick={()=>setSheet(false)}><icon name="x"/></button>
        </row>
        <grid columns={3} gap={2}>
          <grid-item span={2}>
            <box gap={1}>
              <label>Evento</label>
              <select block size="md" value={draft.type} onChange={v=>setDraft(d=>({...d,type:v,penalty:(v==="Gol"||v==="Parada")?d.penalty:false}))} options={typeOptions}/>
            </box>
          </grid-item>
          <grid-item>
            <box gap={1} align="center">
              <label>Minuto</label>
              <row align="center" gap="2px">
                <button size="xs" uniform variant="ghost" color="secondary" disabled={draft.minute<=minAllowed} onClick={()=>setDraft(d=>({...d,minute:Math.max(minAllowed,d.minute-1)}))}><icon name="minus" size="sm"/></button>
                <text weight="semibold" size="lg" tabularNums>{draft.minute}'</text>
                <button size="xs" uniform variant="ghost" color="secondary" disabled={draft.minute>=maxAllowed} onClick={()=>setDraft(d=>({...d,minute:Math.min(maxAllowed,d.minute+1)}))}><icon name="plus" size="sm"/></button>
              </row>
            </box>
          </grid-item>
        </grid>
        {#if draft.type==="Gol"||draft.type==="Parada"}
          <box border radius="md" padding={2}>
            <row justify="between" align="center">
              <row align="center" gap={2}>
                <icon name="target" size="md" color="secondary"/>
                <text weight="medium" size="sm">Penalti (7 m)</text>
              </row>
              <checkbox checked={!!draft.penalty} onChange={v=>setDraft(d=>({...d,penalty:v}))} lineThrough={false}>Sí</checkbox>
            </row>
          </box>
        {/if}
        <segmented-control block size="md" value={draft.team} onChange={v=>{setDraft(d=>({...d,team:v,number:null}));setQuery("");setSearchOpen(false)}} options={[{label:"Nuestro",value:"Nuestro"},{label:"Rival",value:"Rival"}]}/>
        <box border radius="lg" padding={3} background="surface" gap={3}>
          <row justify="between" align="center">
            **Jugador**
            {#if draft.number===null}
              <text color="secondary" size="xs">Sin dorsal</text>
            {:else}
              <badge color="success">Dorsal válido</badge>
            {/if}
          </row>
          <grid columns={2} gap={3}>
            <grid-item>
              <box gap={1} align="center">
                <text color="secondary" size="xs">DORSAL</text>
                <row gap={2}>
                  {#each [10,1] as place}
                    <box key={place} gap={1} align="center" flex="1">
                      <button uniform size="sm" variant="ghost" color="secondary" onClick={()=>changeDigit(place,-1)}><icon name="chevron-up"/></button>
                      <text size="xs" color="tertiary" tabularNums>{((place===10?Math.floor(wheelNum/10):wheelNum%10)+9)%10}</text>
                      <box background="surface-tertiary" radius="md" padding={2} align="center" width="100%">
                        <title size="2xl" tabularNums>{place===10?Math.floor(wheelNum/10):wheelNum%10}</title>
                      </box>
                      <text size="xs" color="tertiary" tabularNums>{((place===10?Math.floor(wheelNum/10):wheelNum%10)+1)%10}</text>
                      <button uniform size="sm" variant="ghost" color="secondary" onClick={()=>changeDigit(place,1)}><icon name="chevron-down"/></button>
                    </box>
                  {/each}
                </row>
              </box>
            </grid-item>
            <grid-item>
              <box gap={2}>
                <text color="secondary" size="xs">BUSCAR JUGADOR</text>
                <row align="center" gap={1}>
                  <box flex="1">
                    <input size="md" value={query} onChange={v=>{setQuery(v);setSearchOpen(true)}} placeholder="Nombre o nº"/>
                  </box>
                  <button uniform size="md" variant="outline" color="secondary" onClick={()=>setSearchOpen(v=>!v)}><icon name="chevron-down" size="sm"/></button>
                </row>
                {#if searchOpen}
                  <box border radius="md" padding={1} gap={1} maxHeight="130px" scrollable>
                    {#each candidates as p}
                      <pressable key={p.n} padding={2} onClick={()=>{setDraft(d=>({...d,number:p.n}));setQuery("");setSearchOpen(false)}}>
                        <text size="xs">{String(p.n).padStart(2,"0")} · {p.name}</text>
                      </pressable>
                    {/each}
                  </box>
                {:else}
                  <text color="secondary" size="xs">Opcional: buscar en plantilla</text>
                {/if}
              </box>
            </grid-item>
          </grid>
          <divider color="subtle"/>
          <row justify="between" align="center">
            <box flex="1">
              {#if who}
                <text weight="medium" size="sm"><icon name="check-circle" color="success" inline size="sm"/> {String(who.n).padStart(2,"0")} · {who.name}</text>
              {:else if draft.number!==null}
                <text weight="medium" size="sm">Dorsal {String(draft.number).padStart(2,"0")}</text>
                <text color="secondary" size="xs">Sin nombre en plantilla</text>
              {:else}
                <text size="sm" color="secondary">Jugador pendiente</text>
              {/if}
            </box>
            <button color="secondary" variant="ghost" size="xs" onClick={()=>setDraft(d=>({...d,number:null}))}>Sin dorsal</button>
          </row>
        </box>
        <row gap={2}>
          <box flex="1">
            <button block variant="outline" color="secondary" onClick={()=>setSheet(false)}>Cancelar</button>
          </box>
          <box flex="1">
            <button block onClick={saveEvent}>Guardar</button>
          </box>
        </row>
      </box>
    {:else}
      <grid columns={2} gap={2}>
        <grid-item>
          <pressable background="surface-secondary" radius="lg" padding={3} align="center" gap={1} onClick={addManual}>
            <icon name="plus-circle" size="lg"/>
            <text size="xs">Evento manual</text>
          </pressable>
        </grid-item>
        <grid-item>
          <pressable background="rgba(30,102,204,0.12)" radius="lg" padding={3} align="center" gap={1} onClick={voiceDemo}>
            <icon name="mic" size="lg" color="info"/>
            <text size="xs" color="info">Simular voz</text>
          </pressable>
        </grid-item>
      </grid>
    {/if}
    <caption textAlign="center">Prototipo interactivo: el reloj está simulado y las ruedas usan botones provisionales.</caption>
  </box>
</box>

Prueba especialmente «Nuevo tiempo» y editar el primer gol y la parada: ambos permiten activar o desactivar «Penalti».

Una cuestión de diseño que dejaría anotada: **el minuto del evento debe ser relativo a su tiempo de juego**, por ejemplo, tiempo 3, minuto 8. Esto es distinto del minuto absoluto de partido y resulta imprescindible cuando hay tres o más tiempos.

En cuanto al modelo de datos, utilizaría un campo `period` y otro `minute` en cada evento, mientras que la gestión del reloj tendría su propia estructura independiente.

## C3.149 user

Evento lo haría wheel y jugador es demasiado grande. Hay que tener en cuenta que algunos son transitivos.una exclusión es de un jugador a otro. La pantalla la haría con toda la información para todos los eventos y sombreado los que no apliquen.. over otra alternativa? 

## C3.154 assistant

Creo que tu propuesta es mejor: **un editor con estructura fija para todos los eventos**, donde los campos no aplicables aparezcan desactivados. Se aprende una sola interfaz y los controles no cambian de posición.

También eliminaría las dos ruedas grandes del jugador. En su lugar, usaría una fila compacta con equipo, dorsal y selector de plantilla.

Hay otra decisión importante: separar **jugador principal** y **jugador relacionado**. Por ejemplo, en una exclusión, el primero sería el sancionado y el segundo el jugador que recibió la infracción.

## Alternativa: editor compacto y uniforme

Prueba a cambiar el tipo de evento en la rueda. Verás cómo cambian las etiquetas de los intervinientes y qué campos están disponibles, pero no su posición.

{@body const defs=[{type:"Gol",icon:"circle-dot",a:"Goleador",b:"No aplicable",related:false,penalty:true},{type:"Parada",icon:"shield-check",a:"Portero",b:"Lanzador",related:true,penalty:true},{type:"Exclusión",icon:"timer-off",a:"Sancionado",b:"Jugador afectado",related:true,penalty:false},{type:"Tiro fallado",icon:"target",a:"Lanzador",b:"No aplicable",related:false,penalty:false},{type:"Balón perdido",icon:"arrow-down-left",a:"Responsable",b:"Destinatario del pase",related:true,penalty:false},{type:"Balón recuperado",icon:"arrow-up-right",a:"Recuperador",b:"Jugador rival",related:true,penalty:false},{type:"Pasivo",icon:"hourglass",a:"Jugador",b:"No aplicable",related:false,penalty:false},{type:"Pasos/dobles",icon:"footprints",a:"Infractor",b:"No aplicable",related:false,penalty:false},{type:"Tarjeta amarilla",icon:"square",a:"Sancionado",b:"No aplicable",related:false,penalty:false},{type:"Tarjeta roja",icon:"square",a:"Sancionado",b:"No aplicable",related:false,penalty:false},{type:"Tarjeta azul",icon:"square",a:"Sancionado",b:"No aplicable",related:false,penalty:false}]}
{@body const roster=[{team:"Nuestro",n:8,name:"Lucía"},{team:"Nuestro",n:9,name:"Ana"},{team:"Nuestro",n:23,name:"Clara"},{team:"Rival",n:7,name:"Sara"},{team:"Rival",n:12,name:"Marta"},{team:"Rival",n:16,name:"Elena"}]}
{@body const [idx,setIdx]=DIL.useState(2)}
{@body const [minute,setMinute]=DIL.useState(18)}
{@body const [teamA,setTeamA]=DIL.useState("Nuestro")}
{@body const [teamB,setTeamB]=DIL.useState("Rival")}
{@body const [numA,setNumA]=DIL.useState("08")}
{@body const [numB,setNumB]=DIL.useState("07")}
{@body const [penalty,setPenalty]=DIL.useState(false)}
{@body const [note,setNote]=DIL.useState("")}
{@body const [saved,setSaved]=DIL.useState(false)}
{@body const [period,setPeriod]=DIL.useState(2)}
{@body const [paused,setPaused]=DIL.useState(false)}
{@body const [newPeriod,setNewPeriod]=DIL.useState(false)}
{@body const cfg=defs[idx]}
{@body const nameA=roster.find(p=>p.team===teamA&&p.n===Number(numA))}
{@body const nameB=roster.find(p=>p.team===teamB&&p.n===Number(numB))}
{@body const optionsFor=t=>[{label:"Elegir plantilla",value:""},...roster.filter(p=>p.team===t).map(p=>({label:`${p.n} · ${p.name}`,value:String(p.n)}))]}
{@body const teamOpts=[{label:"Nuestro",value:"Nuestro"},{label:"Rival",value:"Rival"}]}
{@body const changeType=d=>{setIdx(i=>(i+d+defs.length)%defs.length);setPenalty(false);setSaved(false)}}
<box background="surface-secondary" radius="2xl" padding={3} align="center">
  <box background="surface" border radius="2xl" padding={3} width="100%" maxWidth="410px" gap={3}>
    <row justify="between" align="center">
      <box gap="2px">
        <text color="secondary" size="xs">Tiempo {period} · {paused?"Pausado":"En juego"}</text>
        <title size="lg">{minute}'</title>
      </box>
      <row gap={1}>
        <button size="sm" color="secondary" variant="outline" onClick={()=>setPaused(p=>!p)}><icon name={paused?"play":"pause"} size="sm"/> {paused?"Reanudar":"Parar"}</button>
        <button size="sm" color="secondary" variant="outline" onClick={()=>setNewPeriod(true)}>Nuevo tiempo</button>
      </row>
    </row>
    {#if newPeriod}
      <box background="surface-secondary" border radius="md" padding={2} gap={2}>
        <text size="sm" weight="medium">¿Iniciar el tiempo {period+1}?</text>
        <row justify="end" gap={2}>
          <button size="xs" color="secondary" variant="outline" onClick={()=>setNewPeriod(false)}>Cancelar</button>
          <button size="xs" onClick={()=>{setPeriod(p=>p+1);setMinute(0);setNewPeriod(false)}}>Confirmar</button>
        </row>
      </box>
    {/if}
    <box background="surface-secondary" radius="lg" padding={3}>
      <row justify="between" align="center">
        <text weight="medium" size="sm">Nuestro</text>
        <title size="2xl" tabularNums>18 : 16</title>
        <text weight="medium" size="sm">Rival</text>
      </row>
    </box>
    <row justify="between" align="center">
      <text color="secondary" size="xs">EVENTO SELECCIONADO</text>
      <badge>Editor compacto</badge>
    </row>
    <box background="surface-secondary" radius="xl" padding={3} gap={3}>
      <row justify="between" align="center">
        <title size="lg">Editar evento</title>
        <icon name="x" color="secondary"/>
      </row>
      <grid columns={3} gap={2}>
        <grid-item span={2}>
          <box gap={1}>
            <label>Evento</label>
            <box border radius="lg" background="surface" padding={1}>
              <row align="center" gap={1}>
                <box flex="1" align="center" gap="3px" padding={1}>
                  <text size="xs" color="tertiary">{defs[(idx-1+defs.length)%defs.length].type}</text>
                  <box background="surface-tertiary" radius="sm" width="100%" padding={2}>
                    <row align="center" justify="center" gap={2}>
                      <icon name={cfg.icon} color="default" size="md"/>
                      <text weight="semibold" size="sm">{cfg.type}</text>
                    </row>
                  </box>
                  <text size="xs" color="tertiary">{defs[(idx+1)%defs.length].type}</text>
                </box>
                <box gap={1}>
                  <button size="xs" uniform color="secondary" variant="ghost" onClick={()=>changeType(-1)}><icon name="chevron-up"/></button>
                  <button size="xs" uniform color="secondary" variant="ghost" onClick={()=>changeType(1)}><icon name="chevron-down"/></button>
                </box>
              </row>
            </box>
          </box>
        </grid-item>
        <grid-item>
          <box gap={1}>
            <label>Minuto</label>
            <box border radius="lg" background="surface" padding={1} align="center" gap={1}>
              <button size="xs" uniform variant="ghost" color="secondary" onClick={()=>{setMinute(m=>Math.min(60,m+1));setSaved(false)}}><icon name="chevron-up" size="sm"/></button>
              <box background="surface-tertiary" radius="sm" width="100%" padding={2} align="center">
                <title size="lg" tabularNums>{minute}'</title>
              </box>
              <button size="xs" uniform variant="ghost" color="secondary" onClick={()=>{setMinute(m=>Math.max(0,m-1));setSaved(false)}}><icon name="chevron-down" size="sm"/></button>
            </box>
          </box>
        </grid-item>
      </grid>
      <box gap={2}>
        <row justify="between" align="center">
          **Intervinientes**
          <text size="2xs" color="secondary">Equipo · Dorsal · Plantilla</text>
        </row>
        <box background="surface" border radius="md" padding={2} gap={2}>
          <row justify="between" align="center">
            <text size="sm" weight="medium">Principal · {cfg.a}</text>
            <text size="xs" color="secondary">{numA?nameA?.name||"Dorsal sin ficha":"Sin dorsal"}</text>
          </row>
          <row align="center" gap={1}>
            <box width="34%">
              <select size="sm" block value={teamA} options={teamOpts} onChange={v=>{setTeamA(v);setSaved(false)}}/>
            </box>
            <box width="18%">
              <input size="sm" inputType="number" value={numA} onChange={v=>{setNumA(v.slice(0,2));setSaved(false)}} placeholder="Nº"/>
            </box>
            <box flex="1">
              <select size="sm" block value={nameA?String(nameA.n):""} options={optionsFor(teamA)} onChange={v=>{setNumA(v);setSaved(false)}}/>
            </box>
          </row>
        </box>
        <box background={cfg.related?"surface":"surface-tertiary"} border radius="md" padding={2} gap={2}>
          <row justify="between" align="center">
            <text size="sm" weight="medium" color={cfg.related?"default":"tertiary"}>Relacionado · {cfg.b}</text>
            {#if cfg.related}
              <text color="secondary" size="xs">{numB?nameB?.name||"Dorsal sin ficha":"Opcional"}</text>
            {:else}
              <icon name="lock" size="xs" color="tertiary"/>
            {/if}
          </row>
          <row align="center" gap={1}>
            <box width="34%">
              <select size="sm" block disabled={!cfg.related} value={teamB} options={teamOpts} onChange={v=>{setTeamB(v);setSaved(false)}}/>
            </box>
            <box width="18%">
              <input size="sm" disabled={!cfg.related} inputType="number" value={numB} onChange={v=>{setNumB(v.slice(0,2));setSaved(false)}} placeholder="Nº"/>
            </box>
            <box flex="1">
              <select size="sm" block disabled={!cfg.related} value={nameB?String(nameB.n):""} options={optionsFor(teamB)} onChange={v=>{setNumB(v);setSaved(false)}}/>
            </box>
          </row>
        </box>
      </box>
      <box background={cfg.penalty?"surface":"surface-tertiary"} border radius="md" padding={2}>
        <row justify="between" align="center">
          <row align="center" gap={2}>
            <icon name="target" size="sm" color={cfg.penalty?"secondary":"tertiary"}/>
            <text color={cfg.penalty?"default":"tertiary"} weight="medium" size="sm">Penalti (7 m)</text>
          </row>
          <checkbox disabled={!cfg.penalty} checked={cfg.penalty&&penalty} onChange={v=>{setPenalty(v);setSaved(false)}} lineThrough={false}>Sí</checkbox>
        </row>
      </box>
      <box gap={1}>
        <label>Nota / transcripción</label>
        <textarea size="md" rows={2} value={note} onChange={v=>{setNote(v);setSaved(false)}} placeholder="Información adicional opcional"/>
      </box>
      <row gap={2}>
        <box flex="1">
          <button block color="secondary" variant="outline" onClick={()=>{setIdx(2);setTeamA("Nuestro");setTeamB("Rival");setNumA("08");setNumB("07");setMinute(18);setPenalty(false);setNote("");setSaved(false)}}>Restablecer</button>
        </box>
        <box flex="1">
          <button block color="primary" onClick={()=>setSaved(true)}><icon name="check" size="sm"/> Guardar</button>
        </box>
      </row>
      {#if saved}
        <row justify="center" align="center" gap={1}>
          <icon name="check-circle" color="success" size="sm"/>
          <text size="xs" color="success">Cambios guardados en la demostración</text>
        </row>
      {/if}
    </box>
    <caption textAlign="center">Prototipo: las flechas representan las ruedas táctiles; las relaciones entre eventos y campos son provisionales.</caption>
  </box>
</box>

## Por qué prefiero esta alternativa

El editor ocupa menos espacio y tiene siempre la misma disposición. La diferencia entre eventos es exclusivamente qué campos se activan y cómo se denominan los intervinientes.

Por ejemplo:

| Evento | Principal | Relacionado |
|---|---|---|
| Gol | Goleador | Desactivado |
| Parada | Portero | Lanzador (opcional) |
| Exclusión | Sancionado | Afectado (opcional) |
| Balón perdido | Responsable | Destinatario (opcional) |
| Balón recuperado | Recuperador | Rival (opcional) |
| Pasivo | Jugador (opcional) | Desactivado |

Esta tabla es una propuesta inicial, no una decisión cerrada sobre los metadatos de cada evento.

Hay un detalle que me parece importante: **los dos intervinientes deben tener equipo y dorsal propios**, porque no siempre estarán en equipos contrarios. En un pase fallado, por ejemplo, responsable y destinatario pueden pertenecer al mismo equipo.

También dejaría abierta una alternativa aún más compacta: sustituir las dos filas de intervinientes por una sola fila horizontal con una flecha entre ambos, del tipo **08 Lucía → 07 Sara**, y desplegar los selectores únicamente al tocar cada dorsal.

Me inclino por esta última posibilidad para el uso durante el partido, aunque el editor de filas que acabamos de probar me parece más claro para corregir eventos.

## C3.156 user

el destinatario del balon perdido no tiene sentido el resto ok.

## C3.164 assistant

De acuerdo. **Balón perdido tendrá un único interviniente: el jugador responsable.** El campo de jugador relacionado aparecerá desactivado.

Mantenemos el resto de relaciones:

| Evento | Jugador principal | Jugador relacionado |
|---|---|---|
| Gol | Goleador | — |
| Parada | Portero | Lanzador (opcional) |
| Exclusión | Sancionado | Afectado (opcional) |
| Tiro fallado | Lanzador | — |
| Balón perdido | Responsable | — |
| Balón recuperado | Recuperador | Rival (opcional) |
| Pasivo | Jugador (opcional) | — |
| Pasos/dobles | Infractor | — |
| Tarjetas | Sancionado | — |

Conservamos el **editor uniforme**, con todos los campos visibles y los no aplicables sombreados.

Además, mantendría una regla importante: los metadatos que dejan de aplicar al cambiar el tipo de evento no deben conservarse como datos activos.

Creo que ya tenemos bastante definida la estructura del editor. El siguiente paso natural sería concretar qué campos son obligatorios, opcionales o no aplicables para cada evento, porque de ello dependerá cuándo una tarjeta aparece como incompleta.