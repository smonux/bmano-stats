# Conversación C2

https://chatgpt.com/share/6ad10460-13bc-83ed-a9be-92278a709735

## C2.0 user

seguimos con la definición de eventos, hazme una propuesta

## C2.5 user

Original custom instructions no longer available

## C2.13 assistant

Propongo definir los eventos de **Handball Stats** con un criterio: registrar las acciones relevantes para las estadísticas, con el menor número posible de interacciones durante el partido.

Separaría tres conceptos:

- **Evento:** qué ha sucedido.
- **Participantes:** quién realiza la acción y, cuando corresponda, sobre quién.
- **Metadatos:** información que matiza el evento (penalti, motivo, resultado, etc.).

## 1. Catálogo de eventos propuesto

| Evento | Jugador principal | Segundo jugador | Metadatos |
|---|---|---|---|
| **Gol** | Goleador | Asistente (opcional) | Penalti |
| **Parada** | Portero | Lanzador rival (opcional) | Penalti |
| **Lanzamiento fallado** | Lanzador | — | Penalti, fuera/poste |
| **Bloqueo** | Defensor | Lanzador rival (opcional) | — |
| **Pérdida** | Jugador que pierde | — | Motivo |
| **Recuperación** | Jugador que recupera | — | Tipo |
| **Penalti provocado** | Jugador que lo provoca | Infractor (opcional) | — |
| **Exclusión** | Jugador excluido | Rival que la provoca (opcional) | Duración |
| **Amonestación** | Jugador amonestado | Rival (opcional) | — |
| **Descalificación** | Jugador descalificado | Rival (opcional) | Tarjeta azul |

Los dos jugadores no tienen siempre el mismo significado. Esto es importante para evitar un modelo artificial de «origen y destinatario».

## 2. Definición de los metadatos

Los metadatos deberían tener valores controlados, no texto libre.

| Evento | Metadato | Valores |
|---|---|---|
| Gol | Penalti | Sí / No |
| Parada | Penalti | Sí / No |
| Lanzamiento fallado | Penalti | Sí / No |
| Lanzamiento fallado | Resultado | Fuera / Poste |
| Pérdida | Motivo | Mal pase / Recepción / Pasos / Dobles / Falta en ataque / Pasivo / Otro |
| Recuperación | Tipo | Intercepción / Robo / Rechace / Otro |
| Exclusión | Duración | 2 min / 4 min |
| Descalificación | Tarjeta azul | Sí / No |

No haría obligatorio indicar el motivo de una pérdida o el tipo de recuperación. Son estadísticas interesantes, pero ralentizan la captura.

## 3. Eventos relacionados entre sí

Aquí está una de las decisiones más importantes del modelo.

<box border radius="lg" padding={3} gap={3}>
  <text weight="medium" size="sm">Ejemplo A. Gol con asistencia</text>
  <row align="center" justify="between">
    <box background="surface-secondary" radius="md" padding={3} flex="1" align="center" gap={1}>
      <text color="secondary" size="2xs">Asistente</text>
      <title size="xl" color="default">7</title>
    </box>
    <icon name="arrow-right" color="tertiary" size="lg"/>
    <box background="surface-secondary" radius="md" padding={3} flex="1" align="center" gap={1}>
      <text color="secondary" size="2xs">Goleador</text>
      <title size="xl" color="default">11</title>
    </box>
  </row>
  Se registra **un único evento de gol**, con la asistencia como dato asociado. No es necesario crear un segundo evento.
  <divider color="subtle"/>
  <text weight="medium" size="sm">Ejemplo B. Exclusión provocada</text>
  <row align="center" justify="between">
    <box background="surface-secondary" radius="md" padding={3} flex="1" align="center" gap={1}>
      <text color="secondary" size="2xs">Provoca (equipo A)</text>
      <title size="xl" color="default">9</title>
    </box>
    <icon name="arrow-right" color="tertiary" size="lg"/>
    <box background="surface-secondary" radius="md" padding={3} flex="1" align="center" gap={1}>
      <text color="secondary" size="2xs">Excluido (equipo B)</text>
      <title size="xl" color="default">5</title>
    </box>
  </row>
  Un único evento permite contabilizar tanto la exclusión recibida como la exclusión provocada.
