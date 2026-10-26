import { reportFixture } from './report';
import { eventTypes } from '../../src/domain/event-definitions';
import type { GameEvent } from '../../src/domain/schema';
import { nameKey } from '../../src/domain/identity';

/** Isolated fixture data; never imported by the application. */
export function eventFeedFixture(longNames = false) {
  const data = reportFixture();
  data.teams[0].name = longNames
    ? 'Club Aurora de Balonmano '.repeat(5).slice(0, 100).trim()
    : 'Club Aurora';
  data.teams[1].name = longNames ? 'ClubHorizonte'.repeat(8).slice(0, 100) : 'Club Horizonte';
  for (const team of data.teams) team.nameKey = nameKey(team.name);
  data.players.push({
    ...data.players.find((player) => player.id === 'b9')!,
    id: 'b0',
    dorsal: 0,
    name: '',
  });
  const template = data.events[0];
  data.events = eventTypes.map((type, index): GameEvent => {
    const teamId = type === 'note' ? null : index % 2 ? 'b' : 'a';
    return {
      ...template,
      id: 'feed-' + type,
      type,
      teamId,
      primaryPlayerId: type === 'note' || type === 'passive' ? null : teamId === 'a' ? 'a7' : 'b9',
      relatedPlayerId: type === 'substitution' ? 'b0' : type === 'goal' ? 'a1' : null,
      period: 1 + (index % 2),
      minute: index,
      orderKey: index,
      metadata:
        type === 'goal'
          ? { penalty: true }
          : type === 'infraction'
            ? { infraction: 'Pasos' }
            : type === 'disqualification'
              ? { blue: true }
              : {},
      note: type === 'note' ? 'Recordatorio del descanso.\n' + 'TextoLargo'.repeat(100) : '',
      rawText: type === 'note' ? 'Comentario original.\n' + 'TranscripciónLarga'.repeat(100) : '',
    };
  });
  const pending: GameEvent = {
    ...template,
    id: 'missing-event',
    type: null,
    teamId: 'a',
    primaryPlayerId: null,
    relatedPlayerId: null,
    metadata: {},
    orderKey: 20,
    note: '',
    rawText: '',
  };
  data.events.push(
    pending,
    { ...pending, id: 'missing-team', type: 'goal', teamId: null, orderKey: 21 },
    {
      ...pending,
      id: 'missing-infraction',
      type: 'infraction',
      teamId: 'b',
      primaryPlayerId: 'b9',
      orderKey: 22,
    },
    {
      ...pending,
      id: 'invalid-change',
      type: 'substitution',
      primaryPlayerId: 'a7',
      relatedPlayerId: 'a7',
      orderKey: 23,
    },
    { ...pending, id: 'missing-note', type: 'note', teamId: null, orderKey: 24 },
    {
      ...pending,
      id: 'unidentified-player',
      type: 'goal',
      primaryPlayerId: 'unknown:a',
      orderKey: 25,
    },
    {
      ...pending,
      id: 'unidentified-incoming',
      type: 'substitution',
      teamId: 'b',
      primaryPlayerId: 'b9',
      relatedPlayerId: 'unknown:b',
      orderKey: 26,
    },
  );
  return data;
}
