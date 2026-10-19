import { Mic, ShieldCheck, Timer, Users } from 'lucide-react';

export const slides = [
  {
    title: 'Mira el partido. Cuenta la jugada.',
    body: 'Dos equipos y una fecha bastan. Añade dorsales al registrar y completa los nombres después. Amarillo y negro en homenaje al Balonmano La Jota de Zaragoza.',
    icon: Users,
  },
  {
    title: 'Prepara la voz antes del pitido',
    body: 'Elige tu idioma, descarga los modelos con conexión y permite el micrófono. Después, el audio se procesa en este dispositivo. Prueba una jugada antes de empezar.',
    icon: ShieldCheck,
  },
  {
    title: 'Pulsa, habla, revisa y guarda',
    body: 'Una jugada por grabación: evento, equipo, jugador 1, jugador 2 y metadatos. Mantén pulsado para hablar y suelta para terminar. Whistle transcribe y las reglas proponen los datos; tú revisas y guardas.',
    icon: Mic,
  },
  {
    title: 'Tu perspectiva manda',
    body: 'Nosotros y nuestro siempre son equipo 1. Ellos, rival y suyo son equipo 2. No cambia por jugar en casa o fuera. Di el dorsal y revisa las propuestas dudosas.',
    icon: Users,
  },
  {
    title: 'Controla los dos minutos',
    body: 'Tres contadores con equipo y dorsal. Actívalos al comenzar la exclusión; siguen el reloj del partido y puedes pararlos por separado. Al llegar a cero, avisan de la reincorporación. El evento estadístico se registra aparte.',
    icon: Timer,
  },
];