</box>

Hay una diferencia importante: un penalti señalado y un lanzamiento posterior de 7 metros son dos hechos distintos. Por eso mantendría **Penalti provocado** como evento propio, mientras que Gol, Parada y Lanzamiento fallado tienen la marca de penalti.

## 4. Reglas de captura y estadísticas

Establecería estas reglas desde el principio:

1. Un lanzamiento debe tener un solo resultado: gol, parada, fallo o bloqueo. Nunca dos eventos para contabilizar el mismo lanzamiento.
2. Las estadísticas derivadas se calculan automáticamente. Por ejemplo, lanzamientos totales = goles + paradas recibidas + fallos + lanzamientos bloqueados, siempre que el lanzador esté identificado.
3. Los eventos pueden afectar a dos jugadores e incluso a dos equipos.
4. Cuando se edita o elimina un evento, se recalculan todas las estadísticas afectadas.
5. La gestión del reloj, los periodos y los tiempos muertos permanece fuera del catálogo de eventos, en la parte superior de la interfaz.

## 5. Cómo encajaría en la pantalla

Mantendría una estructura fija como la que estábamos diseñando:

<box border radius="xl" padding={3} gap={3}>
  {@body const eventos = ["Gol","Parada","Lanzamiento fallado","Bloqueo","Pérdida","Recuperación","Penalti provocado","Exclusión","Amonestación","Descalificación"]}
  {@body const [evento,setEvento] = DIL.useState("Exclusión")}
  {@body const [minuto,setMinuto] = DIL.useState(17)}
  {@body const [principal,setPrincipal] = DIL.useState("5")}
  {@body const [relacionado,setRelacionado] = DIL.useState("9")}
  {@body const [penalti,setPenalti] = DIL.useState(false)}
  {@body const [duracion,setDuracion] = DIL.useState("2 min")}
  {@body const [motivo,setMotivo] = DIL.useState("Mal pase")}
  {@body const [resultado,setResultado] = DIL.useState("Fuera")}
  {@body const specs = {"Gol":["Goleador","Asistente",true,true],"Parada":["Portero","Lanzador",true,true],"Lanzamiento fallado":["Lanzador","",false,true],"Bloqueo":["Defensor","Lanzador",true,false],"Pérdida":["Jugador","",false,false],"Recuperación":["Jugador","",false,false],"Penalti provocado":["Provocador","Infractor",true,false],"Exclusión":["Excluido","Provocador",true,false],"Amonestación":["Amonestado","Rival",true,false],"Descalificación":["Descalificado","Rival",true,false]}}
  {@body const spec = specs[evento]}
  {@body const numeros = Array.from({length:99},(_,i)=>({value:String(i+1),label:String(i+1)}))}
  <row align="center" justify="between">
    **Editar evento**
    <badge color="secondary">Prototipo interactivo</badge>
  </row>
  <grid columns={["2fr","1fr"]} gap={2}>
    <grid-item>
      <label>Evento</label>
      <select block pill={false} value={evento} onChange={setEvento} options={eventos.map(e=>({value:e,label:e}))}/>
    </grid-item>
    <grid-item>
      <label>Minuto</label>
      <row align="center" gap={1}>
        <button color="secondary" variant="outline" size="md" onClick={()=>setMinuto(v=>Math.max(0,v-1))}><icon name="minus"/></button>
        <box flex="1" align="center"><title tabularNums size="lg">{minuto}'</title></box>
        <button color="secondary" variant="outline" size="md" onClick={()=>setMinuto(v=>v+1)}><icon name="plus"/></button>
      </row>
    </grid-item>
  </grid>
  <grid columns={2} gap={2}>
    <grid-item>
      <label>{spec[0]}</label>
      <select block pill={false} value={principal} onChange={setPrincipal} options={numeros}/>
    </grid-item>
    <grid-item>
      <label color={spec[2]?"default":"tertiary"}>{spec[1]||"Jugador relacionado"}</label>
      <select block pill={false} disabled={!spec[2]} value={relacionado} onChange={setRelacionado} options={numeros}/>
    </grid-item>
  </grid>
  <grid columns={2} gap={2}>
    <grid-item>
      <box background={spec[3]?"surface-secondary":"surface"} radius="md" padding={3}>
        <checkbox checked={penalti} disabled={!spec[3]} onChange={setPenalti} lineThrough={false}>Penalti (7 m)</checkbox>
      </box>
    </grid-item>
    <grid-item>
      <label color={evento==="Exclusión"?"default":"tertiary"}>Duración</label>
      <select block pill={false} disabled={evento!=="Exclusión"} value={duracion} onChange={setDuracion} options={[{value:"2 min",label:"2 min"},{value:"4 min",label:"4 min"}]}/>
    </grid-item>
    <grid-item>
      <label color={evento==="Pérdida"?"default":"tertiary"}>Motivo</label>
      <select block pill={false} disabled={evento!=="Pérdida"} value={motivo} onChange={setMotivo} options={["Mal pase","Recepción","Pasos","Dobles","Falta en ataque","Pasivo","Otro"].map(x=>({value:x,label:x}))}/>
    </grid-item>
    <grid-item>
      <label color={evento==="Lanzamiento fallado"?"default":"tertiary"}>Resultado</label>
      <select block pill={false} disabled={evento!=="Lanzamiento fallado"} value={resultado} onChange={setResultado} options={[{value:"Fuera",label:"Fuera"},{value:"Poste",label:"Poste"}]}/>
    </grid-item>
  </grid>
  <caption>Los campos permanecen en su posición y se deshabilitan cuando no corresponden. El minuto se muestra aquí con controles +/−; en la aplicación usaríamos el wheel acordado.</caption>
