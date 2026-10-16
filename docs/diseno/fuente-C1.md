# Conversación C1

https://chatgpt.com/share/6ad1044d-1eec-83eb-ba8a-3ef2d458b76f

## C1.0 user

pantalla principal. debería tener diversas "cajas": nuevo partido la primera, equipos, partidos (historico), Estadísticas. Dime si alguna más es imprescindible. Si no vamos diseñandolas excepto partido que se ha hecho en otra conversacion

## C1.5 user

Original custom instructions no longer available

## C1.13 assistant

Mantendría **las cuatro cajas que propones**. No veo ninguna otra imprescindible para la pantalla principal.

Solo añadiría dos elementos funcionales:

- **Continuar partido:** aparece únicamente cuando existe un partido iniciado y no finalizado. Debe ser muy visible para evitar empezar otro por error.
- **Ajustes:** un icono discreto en la cabecera, sin ocupar una caja. Incluiría preferencias generales y configuración de la aplicación.

La gestión de jugadores estaría dentro de **Equipos**, no como sección independiente.

## Propuesta de pantalla principal

<box border radius="2xl" padding={3} gap={3} maxWidth="430px">
  <row align="center" justify="between">
    <box gap="1px">
      <title size="xl">Handball Stats</title>
      <text color="secondary" size="xs">Inicio</text>
    </box>
    <icon name="settings" color="secondary" size="lg"/>
  </row>
  <box background="surface-secondary" radius="xl" padding={4} gap={2}>
    <row align="center" gap={2}>
      <icon name="plus-circle" size="lg"/>
      **Nuevo partido**
    </row>
    <text size="sm" color="secondary">Configurar equipos y comenzar el registro de eventos.</text>
    <row justify="end">
      <icon name="arrow-right" color="secondary"/>
    </row>
  </box>
  <grid columns={2} gap={3}>
    <grid-item>
      <box border radius="xl" padding={3} gap={2} minHeight="125px">
        <icon name="users" size="lg"/>
        **Equipos**
        <text size="xs" color="secondary">Plantillas y jugadores</text>
      </box>
    </grid-item>
    <grid-item>
      <box border radius="xl" padding={3} gap={2} minHeight="125px">
        <icon name="calendar-days" size="lg"/>
        **Partidos**
        <text size="xs" color="secondary">Histórico y edición</text>
      </box>
    </grid-item>
  </grid>
  <box border radius="xl" padding={3} gap={2}>
    <row align="center" gap={3}>
      <icon name="chart-column-increasing" size="lg"/>
      <box flex="1" gap="1px">
        **Estadísticas**
        <text color="secondary" size="xs">Análisis de equipos, jugadores y partidos</text>
      </box>
      <icon name="chevron-right" color="secondary"/>
    </row>
  </box>
</box>

## Las pantallas que debemos diseñar

| Pantalla | Funcionalidad principal |
|---|---|
| **Nuevo partido** | Elegir los dos equipos, configurar el formato del encuentro y comenzar. |
| **Equipos** | Crear, editar y gestionar equipos y sus jugadores. Incluir el jugador virtual «Desconocido». |
| **Partidos** | Consultar el histórico, recuperar encuentros y editar sus datos y eventos. |
| **Estadísticas** | Consultar estadísticas individuales y colectivas, tanto por partido como acumuladas. |

No crearía una sección específica para competiciones, temporadas o categorías de momento. Si las necesitamos, pueden incorporarse posteriormente como atributos o filtros.

## Empezaría por «Nuevo partido»

Propongo una pantalla bastante sencilla, sin pedir información innecesaria antes de empezar:

1. **Equipo local y visitante:** selección entre equipos existentes, con posibilidad de crear uno inmediatamente.
2. **Fecha:** por defecto, la actual; editable.
3. **Formato del partido:** número y duración de los tiempos, configurables para distintas categorías.
4. **Jugadores:** se cargan automáticamente desde las plantillas. No es necesario seleccionar jugadores para empezar.
5. **Iniciar partido:** botón principal.

La única información estrictamente necesaria serían los dos equipos. Lo demás tendría valores predeterminados o sería opcional.

**Mi propuesta es diseñar las pantallas en este orden:** Nuevo partido → Equipos → Partidos → Estadísticas. En cada una concretamos distribución, controles y comportamiento antes de pasar a la siguiente, manteniendo la pantalla de registro del partido que ya trabajamos.

## C1.14 user

nuevo partido pero 3 y 4 no son necesarios, KISS

## C1.19 assistant

De acuerdo. **Nuevo partido** queda reducido a lo esencial.

<box border radius="2xl" padding={4} gap={3} maxWidth="420px">
  <row align="center" gap={3}>
    <icon name="arrow-left" color="secondary"/>
    <title size="lg">Nuevo partido</title>
  </row>
  <divider color="subtle"/>
  <box gap={1}>
    <label>Equipo local</label>
    <row align="center" gap={2}>
      <box flex="1" border radius="lg" padding={3}>
        <row align="center" justify="between">
          <text color="secondary">Seleccionar equipo</text>
          <icon name="chevron-down" color="secondary"/>
        </row>
      </box>
      <box background="surface-secondary" radius="lg" padding={3}>
        <icon name="plus"/>
      </box>
    </row>
  </box>
  <box gap={1}>
    <label>Equipo visitante</label>
    <row align="center" gap={2}>
      <box flex="1" border radius="lg" padding={3}>
        <row align="center" justify="between">
          <text color="secondary">Seleccionar equipo</text>
          <icon name="chevron-down" color="secondary"/>
        </row>
      </box>
      <box background="surface-secondary" radius="lg" padding={3}>
        <icon name="plus"/>
      </box>
    </row>
  </box>
  <box gap={1}>
    <label>Fecha</label>
    <date-picker block value="2026-10-15" disabled/>
    <caption>Por defecto, hoy. Editable al crear el partido.</caption>
  </box>
  <box background="surface-tertiary" radius="lg" padding={3} align="center">
    <text weight="medium">Iniciar partido <icon name="arrow-right" inline/></text>
  </box>
