import { Mic, NotebookPen, ShieldCheck, Timer, Users, type LucideIcon } from 'lucide-react';
import type { WelcomeIllustration } from './Illustration';

type WelcomeSlide = {
  title: string;
  body: string;
  icon: LucideIcon;
  illustration: WelcomeIllustration;
  grammar?: string;
  examples?: { spoken: string; meaning: string; language?: 'es' }[];
};

export const slides: WelcomeSlide[] = [
  {
    title: 'Mira el partido. Cuenta la jugada.',
    body: 'Dos equipos y una fecha bastan. Añade dorsales al registrar y completa los nombres después. Amarillo y negro en homenaje al Balonmano La Jota de Zaragoza.',
    icon: Users,
    illustration: 'score',
  },
  {
    title: 'Prepara la voz antes del pitido',
    body: 'Elige tu idioma, descarga los modelos con conexión y permite el micrófono. Después, el audio se procesa en este dispositivo. Prueba una jugada antes de empezar.',
    icon: ShieldCheck,
    illustration: 'recognition',
  },
  {
    title: 'Pulsa, habla, revisa y guarda',
    body: 'Mantén pulsado para hablar y suelta para terminar. Di una jugada en este orden, sin dejar huecos. Usa dorsales del 0 al 99 o nombres de la plantilla; di solo los jugadores que correspondan. Revisa la propuesta: pulsa Guardar evento para registrarla o Editar para corregirla.',
    grammar: 'Evento → equipo → jugador 1 → jugador 2 → metadatos',
    examples: [
      {
        spoken: 'Gol nuestro siete uno penalti',
        meaning: 'Gol del #7, asistencia del #1, de penalti. Equipo 1.',
      },
      { spoken: 'Cambio nuestro siete nueve', meaning: 'Sale el #7 y entra el #9 del equipo 1.' },
    ],
    icon: Mic,
    illustration: 'play',
  },
  {
    title: 'Tu perspectiva manda',
    body: 'Nosotros y nuestro siempre son equipo 1. Ellos, rival y suyo son equipo 2. Si no dices equipo, se usa el 1; si mencionas ambos, se usa el primero. Los jugadores se asignan en orden de aparición. En goles: goleador y asistente; en cambios: sale y entra.',
    icon: Users,
    illustration: 'perspective',
  },
  {
    title: 'También puedes dictar una nota',
    body: 'En español, empieza por «Nota» o «Comentario»: basta con que la primera palabra empiece por «not» o «coment». El resto es texto libre, aunque mencione jugadas. Se guarda con tiempo y minuto, sin equipo ni estadísticas.',
    examples: [
      {
        spoken:
          'Nota: El árbitro está advirtiendo a Sara de posible exclusión, tengo que recordarle que no se dirija a él',
        meaning: 'Recordatorio del partido. No registra una exclusión.',
        language: 'es',
      },
      {
        spoken: 'Comentario: buen movimiento de balón',
        meaning: 'Una observación para revisar después.',
        language: 'es',
      },
    ],
    icon: NotebookPen,
    illustration: 'note',
  },
  {
    title: 'Controla los dos minutos',
    body: 'Tres contadores con equipo y dorsal. Actívalos al comenzar la exclusión; siguen el reloj del partido y puedes pararlos por separado. Al llegar a cero, avisan de la reincorporación. El evento estadístico se registra aparte.',
    icon: Timer,
    illustration: 'timers',
  },
];