</box>

## 6. Lo que dejaría para una segunda fase

No incluiría de entrada zonas de lanzamiento, tipo de ataque, velocidad, posición del jugador, faltas ordinarias, cambios de jugadores ni análisis de posesiones completas. Son ampliaciones útiles, pero exigen más intervenciones durante el partido.

Sí diseñaría el modelo para poder incorporarlas posteriormente sin cambiar los eventos ya registrados.

---

## 7. Las tres decisiones que cerraría ahora

{@body const [asistencia,setAsistencia] = DIL.useState("metadato")}
{@body const [lanzamientos,setLanzamientos] = DIL.useState("separados")}
{@body const [alcance,setAlcance] = DIL.useState("ambos")}
<box border radius="lg" padding={3} gap={4}>
  <form gap={3} onSubmit={()=>GenUI.issueNewTurn("Para la definición de eventos, mis decisiones son: asistencia = "+asistencia+"; lanzamientos = "+lanzamientos+"; equipos = "+alcance+". Actualiza la propuesta con estas decisiones.")}>
    <box gap={2}>
      <text weight="medium" size="sm">1. ¿La asistencia es un evento independiente?</text>
      <radio-group direction="col" value={asistencia} onChange={setAsistencia}>
        <radio value="metadato">No, metadato opcional del gol (recomendado)</radio>
        <radio value="evento">Sí, evento independiente</radio>
      </radio-group>
    </box>
    <divider color="subtle"/>
    <box gap={2}>
      <text weight="medium" size="sm">2. ¿Cómo registramos los lanzamientos?</text>
      <radio-group direction="col" value={lanzamientos} onChange={setLanzamientos}>
        <radio value="separados">Eventos separados: Gol, Parada, Fallo y Bloqueo (recomendado)</radio>
        <radio value="unificado">Un único evento Lanzamiento con resultado</radio>
      </radio-group>
    </box>
    <divider color="subtle"/>
    <box gap={2}>
      <text weight="medium" size="sm">3. ¿Se registran ambos equipos?</text>
      <radio-group direction="col" value={alcance} onChange={setAlcance}>
        <radio value="ambos">Ambos equipos, con el mismo detalle</radio>
        <radio value="propio">Principalmente mi equipo y acciones relevantes del rival</radio>
      </radio-group>
    </box>
    <button block submit>Aplicar decisiones <icon name="arrow-right" inline/></button>
  </form>