</box>

**Comportamiento:**

- El `+` permite crear un equipo sin abandonar el flujo.
- La fecha se rellena automáticamente con la actual.
- Solo es obligatorio seleccionar ambos equipos, que deben ser distintos.
- Al iniciar, se abre directamente la pantalla de registro que ya diseñamos.

Sin configuración de tiempos, sin selección de jugadores y sin pasos intermedios.

**Una decisión adicional:** permitiría crear partidos con equipos sin plantilla. El jugador «Desconocido» se encargaría de recibir las estadísticas sin jugador identificado.

## C1.20 user

no es necesaria la plantilla en ningún caso, pero eso no significa que los equipos no tienen jugadores identificables. Se añaden según se van añadiendo dorsales. Esto es importante.

## C1.24 assistant

Entendido. Es una decisión importante del modelo de datos y del flujo de registro.

**Los equipos no necesitan una plantilla previa. Los jugadores se identifican progresivamente por su dorsal durante el partido.**

Funcionamiento:

1. Al crear un partido, solo se seleccionan los dos equipos.
2. Al registrar un evento con un dorsal nuevo, el jugador se crea automáticamente y queda asociado a ese equipo.
3. Si el dorsal ya existe, se reutiliza el jugador identificado.
4. Si no se indica dorsal, el evento se asigna al jugador virtual **«Desconocido»** del equipo.
5. Posteriormente se podrá completar la información del jugador (nombre, etc.), sin perder las estadísticas registradas.

Esto implica una distinción importante: **un dorsal identifica inicialmente a un jugador dentro de un equipo y un partido**, pero no necesariamente de forma permanente entre partidos, porque los dorsales pueden cambiar.

Por tanto, no exigiremos nunca gestionar plantillas para registrar estadísticas.

Mantendría esta filosofía en toda la aplicación: **primero registrar, después enriquecer los datos**, sin interrumpir el trabajo durante el partido.

## C1.25 user

lo nomal es que un delegado tenga preconfigurado a su equipo, pero no el del rival y que el suyo sea preseleccionado del catalogo de equipos pero el otro solo sea un nombre.

## C1.29 assistant

Tiene sentido. El caso habitual es que **el delegado conoce y tiene configurado su equipo, pero del rival inicialmente solo conoce el nombre**.

Por tanto, no trataría ambos equipos de manera simétrica.

## Nuevo partido

<box border radius="2xl" padding={3} gap={3} maxWidth="420px">
  <row align="center" gap={2}>
    <icon name="arrow-left" color="secondary"/>
    <title size="lg">Nuevo partido</title>
  </row>
  <box gap={1}>
    <label>Mi equipo</label>
    <box border radius="lg" padding={3}>
      <row align="center" justify="between">
        **Mi equipo habitual**
        <icon name="chevron-down" color="secondary"/>
      </row>
    </box>
    <caption>Preseleccionado del catálogo de equipos</caption>
  </box>
  <box gap={1}>
    <label>Jugamos como</label>
    {@body const [home,setHome] = DIL.useState("local")}
    <segmented-control block={true} size="lg" value={home} onChange={setHome} options={[{"value":"local","label":"Local"},{"value":"visitante","label":"Visitante"}]}/>
  </box>
  <box gap={1}>
    <label>Rival</label>
    {@body const [rival,setRival] = DIL.useState("")}
    <input value={rival} onChange={setRival} placeholder="Nombre del equipo rival" size="lg"/>
    <caption>No requiere configuración previa</caption>
  </box>
  <box gap={1}>
    <label>Fecha</label>
    {@body const [date,setDate] = DIL.useState("2026-10-15")}
    <date-picker block value={date} onChange={setDate}/>
  </box>
  <box background="surface-secondary" radius="lg" padding={3} gap={2}>
    <text color="secondary" size="xs" weight="medium">Vista previa del encuentro</text>
    <row align="center" justify="between">
      <box flex="1" align="center" gap={1}>
        <text weight="medium" textAlign="center">{home==="local"?"Mi equipo habitual":rival||"Rival"}</text>
        <caption>Local</caption>
      </box>
      <text color="tertiary">vs.</text>
      <box flex="1" align="center" gap={1}>
        <text weight="medium" textAlign="center">{home==="visitante"?"Mi equipo habitual":rival||"Rival"}</text>
        <caption>Visitante</caption>
      </box>
    </row>
  </box>
  <box background="surface-tertiary" padding={3} radius="lg" align="center">
    **Iniciar partido <icon name="arrow-right" inline/>**
  </box>
</box>

## Comportamiento

- **Mi equipo:** se preselecciona automáticamente, pero puede cambiarse.
- **Local/visitante:** determina la posición de cada equipo en el encuentro.
- **Rival:** basta con escribir su nombre. No hay que crearlo previamente en el catálogo.
- **Jugadores:** los dorsales nuevos identifican jugadores durante el registro, tanto propios como rivales.
- **Fecha:** hoy por defecto, editable.

