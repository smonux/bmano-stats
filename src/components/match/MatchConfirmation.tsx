import type { GameEvent, Match } from '../../domain/schema';
import { repo } from '../../data/database';
import { tr } from '../../i18n';
import { Confirm, navigate } from '../ui';

export type MatchConfirmationIntent = 'period' | 'finish' | 'delete' | GameEvent;
export function MatchConfirmation({
  intent,
  match,
  close,
}: {
  intent: MatchConfirmationIntent;
  match: Match;
  close: () => void;
}) {
  function description() {
    switch (intent) {
      case 'period':
        return {
          title: tr('Iniciar tiempo {number}', { number: match.clock.period + 1 }),
          text: tr(
            'El minuto vuelve a cero y comienza el siguiente tiempo. Los eventos anteriores se conservan.',
          ),
        };
      case 'finish':
        return {
          title: tr('Finalizar partido'),
          text: tr('Se detendrá el reloj. Podrás seguir corrigiendo los eventos del partido.'),
        };
      case 'delete':
        return {
          title: tr('Eliminar partido'),
          text: tr('El partido y sus eventos dejarán de aparecer y de contar en las estadísticas.'),
        };
      default:
        return {
          title: tr('Eliminar evento'),
          text: tr('Se retirarán todas las estadísticas derivadas de esta acción.'),
        };
    }
  }
  async function confirm() {
    if (typeof intent === 'object') await repo.deleteEvent(intent.id);
    else if (intent === 'delete') {
      await repo.deleteMatch(match.id);
      navigate('/partidos');
    } else await repo.clock(match.id, intent);
  }
  return (
    <Confirm
      {...description()}
      danger={intent === 'delete' || typeof intent === 'object'}
      close={close}
      confirm={confirm}
    />
  );
}