</box>

Mi propuesta inicial sería **10 tipos de evento**, con campos dinámicos según la acción, estadísticas derivadas y sin crear eventos independientes para los datos que pueden asociarse a una única acción.

## C2.14 user

quita bloqueo
fuera poste no tiene entidad para ser metadato en lanzamiento fallado
motivo de pérdida quitalo 
recuperacion tipo quitalo
penalti, el fundamental es quien lo comete no el que lo recibe
Falta tarjeta amarilla

## C2.19 assistant

Actualizo el catálogo con tus cambios. Quedan **9 eventos**.

## 1. Catálogo de eventos

| Evento | Jugador principal | Segundo jugador | Metadatos |
|---|---|---|---|
| **Gol** | Goleador | Asistente (opcional) | Penalti |
| **Parada** | Portero | Lanzador (opcional) | Penalti |
| **Lanzamiento fallado** | Lanzador | — | Penalti |
| **Pérdida** | Jugador que pierde | — | — |
| **Recuperación** | Jugador que recupera | — | — |
| **Penalti cometido** | Infractor | Beneficiario (opcional) | — |
| **Exclusión** | Jugador excluido | Provocador (opcional) | Duración |
| **Tarjeta amarilla** | Jugador amonestado | — | — |
| **Descalificación** | Jugador descalificado | Provocador (opcional) | Tarjeta azul |

La tarjeta amarilla sustituye a la anterior denominación «Amonestación».

## 2. Metadatos definitivos por ahora

| Metadato | Aplica a | Valores |
|---|---|---|
| Penalti | Gol, Parada, Lanzamiento fallado | Sí / No |
| Duración | Exclusión | 2 min / 4 min |
| Tarjeta azul | Descalificación | Sí / No |

La asistencia y los jugadores relacionados son participantes del evento, no metadatos.

## 3. Reglas importantes

**Penalti cometido:** el jugador principal es siempre el infractor. El jugador beneficiario es opcional. Un penalti cometido y su posterior lanzamiento son dos hechos distintos.

**Lanzamiento fallado:** no diferenciamos fuera, poste ni bloqueo. Todos computan como lanzamiento fallado.

**Pérdidas y recuperaciones:** sin clasificación adicional.

**Sanciones:** tarjeta amarilla, exclusión y descalificación son eventos independientes.

**Gestión del tiempo:** sigue fuera del catálogo. El reloj, los periodos y los tiempos muertos se gestionan desde la cabecera.

## 4. Una cuestión que conviene resolver

¿Queremos contabilizar las **faltas ordinarias**?

Ahora mismo tendríamos penaltis cometidos y sanciones disciplinarias, pero no faltas que simplemente interrumpen el juego.

Mi propuesta es no incorporarlas inicialmente: producen demasiadas acciones de registro y su valor estadístico es relativamente bajo para una captura manual.

Con esto dejaría cerrado el catálogo inicial y pasaría a definir **qué estadísticas genera cada evento**, diferenciando las individuales y las de equipo.

## C2.20 user

quita la exclusión de 4 minutos. Hay que tener en cuenta que los datos obligatorios estrictamente suele ser el equipo. El resto mejoran los datos, pero no son imprescindibles. las faltas ordinarias de momento no las contemplamos.