Una distinción importante en los datos: el equipo propio tiene una identidad persistente en el catálogo; el rival puede existir únicamente como equipo asociado a ese partido.

Así mantenemos un inicio rápido sin renunciar a registrar estadísticas individuales de ambos equipos.

## C1.30 user

pero puede ser el rival un equipo de tu mismo club. Simplifica, la anterior estaba mejor y no hagas meter local y visitante.

## C1.34 assistant

Volvemos al diseño anterior. Dos equipos, sin preguntar por separado si jugamos como local o visitante.

<box border radius="2xl" padding={4} gap={3} maxWidth="420px">
  <row align="center" gap={2}>
    <icon name="arrow-left" color="secondary"/>
    <title size="lg">Nuevo partido</title>
  </row>
  <divider color="subtle"/>
  {@body const [home,setHome] = DIL.useState(true)}
  <box gap={1}>
    <label>Equipo local</label>
    {#if home}
      <box border radius="lg" padding={3}>
        <row justify="between" align="center">
          <text>Mi equipo habitual</text>
          <icon name="chevron-down" color="secondary"/>
        </row>
      </box>
    {:else}
      <input placeholder="Buscar o escribir equipo" size="lg"/>
    {/if}
  </box>
  <row justify="center">
    <button color="secondary" variant="outline" size="md" onClick={()=>setHome(!home)}>
      <icon name="arrow-up-down" inline/> Intercambiar
    </button>
  </row>
  <box gap={1}>
    <label>Equipo visitante</label>
    {#if home}
      <input placeholder="Buscar o escribir equipo" size="lg"/>
    {:else}
      <box border radius="lg" padding={3}>
        <row justify="between" align="center">
          <text>Mi equipo habitual</text>
          <icon name="chevron-down" color="secondary"/>
        </row>
      </box>
    {/if}
  </box>
  <box gap={1}>
    <label>Fecha</label>
    {@body const [date,setDate]=DIL.useState("2026-10-15")}
    <date-picker block value={date} onChange={setDate}/>
  </box>
  <box background="surface-tertiary" radius="lg" padding={3} align="center">
    **Iniciar partido <icon name="arrow-right" inline/>**
  </box>
</box>

**Reglas:**

- Ambos equipos pueden seleccionarse del catálogo o introducirse por nombre.
- El equipo habitual aparece preseleccionado.
- El rival puede ser cualquier equipo, incluido otro del mismo club.
- Un nombre nuevo no exige crear previamente un equipo en el catálogo.
- Intercambiar cambia las posiciones con un toque.

Nada más. Sin plantillas, configuraciones ni pasos adicionales.

## C1.35 user

además un equipo propio puede estar incompleto, también se pueden introducir dorsales de equipos ya creados en bbdd

## C1.38 assistant

Correcto. **Todos los equipos se comportan igual durante el registro**, independientemente de si existen previamente en la base de datos o se introdujeron al crear el partido.

La lógica sería:

- **Equipo existente:** se recuperan sus jugadores conocidos, pero pueden aparecer dorsales nuevos.
- **Equipo nuevo:** empieza sin jugadores identificados.
- **Dorsal conocido:** se utiliza el jugador ya registrado.
- **Dorsal nuevo:** se crea automáticamente y se asocia al equipo.
- **Sin dorsal:** se utiliza el jugador virtual «Desconocido».

Por tanto, **las plantillas son abiertas y nunca condicionan el registro de eventos**.

Esto también simplifica la interfaz: el selector de jugador debe permitir elegir dorsales conocidos o introducir cualquiera nuevo, sin distinguir entre equipo propio, rival, completo o incompleto.

Una precaución: si un dorsal nuevo aparece en un equipo existente, su asociación permanente al equipo debería poder corregirse posteriormente, especialmente si se trata de un jugador ocasional o de un cambio de dorsal.

## C1.39 user

# Selected text:

## Selection 1
uipo localMi equipo habitual



 Intercambiar
Equipo visitante

Fecha15/10/26

Iniciar partido 


Reglas:

## My request:
No, debe ser simétrico. Pueden ser dos equipos desconocidos o dos precargados. de nuevo. Simplifica

## C1.42 assistant

## Nuevo partido

<box border radius="2xl" padding={4} gap={4} maxWidth="420px">
  <row align="center" gap={2}>
    <icon name="arrow-left" color="secondary"/>
    <title size="lg">Nuevo partido</title>
  </row>
  {@body const [local,setLocal] = DIL.useState("")}
  {@body const [visitor,setVisitor] = DIL.useState("")}
  {@body const [date,setDate] = DIL.useState("2026-10-15")}
  <box gap={1}>
    <label>Equipo local</label>
    <input value={local} onChange={setLocal} placeholder="Buscar o escribir equipo" size="lg"/>
  </box>
  <box gap={1}>
    <label>Equipo visitante</label>
    <input value={visitor} onChange={setVisitor} placeholder="Buscar o escribir equipo" size="lg"/>
  </box>
  <box gap={1}>
    <label>Fecha</label>
    <date-picker block value={date} onChange={setDate}/>
  </box>
  <button block disabled={!local.trim()||!visitor.trim()||local.trim().toLowerCase()===visitor.trim().toLowerCase()} onClick={()=>GenUI.issueNewTurn("Iniciar partido: local "+local+", visitante "+visitor+", fecha "+date)}>
    Iniciar partido <icon name="arrow-right" inline/>
  </button>
</box>

**Reglas:**

- Ambos campos funcionan igual: autocompletado desde el catálogo o nombre libre.
- Pueden ser dos equipos existentes, dos nuevos o una combinación.
- Los jugadores conocidos se recuperan; los dorsales nuevos se incorporan durante el partido.
- Ninguna plantilla es obligatoria.

Sin más configuración.

## C1.43 user

que sea explicito, coger de desplegable o crear nuevo (que luego puede concretarse más)

## C1.47 assistant

## Nuevo partido

{@body const [localNew,setLocalNew] = DIL.useState(false)}
{@body const [visitorNew,setVisitorNew] = DIL.useState(false)}
{@body const [local,setLocal] = DIL.useState("")}
{@body const [visitor,setVisitor] = DIL.useState("")}
{@body const [date,setDate] = DIL.useState("2026-10-15")}
{@body const catalog = [{value:"a",label:"Equipo A (ejemplo)"},{value:"b",label:"Equipo B (ejemplo)"}]}
<box border radius="2xl" padding={4} gap={4} maxWidth="430px">
  <row align="center" gap={2}>
    <icon name="arrow-left" color="secondary"/>
    <title size="lg">Nuevo partido</title>
  </row>
  <box gap={2}>
    <label>Equipo local</label>
    <row align="center" gap={2}>
      <box flex="1">
        {#if localNew}
          <input placeholder="Nombre del nuevo equipo" value={local} onChange={setLocal}/>
        {:else}
          <select block placeholder="Seleccionar equipo" options={catalog} value={local} onChange={setLocal}/>
        {/if}
      </box>
      <button color="secondary" variant="outline" onClick={()=>{setLocalNew(!localNew);setLocal("")}}>
        <icon name={localNew?"list":"plus"} inline/> {localNew?"Catálogo":"Nuevo"}
      </button>
    </row>
  </box>
  <box gap={2}>
    <label>Equipo visitante</label>
    <row align="center" gap={2}>
      <box flex="1">
        {#if visitorNew}
          <input placeholder="Nombre del nuevo equipo" value={visitor} onChange={setVisitor}/>
        {:else}
          <select block placeholder="Seleccionar equipo" options={catalog} value={visitor} onChange={setVisitor}/>
        {/if}
      </box>
      <button color="secondary" variant="outline" onClick={()=>{setVisitorNew(!visitorNew);setVisitor("")}}>
        <icon name={visitorNew?"list":"plus"} inline/> {visitorNew?"Catálogo":"Nuevo"}
      </button>
    </row>
  </box>
  <box gap={2}>
    <label>Fecha</label>
    <date-picker block value={date} onChange={setDate}/>
  </box>
  <box background="surface-tertiary" radius="lg" padding={3} align="center">
    **Iniciar partido <icon name="arrow-right" inline/>**
  </box>
  <caption>Prototipo: los equipos del desplegable son ilustrativos.</caption>
</box>

**Comportamiento:** cada equipo se selecciona del catálogo o se crea con un nombre. Si se pulsa «Nuevo», aparece el campo de nombre y se puede volver al catálogo.

Los equipos nuevos pueden completarse posteriormente, incluidos sus jugadores. Los existentes también pueden incorporar dorsales nuevos durante el partido.

## C1.48 user

perfecto vamos a equipos

## C1.52 assistant

## Equipos

Propongo dos vistas: **catálogo de equipos** y **detalle de un equipo**. Sin plantillas obligatorias ni configuraciones adicionales.

Puedes interactuar con este prototipo.

{@body const [teams,setTeams] = DIL.useState([{id:"1",name:"Equipo A",players:[{number:"7",name:"Alex"},{number:"12",name:""},{number:"23",name:"Mario"}]},{id:"2",name:"Equipo B",players:[]},{id:"3",name:"Equipo C",players:[{number:"5",name:"Lucía"}]}])}
{@body const [selected,setSelected] = DIL.useState(null)}
{@body const [search,setSearch] = DIL.useState("")}
{@body const [creating,setCreating] = DIL.useState(false)}
{@body const [newTeam,setNewTeam] = DIL.useState("")}
{@body const [addingPlayer,setAddingPlayer] = DIL.useState(false)}
{@body const [number,setNumber] = DIL.useState("")}
{@body const [playerName,setPlayerName] = DIL.useState("")}
{@body const current=teams.find(t=>t.id===selected)}
{@body const filtered=teams.filter(t=>t.name.toLowerCase().includes(search.toLowerCase()))}
{@body const addTeam=()=>{if(!newTeam.trim())return;const id=String(teams.length+1);setTeams(p=>[...p,{id,name:newTeam.trim(),players:[]}]);setNewTeam("");setCreating(false);setSelected(id)}}
{@body const addPlayer=()=>{if(!number.trim()||!current||current.players.some(p=>p.number===number.trim()))return;setTeams(ts=>ts.map(t=>t.id===selected?{...t,players:[...t.players,{number:number.trim(),name:playerName.trim()}]}:t));setNumber("");setPlayerName("");setAddingPlayer(false)}}
<box border radius="2xl" maxWidth="430px" padding={4} gap={3}>
  {#if !current}
    <row align="center" justify="between">
      <title size="xl">Equipos</title>
      <button size="md" onClick={()=>setCreating(!creating)}><icon name="plus" inline/> Nuevo</button>
    </row>
    {#if creating}
      <box background="surface-secondary" radius="lg" padding={3} gap={2}>
        <label>Nombre del nuevo equipo</label>
        <input placeholder="Nombre del equipo" value={newTeam} onChange={setNewTeam}/>
        <row justify="end" gap={2}>
          <button color="secondary" variant="ghost" onClick={()=>{setCreating(false);setNewTeam("")}}>Cancelar</button>
          <button disabled={!newTeam.trim()} onClick={addTeam}>Crear</button>
        </row>
      </box>
    {/if}
    <input placeholder="Buscar equipo..." value={search} onChange={setSearch}/>
    <box gap={1}>
      {#each filtered as team}
        <pressable key={team.id} onClick={()=>setSelected(team.id)} padding={3} radius="lg" gap={2}>
          <row align="center" gap={3}>
            <box background="surface-secondary" radius="lg" padding={3}>
              <icon name="shield" size="lg"/>
            </box>
            <box flex="1" gap="2px">
              **{team.name}**
              <text color="secondary" size="xs">{team.players.length===0?"Sin jugadores identificados":team.players.length+" jugadores identificados"}</text>
            </box>
            <icon name="chevron-right" color="secondary"/>
          </row>
        </pressable>
        <divider color="subtle"/>
      {/each}
      {#if filtered.length===0}
        <text color="secondary" textAlign="center" size="sm">No hay equipos con ese nombre.</text>
      {/if}
    </box>
    <caption>Equipos de ejemplo. Selecciona uno para ver sus jugadores.</caption>
  {:else}
    <row align="center" gap={2}>
      <button color="secondary" variant="ghost" size="md" onClick={()=>{setSelected(null);setAddingPlayer(false)}}><icon name="arrow-left"/></button>
      <title size="lg">Detalle del equipo</title>
    </row>
    <box gap={1}>
      <label>Nombre del equipo</label>
      <input value={current.name} onChange={v=>setTeams(ts=>ts.map(t=>t.id===selected?{...t,name:v}:t))}/>
    </box>
    <divider color="subtle"/>
    <row justify="between" align="center">
      <title size="md">Jugadores</title>
      <button color="secondary" variant="outline" size="md" onClick={()=>setAddingPlayer(!addingPlayer)}>
        <icon name="plus" inline/> Añadir
      </button>
    </row>
    {#each current.players as player}
      <row key={player.number} align="center" gap={3} padding={{y:1}}>
        <box background="surface-secondary" radius="md" width="48px" height="44px" justify="center" align="center">
          <title size="lg" tabularNums>{player.number}</title>
        </box>
        <box flex="1" gap="1px">
          <input size="md" value={player.name} placeholder="Nombre pendiente" onChange={v=>setTeams(ts=>ts.map(t=>t.id===selected?{...t,players:t.players.map(p=>p.number===player.number?{...p,name:v}:p)}:t))}/>
        </box>
      </row>
    {/each}
    {#if current.players.length===0}
      <box background="surface-secondary" radius="lg" padding={4} align="center" gap={1}>
        <text color="secondary" size="sm">Todavía no hay jugadores identificados.</text>
        <text color="secondary" size="xs" textAlign="center">Se podrán incorporar durante el partido.</text>
      </box>
    {/if}
    {#if addingPlayer}
      <box background="surface-secondary" radius="lg" padding={3} gap={2}>
        <label>Añadir jugador</label>
        <row gap={2}>
          <box width="90px">
            <input placeholder="Dorsal" value={number} onChange={setNumber}/>
          </box>
          <box flex="1">
            <input placeholder="Nombre (opcional)" value={playerName} onChange={setPlayerName}/>
          </box>
        </row>
        <row justify="end" gap={2}>
          <button color="secondary" variant="ghost" onClick={()=>setAddingPlayer(false)}>Cancelar</button>
          <button onClick={addPlayer} disabled={!number.trim()||current.players.some(p=>p.number===number.trim())}>Añadir</button>
        </row>
      </box>
    {/if}
    <caption>El dorsal identifica provisionalmente al jugador. El nombre puede completarse después.</caption>
  {/if}
</box>

### Reglas propuestas

- Un equipo puede existir sin jugadores identificados.
- Los jugadores pueden añadirse manualmente aquí o automáticamente al registrar un dorsal nuevo durante un partido.
- El nombre del jugador es opcional y editable.
- «Desconocido» es un jugador virtual del sistema, no un dorsal de la plantilla.
- Los equipos y sus jugadores se reutilizan entre partidos.

**Una cuestión importante que dejaría para el modelo de datos:** un jugador puede cambiar de dorsal entre partidos. Por tanto, conviene distinguir la identidad del jugador del dorsal que utiliza en cada encuentro, aunque inicialmente solo conozcamos su número.

Por lo demás, no añadiría más elementos a esta pantalla.

## C1.53 user

no contemplamos cambios de dorsal. perfecto. seguimos

## C1.57 assistant

Perfecto. El dorsal queda fijo para cada jugador dentro de su equipo. No contemplamos cambios.

## Partidos

Propongo una lista cronológica con búsqueda. Los partidos en curso aparecen primero. Al seleccionar uno, se abre su detalle.

{@body const [matches,setMatches] = DIL.useState([{id:1,local:"Equipo A",visitor:"Equipo B",date:"2026-10-15",homeGoals:14,awayGoals:12,status:"active"},{id:2,local:"Equipo C",visitor:"Equipo A",date:"2026-10-10",homeGoals:27,awayGoals:29,status:"done"},{id:3,local:"Equipo A",visitor:"Equipo D",date:"2026-10-03",homeGoals:31,awayGoals:31,status:"done"},{id:4,local:"Equipo B",visitor:"Equipo C",date:"2026-09-26",homeGoals:22,awayGoals:25,status:"done"}])}
{@body const [selected,setSelected] = DIL.useState(null)}
{@body const [search,setSearch] = DIL.useState("")}
{@body const [editing,setEditing] = DIL.useState(false)}
{@body const [showEvents,setShowEvents] = DIL.useState(false)}
{@body const [confirmDelete,setConfirmDelete] = DIL.useState(false)}
{@body const match=matches.find(m=>m.id===selected)}
{@body const fmt=d=>new Date(d+"T12:00:00").toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"})}
{@body const update=(field,value)=>setMatches(ms=>ms.map(m=>m.id===selected?{...m,[field]:value}:m))}
{@body const filtered=matches.filter(m=>(m.local+" "+m.visitor).toLowerCase().includes(search.toLowerCase()))}
<box border radius="2xl" padding={3} gap={3} maxWidth="440px">
  {#if !match}
    <row align="center" justify="between">
      <title size="xl">Partidos</title>
      <icon name="calendar-days" color="secondary" size="lg"/>
    </row>
    <input placeholder="Buscar equipo..." value={search} onChange={setSearch}/>
    {#if filtered.some(m=>m.status==="active")}
      <text color="secondary" weight="medium" size="xs">EN CURSO</text>
      {#each filtered.filter(m=>m.status==="active") as m}
        <pressable key={m.id} border radius="xl" padding={3} gap={2} onClick={()=>{setSelected(m.id);setEditing(false);setShowEvents(false)}}>
          <row align="center" justify="between">
            <text size="xs" color="secondary">{fmt(m.date)}</text>
            <badge color="success">En curso</badge>
          </row>
          <row align="center" gap={2} justify="between">
            <box flex="1" gap={1}>
              <text weight="medium">{m.local}</text>
              <text weight="medium">{m.visitor}</text>
            </box>
            <box gap={1} align="end">
              <title size="lg" tabularNums>{m.homeGoals}</title>
              <title size="lg" tabularNums>{m.awayGoals}</title>
            </box>
            <icon name="chevron-right" color="secondary"/>
          </row>
        </pressable>
      {/each}
    {/if}
    <text color="secondary" weight="medium" size="xs">HISTÓRICO</text>
    {#each filtered.filter(m=>m.status==="done") as m}
      <pressable key={m.id} onClick={()=>{setSelected(m.id);setEditing(false);setShowEvents(false)}} border radius="lg" padding={3} gap={2}>
        <text size="xs" color="secondary">{fmt(m.date)}</text>
        <row align="center" gap={2}>
          <box flex="1" gap={1}>
            <text weight="medium">{m.local}</text>
            <text weight="medium">{m.visitor}</text>
          </box>
          <box gap={1} align="end">
            <text weight="medium" tabularNums>{m.homeGoals}</text>
            <text weight="medium" tabularNums>{m.awayGoals}</text>
          </box>
          <icon name="chevron-right" color="secondary"/>
        </row>
      </pressable>
    {/each}
    {#if filtered.length===0}
      <text color="secondary" size="sm" textAlign="center">No se encontraron partidos.</text>
    {/if}
    <caption>Datos de ejemplo. Selecciona un partido para abrirlo.</caption>
  {:else}
    <row align="center" gap={2}>
      <button color="secondary" variant="ghost" size="md" onClick={()=>{setSelected(null);setEditing(false);setShowEvents(false);setConfirmDelete(false)}}><icon name="arrow-left"/></button>
      <title size="lg">Detalle del partido</title>
      <spacer/>
      <button color="secondary" variant="outline" size="md" onClick={()=>setEditing(!editing)}><icon name="pencil" inline/> {editing?"Cerrar":"Editar"}</button>
    </row>
    {#if editing}
      <box gap={2}>
        <label>Equipo local</label>
        <input value={match.local} onChange={v=>update("local",v)}/>
        <label>Equipo visitante</label>
        <input value={match.visitor} onChange={v=>update("visitor",v)}/>
        <label>Fecha</label>
        <date-picker block value={match.date} onChange={v=>update("date",v)}/>
        <caption>Edición simplificada para el prototipo; en la aplicación se conservará la identidad de los equipos del catálogo.</caption>
      </box>
    {:else}
      <text color="secondary" size="sm" textAlign="center">{fmt(match.date)}</text>
      <grid columns={3} gap={2}>
        <grid-item>
          <box height="80px" justify="center" align="center">
            <text textAlign="center" weight="medium">{match.local}</text>
          </box>
        </grid-item>
        <grid-item>
          <box height="80px" justify="center" align="center">
            <title size="2xl" tabularNums>{match.homeGoals} : {match.awayGoals}</title>
          </box>
        </grid-item>
        <grid-item>
          <box height="80px" justify="center" align="center">
            <text textAlign="center" weight="medium">{match.visitor}</text>
          </box>
        </grid-item>
      </grid>
    {/if}
    <row justify="center">
      <badge color={match.status==="active"?"success":"secondary"}>{match.status==="active"?"En curso":"Finalizado"}</badge>
    </row>
    <divider color="subtle"/>
    {#if match.status==="active"}
      <button block onClick={()=>setShowEvents(!showEvents)}>Continuar partido <icon name="arrow-right" inline/></button>
    {:else}
      <button block onClick={()=>setShowEvents(!showEvents)}><icon name="list" inline/> {showEvents?"Ocultar eventos":"Ver / editar eventos"}</button>
    {/if}
    {#if showEvents}
      <box background="surface-secondary" padding={3} radius="lg" gap={2}>
        <text weight="medium" size="sm">Registro de eventos</text>
        <text size="sm" color="secondary">Aquí se abriría la pantalla de registro y edición que ya diseñamos, con los eventos de este partido.</text>
      </box>
    {/if}
    <button block variant="outline" color="secondary" onClick={()=>GenUI.issueNewTurn("Diseñemos las estadísticas de un partido: "+match.local+" contra "+match.visitor+". Mantén el diseño sencillo.")}>
      <icon name="chart-column" inline/> Estadísticas del partido
    </button>
    <divider color="subtle"/>
    {#if confirmDelete}
      <text weight="medium" size="sm">¿Eliminar definitivamente este partido y sus eventos?</text>
      <row gap={2}>
        <button block color="secondary" variant="outline" onClick={()=>setConfirmDelete(false)}>Cancelar</button>
        <button block color="danger" onClick={()=>{setMatches(ms=>ms.filter(m=>m.id!==selected));setSelected(null);setConfirmDelete(false)}}>Confirmar eliminación</button>
      </row>
    {:else}
      <row justify="center">
        <button color="danger" variant="ghost" size="sm" onClick={()=>setConfirmDelete(true)}><icon name="trash-2" inline/> Eliminar partido</button>
      </row>
    {/if}
  {/if}
</box>

### Comportamiento

- **En curso:** permite continuar el registro donde se dejó.
- **Finalizado:** permite consultar y corregir eventos, incluso añadir los que faltasen.
- **Editar:** cambia fecha o equipos.
- **Marcador:** se calcula a partir de los goles registrados, nunca se edita directamente.
- **Eliminar:** requiere confirmación.

No añadiría filtros avanzados, competiciones ni otras opciones de momento.

Si te encaja, pasamos a **Estadísticas**, que será la última caja de la pantalla principal.

## C1.58 user

perfecto seguimos. KISS

## C1.62 assistant

## Estadísticas

Una sola pantalla: seleccionar **equipo**, **partido** (o todos) y consultar estadísticas de equipo o jugadores.

{@body const [team,setTeam] = DIL.useState("a")}
{@body const [match,setMatch] = DIL.useState("all")}
{@body const [view,setView] = DIL.useState("team")}
{@body const [selectedPlayer,setSelectedPlayer] = DIL.useState(null)}
{@body const records = [{id:"m1",team:"a",label:"15/10 · Equipo A - Equipo B",pasivo:1,players:[{n:"7",g:5,f:3,l:1,r:2,xf:1},{n:"12",g:2,f:2,s:6},{n:"23",g:6,f:3,l:1,r:1,e:1},{n:"?",g:1,f:1}]},{id:"m2",team:"a",label:"10/10 · Equipo C - Equipo A",pasivo:1,players:[{n:"7",g:10,f:4,l:3,r:2,xf:1},{n:"12",g:7,f:5,s:8},{n:"23",g:9,f:6,l:2,r:1,e:1},{n:"?",g:3,f:2}]},{id:"m1",team:"b",label:"15/10 · Equipo A - Equipo B",pasivo:0,players:[{n:"5",g:5,f:4,l:1,r:1},{n:"9",g:4,f:4,l:2,s:4},{n:"?",g:3,f:1}]},{id:"m3",team:"b",label:"26/09 · Equipo B - Equipo C",pasivo:1,players:[{n:"5",g:10,f:4,l:2,r:2,xf:1},{n:"9",g:10,f:5,s:7,e:1},{n:"?",g:2,f:1}]}]}
{@body const available=records.filter(r=>r.team===team)}
{@body const chosen=available.filter(r=>match==="all"||r.id===match)}
{@body const stats=["g","f","l","r","s","e","xf","i"]}
{@body const players=[...new Set(chosen.flatMap(r=>r.players.map(p=>p.n)))].map(n=>{const entries=chosen.flatMap(r=>r.players).filter(p=>p.n===n);return {n,...Object.fromEntries(stats.map(k=>[k,entries.reduce((acc,p)=>acc+(p[k]||0),0)]))}}).sort((a,b)=>a.n==="?"?1:b.n==="?"?-1:Number(a.n)-Number(b.n))}
{@body const totals=Object.fromEntries(stats.map(k=>[k,players.reduce((acc,p)=>acc+p[k],0)]))}
{@body const pasivo=chosen.reduce((a,r)=>a+r.pasivo,0)}
{@body const pct=(g,f)=>g+f?Math.round(g/(g+f)*100)+" %":"—"}
{@body const player=players.find(p=>p.n===selectedPlayer)}
<box border radius="2xl" padding={3} gap={3} maxWidth="450px">
  <row align="center" gap={2}>
    <icon name="arrow-left" color="secondary"/>
    <title size="xl">Estadísticas</title>
  </row>
  <box gap={1}>
    <label>Equipo</label>
    <select block value={team} onChange={v=>{setTeam(v);setMatch("all");setSelectedPlayer(null)}} options={[{value:"a",label:"Equipo A"},{value:"b",label:"Equipo B"}]}/>
  </box>
  <box gap={1}>
    <label>Partido</label>
    <select block value={match} onChange={v=>{setMatch(v);setSelectedPlayer(null)}} options={[{value:"all",label:"Todos los partidos"},...available.map(r=>({value:r.id,label:r.label}))]}/>
  </box>
  <segmented-control block size="lg" value={view} onChange={v=>{setView(v);setSelectedPlayer(null)}} options={[{label:"Equipo",value:"team"},{label:"Jugadores",value:"players"}]}/>
  {#if view==="team"}
    <grid columns={2} gap={2}>
      {#each [{label:"Goles",value:totals.g},{label:"Lanzamientos fallados",value:totals.f},{label:"Eficacia de tiro",value:pct(totals.g,totals.f)},{label:"Paradas",value:totals.s}] as item}
        <grid-item>
          <box background="surface-secondary" radius="lg" padding={3} gap={2}>
            <text color="secondary" size="xs">{item.label}</text>
            <title size="2xl" tabularNums>{item.value}</title>
          </box>
        </grid-item>
      {/each}
    </grid>
    <box border radius="lg" padding={3} gap={2}>
      {#each [{label:"Pérdidas",v:totals.l},{label:"Recuperaciones",v:totals.r},{label:"Exclusiones (2 min)",v:totals.e},{label:"Infracciones",v:totals.i},{label:"Pasivos",v:pasivo}] as item,i}
        <row justify="between" align="center">
          <text size="sm">{item.label}</text>
          <text weight="medium" tabularNums>{item.v}</text>
        </row>
        {#if i!==4}<divider color="subtle"/>{/if}
      {/each}
    </box>
  {:else}
    {#if player}
      <row align="center" gap={2}>
        <button color="secondary" variant="ghost" onClick={()=>setSelectedPlayer(null)} size="sm"><icon name="arrow-left"/></button>
        <title size="lg">{player.n==="?"?"Desconocido":"Jugador #"+player.n}</title>
      </row>
      <grid columns={3} gap={2}>
        {#each [{label:"Goles",v:player.g},{label:"Fallados",v:player.f},{label:"Eficacia",v:pct(player.g,player.f)}] as item}
          <grid-item>
            <box background="surface-secondary" padding={2} radius="lg" align="center" gap={1}>
              <title size="lg" tabularNums>{item.v}</title>
              <text color="secondary" size="2xs">{item.label}</text>
            </box>
          </grid-item>
        {/each}
      </grid>
      <box border radius="lg" padding={3} gap={3}>
        {#each [{label:"Pérdidas",v:player.l},{label:"Recuperaciones",v:player.r},{label:"Paradas",v:player.s},{label:"Exclusiones (2 min)",v:player.e},{label:"Exclusiones forzadas",v:player.xf},{label:"Infracciones",v:player.i}] as item,i}
          <row align="center" justify="between">
            <text size="sm">{item.label}</text>
            **{item.v}**
          </row>
          {#if i!==5}<divider color="subtle"/>{/if}
        {/each}
      </box>
    {:else}
      <row align="center" justify="between" padding={{x:2,y:1}}>
        <text color="secondary" size="xs">Jugador</text>
        <row gap={3}>
          <box width="45px"><text textAlign="end" color="secondary" size="xs">Goles</text></box>
          <box width="45px"><text textAlign="end" color="secondary" size="xs">Fallados</text></box>
        </row>
      </row>
      {#each players as p}
        <pressable key={p.n} border radius="lg" padding={3} onClick={()=>setSelectedPlayer(p.n)}>
          <row align="center" gap={2}>
            <box background="surface-secondary" radius="md" width="40px" height="40px" align="center" justify="center">
              **{p.n==="?"?"?":p.n}**
            </box>
            <box flex="1">
              <text size="sm" weight="medium">{p.n==="?"?"Desconocido":"Jugador #"+p.n}</text>
            </box>
            <box width="45px"><text textAlign="end" tabularNums>{p.g}</text></box>
            <box width="45px"><text textAlign="end" tabularNums>{p.f}</text></box>
            <icon name="chevron-right" size="sm" color="secondary"/>
          </row>
        </pressable>
      {/each}
    {/if}
  {/if}
  <caption>Datos de ejemplo. La eficacia se calcula exclusivamente con los lanzamientos registrados.</caption>
</box>

### Criterios

- Las estadísticas de equipo son acumuladas o de un partido concreto.
- Las individuales se consultan pulsando un jugador.
- «Desconocido» aparece como un jugador más.
- Las **exclusiones forzadas** son exclusivamente una estadística individual.
- No hay gráficos, comparativas ni filtros adicionales por ahora.

Mantendría esta primera versión. Con esto quedan definidas las cuatro secciones principales de la aplicación.

## C1.63 user

perfecto

## C1.66 assistant

Queda cerrado el diseño funcional inicial de **Handball Stats**:

- Nuevo partido
- Equipos
- Partidos (histórico y edición)
- Estadísticas
- Registro de eventos, definido anteriormente

Mantenemos **KISS** como criterio: registro rápido, datos mínimos obligatorios y posibilidad de completar la información posteriormente.

El siguiente paso natural es concretar el modelo de datos y pasar a la implementación.