Falta pasivo, que no tiene jugador sino equipo.

hay un metadato de gol o tiro errado que sería "forzado pasivo" pero de momento no lo contemplamos.

## C2.23 assistant

Actualizo la propuesta. Quedan **10 tipos de evento**, con una regla fundamental: **el único dato estrictamente obligatorio es el equipo**. El resto de los campos enriquecen las estadísticas, pero nunca deben impedir registrar una acción.

## 1. Catálogo de eventos v0.1

| Evento | Jugador principal (opcional) | Segundo jugador (opcional) | Metadatos |
|---|---|---|---|
| Gol | Goleador | Asistente | Penalti |
| Parada | Portero | Lanzador | Penalti |
| Lanzamiento fallado | Lanzador | — | Penalti |
| Pérdida | Jugador que pierde | — | — |
| Recuperación | Jugador que recupera | — | — |
| Penalti cometido | Infractor | Beneficiario | — |
| Exclusión | Jugador excluido | Provocador | — |
| Tarjeta amarilla | Jugador amonestado | — | — |
| Descalificación | Jugador descalificado | Provocador | Tarjeta azul |
| **Pasivo** | — | — | — |

En todos los casos se registra el equipo al que pertenece la acción. En la parada, el equipo principal es el del portero; en el penalti cometido, el del infractor.

## 2. Metadatos

| Metadato | Eventos | Valores |
|---|---|---|
| Penalti | Gol, Parada, Lanzamiento fallado | Sí / No |
| Tarjeta azul | Descalificación | Sí / No |

La exclusión pasa a ser siempre de **2 minutos**. No necesita metadato de duración.

La indicación de *forzado pasivo* en gol o lanzamiento fallado queda identificada como posible ampliación futura, pero **no forma parte de esta versión**.

## 3. Reglas de registro

- **Equipo obligatorio:** siempre identificamos a qué equipo se atribuye el evento.
- **Jugadores opcionales:** si conocemos el dorsal, se registra; si no, el evento sigue siendo válido.
- **Segundo jugador opcional:** permite enriquecer acciones como asistencias, exclusiones provocadas o penaltis cometidos.
- **Metadatos opcionales:** no se exige completar información adicional.
- **Pasivo:** se asigna exclusivamente al equipo, sin jugador.
- **Faltas ordinarias:** fuera del alcance inicial.
- **Reloj, periodos y tiempos muertos:** gestión independiente de los eventos.

## 4. Consecuencia para las estadísticas

Esta decisión obliga a distinguir entre estadísticas de equipo e individuales.

Por ejemplo, si registramos un gol del equipo A sin asignar goleador:

- Se suma **1 gol al equipo A**.
- No se asigna el gol a ningún jugador.
- Se conserva el evento para editarlo posteriormente.
- No se inventa una atribución individual.

Lo mismo aplica a las paradas, pérdidas, recuperaciones y sanciones.

## 5. Siguiente decisión de diseño

Queda una cuestión importante respecto a la relación entre equipos.

Por ejemplo, una **parada del equipo A** implica un lanzamiento no convertido del equipo B. Una **recuperación del equipo A** puede corresponderse con una pérdida del B.

Hay dos posibles modelos:

**A. Eventos independientes:** se registra la parada y, si queremos, también el lanzamiento del rival. Es más sencillo, pero puede generar duplicidades.

**B. Eventos con consecuencias estadísticas:** registrar una parada genera automáticamente un lanzamiento recibido y no convertido para el otro equipo. Se evita registrar dos veces la misma acción.

Me inclino por **B**, pero con una precaución: las consecuencias deben quedar ligadas al evento original y nunca generar nuevos eventos independientes. Así evitamos duplicidades al editar o borrar acciones.

Esta distinción será clave para definir correctamente el cálculo de estadísticas.

## C2.24 user

Opcion B.
Otra cuestión habrá un jugador virtual "desconocido" por  equipo, que recibirá todas las estadísticas no registradas con jugador explícito

## C2.28 assistant

Perfecto. Incorporamos ambas decisiones al modelo de datos de **Handball Stats**.

## 1. Consecuencias estadísticas automáticas (opción B)

Cada acción genera **un único evento**, del que se derivan las estadísticas correspondientes a ambos equipos, sin crear eventos adicionales.

Por ejemplo, una parada del equipo A genera:
- Una parada para el equipo A.
- Un lanzamiento recibido para el equipo A.
- Un lanzamiento efectuado para el equipo B.
- Un lanzamiento no convertido para el equipo B.

Todo procede del mismo evento. Si se modifica o elimina, se actualizan todas sus consecuencias.

## 2. Jugador virtual «Desconocido»

Cada equipo tendrá un jugador virtual permanente.

| Propiedad | Definición |
|---|---|
| Nombre | Desconocido |
| Equipo | Uno por equipo |
| Dorsal | Sin dorsal |
| Identificador | Interno y único |
| Estadísticas | Acumula las no asignadas a jugadores concretos |
| Edición | Se pueden reasignar posteriormente |
| Plantilla | No cuenta como jugador real |

**Regla:** cuando una estadística individual deba atribuirse a un jugador y no se haya identificado, se asignará al jugador «Desconocido» del equipo correspondiente.

Ejemplo:

| Acción registrada | Estadística resultante |
|---|---|
| Gol del equipo A, sin jugador | Gol para Desconocido A |
| Parada del equipo B, sin portero | Parada para Desconocido B |
| Parada del equipo B, sin lanzador rival | Lanzamiento para Desconocido A |
| Exclusión del equipo A, sin jugador | Exclusión para Desconocido A |
| Pérdida del equipo B, sin jugador | Pérdida para Desconocido B |

Los totales de equipo siempre incluyen las estadísticas del jugador virtual.

## 3. Distinción importante: ausencia frente a desconocimiento

No debemos confundir dos situaciones:

- **Jugador desconocido:** sabemos que existe un protagonista, pero no su identidad. Se asigna a «Desconocido».
- **Participación opcional no registrada:** no sabemos si hubo asistencia, por ejemplo. No debemos inventar una asistencia para «Desconocido».

Asimismo, **Pasivo** sigue siendo exclusivamente una estadística de equipo. No se atribuye al jugador virtual porque ese evento no tiene protagonista individual.

## 4. Implicación para el modelo

Propongo conservar el evento original con sus participantes explícitos (que pueden estar vacíos) y resolver automáticamente los jugadores desconocidos en el cálculo estadístico.

Esto permite distinguir qué información registró realmente el usuario y qué atribuciones completó el sistema.

Cuando posteriormente se edita un evento para identificar al jugador, sus estadísticas se trasladan de «Desconocido» al jugador real, sin modificar los totales de equipo.

---

Con esto quedan fijados tres principios importantes del modelo:

1. **Un evento es la fuente única de verdad.**
2. **Las estadísticas son consecuencias calculadas, no eventos adicionales.**
3. **Ninguna estadística individual se pierde por no identificar al jugador.**

El siguiente paso lógico es construir la **matriz de consecuencias estadísticas de los 10 eventos**: qué suma cada uno al equipo principal, al rival y a sus respectivos jugadores. Ahí podremos detectar ambigüedades antes de implementar la lógica.

## C2.29 user

bien

## C2.33 assistant

## Matriz de consecuencias estadísticas — v0.1

Cada evento genera estadísticas para uno o ambos equipos, sin crear eventos adicionales.

| Evento | Equipo del evento | Equipo rival |
|---|---|---|
| **Gol** | +1 gol, +1 lanzamiento | +1 gol recibido, +1 lanzamiento recibido |
| **Parada** | +1 parada, +1 lanzamiento recibido | +1 lanzamiento, +1 lanzamiento no convertido |
| **Lanzamiento fallado** | +1 lanzamiento, +1 lanzamiento no convertido | +1 lanzamiento recibido |
| **Pérdida** | +1 pérdida | — |
| **Recuperación** | +1 recuperación | — |
| **Penalti cometido** | +1 penalti cometido | +1 penalti recibido |
| **Exclusión** | +1 exclusión, +2 minutos | — |
| **Tarjeta amarilla** | +1 amarilla | — |
| **Descalificación** | +1 descalificación | — |
| **Pasivo** | +1 pasivo | — |

### Atribución individual

Las estadísticas correspondientes al jugador principal se asignan al dorsal indicado o, en su ausencia, al jugador virtual **Desconocido** de ese equipo.

Los participantes secundarios se contabilizan cuando corresponda. No se inventan acciones opcionales, como una asistencia no registrada.

### Reglas adicionales

- **Gol:** una asistencia solo se contabiliza si se ha indicado.
- **Penalti:** el penalti cometido y su posterior lanzamiento son acciones independientes.
- **Parada:** genera automáticamente un lanzamiento no convertido del rival. No hay que registrar otro lanzamiento fallado.
- **Pérdida y recuperación:** inicialmente no se consideran necesariamente simétricas. Una pérdida no implica que exista una recuperación individual identificable.
- **Pasivo:** representa una pérdida de posesión del equipo. Propongo incluirla en las pérdidas totales de equipo, pero sin atribuirla a ningún jugador, ni siquiera a Desconocido.
- **Tarjeta azul:** es un metadato de descalificación y permite contar las descalificaciones con informe.

### Estadísticas agregadas

Con este modelo podemos calcular:

\[
\text{Lanzamientos} = \text{Goles} + \text{Paradas rivales} + \text{Fallados}
\]

\[
\text{Efectividad de tiro} = \frac{\text{Goles}}{\text{Lanzamientos}}
\]

\[
\text{Efectividad de portería} = \frac{\text{Paradas}}{\text{Lanzamientos recibidos}}
\]

Queda pendiente decidir cómo tratar la atribución individual de los goles encajados al portero, puesto que todavía no identificamos al portero rival en los eventos de gol.

**También dejaría fijada una regla técnica:** cada estadística derivada debe conservar su vínculo con el evento que la origina. Así podremos editar eventos, asignar jugadores anteriormente desconocidos y recalcular estadísticas sin duplicidades.

Con esta base podemos pasar a definir el esquema de datos y las relaciones entre eventos, equipos y jugadores.

## C2.34 user

recuperacion implica perdida del contrario (aunque lo contrario no es cierto)
exclusion y 2 minutos son sinonimos 

Exclusion forzada es una estadística de jugador importante, aunque no debe incuirse como de equipo.
Infracciones como pisando o pasos/dobles deben contemplarse

## C2.40 assistant

Incorporo las cuatro modificaciones. Mantendría las infracciones como eventos específicos, no como motivos de una pérdida, respetando la decisión anterior.

## 1. Cambios en las consecuencias estadísticas

| Evento | Equipo del evento | Equipo contrario | Estadística individual adicional |
|---|---|---|---|
| **Recuperación** | +1 recuperación | +1 pérdida | Pérdida al jugador rival, o a Desconocido |
| **Pérdida** | +1 pérdida | — | — |
| **Exclusión** | +1 exclusión | — | +1 exclusión forzada al provocador |
| **Pisando** | +1 pérdida | — | +1 pisando |
| **Pasos** | +1 pérdida | — | +1 pasos |
| **Dobles** | +1 pérdida | — | +1 dobles |

### Recuperación y pérdida

- Una recuperación genera siempre una pérdida del contrario.
- Una pérdida no genera automáticamente una recuperación.
- En una recuperación, el jugador rival que pierde el balón puede identificarse opcionalmente. Si no se identifica, la pérdida se atribuye a **Desconocido** del equipo contrario.
- No se debe registrar además una pérdida independiente por la misma acción, para evitar duplicidades.

### Exclusión y exclusión forzada

- **Exclusión = 2 minutos:** son una única estadística, no dos contadores diferentes.
- El jugador excluido recibe +1 exclusión.
- Si se identifica al jugador que provoca la exclusión, recibe +1 exclusión forzada.
- La exclusión forzada es exclusivamente una estadística individual. **No se acumula como estadística de equipo.**
- Si no se indica provocador, no se contabiliza una exclusión forzada.

## 2. Infracciones técnicas

Propongo tres eventos independientes:

| Evento | Equipo obligatorio | Jugador opcional | Consecuencia |
|---|---|---|---|
| Pisando | Sí | Sí | Pérdida |
| Pasos | Sí | Sí | Pérdida |
| Dobles | Sí | Sí | Pérdida |

De esta manera, el total de pérdidas incluye las pérdidas genéricas, las derivadas de recuperaciones rivales y las infracciones técnicas, sin contabilizar dos veces una misma acción.

No hace falta registrar un evento adicional de «Pérdida» cuando se registra una infracción.

## 3. Catálogo actualizado

Pasamos de 10 a **13 eventos**:

<grid columns={2} gap={2}>
  {#each ["Gol","Parada","Lanzamiento fallado","Pérdida","Recuperación","Penalti cometido","Exclusión","Tarjeta amarilla","Descalificación","Pasivo","Pisando","Pasos","Dobles"] as e,i}
    <grid-item>
      <row align="center" gap={2}>
        <text color="tertiary" size="xs" tabularNums>{String(i+1).padStart(2,"0")}</text>
        <text weight="medium" size="sm">{e}</text>
      </row>
    </grid-item>
  {/each}
</grid>

Se mantienen las reglas ya acordadas: equipo obligatorio, jugadores opcionales, jugador virtual Desconocido, consecuencias automáticas y gestión del reloj independiente.

**Una decisión de modelado importante:** las infracciones y las recuperaciones generan pérdidas como estadísticas derivadas, pero no crean eventos adicionales de Pérdida. Así, al calcular el total de pérdidas, el sistema suma las contribuciones de todos los tipos de evento correspondientes, sin duplicar registros.

Con esto tenemos un catálogo bastante compacto y podemos seguir definiendo las estadísticas individuales y de equipo.

## C2.41 user

pasos/dobles/pisando es un mismo evento infraccion y el concreto se elige como metadato.

## C2.45 assistant

De acuerdo. Unificamos los tres en un único evento **Infracción**, con un metadato obligatorio que especifica el tipo.

## Evento: Infracción

| Campo | Valor | Obligatorio |
|---|---|---|
| Equipo | Equipo infractor | Sí |
| Jugador | Jugador infractor | No |
| Tipo | Pasos / Dobles / Pisando | Sí |
| Minuto | Minuto del evento | Automático, editable |

### Consecuencias estadísticas

- **Equipo:** +1 pérdida y +1 infracción del tipo correspondiente.
- **Jugador:** +1 pérdida y +1 infracción del tipo correspondiente.
- Si no se identifica al jugador, las estadísticas individuales se asignan a **Desconocido**.

## Catálogo actualizado: 11 eventos

1. Gol
2. Parada
3. Lanzamiento fallado
4. Pérdida
5. Recuperación
6. Penalti cometido
7. Exclusión (2 minutos)
8. Tarjeta amarilla
9. Descalificación
10. Pasivo
11. **Infracción** (Pasos / Dobles / Pisando)

Se mantienen todas las demás reglas.

**Importante:** el tipo de infracción es obligatorio porque determina la estadística específica, mientras que el jugador sigue siendo opcional.

Queda consolidado en la definición del modelo de eventos.