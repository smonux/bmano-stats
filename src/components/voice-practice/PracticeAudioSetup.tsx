import { tr } from '../../i18n';
import { VoicePreparation } from '../VoicePreparation';

export function PracticeAudioSetup({ live }: { live: boolean }) {
  return (
    <section className="practice-audio-setup" aria-labelledby="practice-audio-title">
      <h1 id="practice-audio-title" tabIndex={-1}>
        {tr('Configura el audio de la práctica')}
      </h1>
      <p>
        {tr(
          'Elige el idioma, carga el reconocimiento y comprueba el micrófono. También puedes practicar manualmente.',
        )}
      </p>
      {live && (
        <p className="practice-notice">
          {tr(
            'Hay un partido en curso. Puedes usar la voz local preparada o practicar manualmente.',
          )}
        </p>
      )}
      <VoicePreparation live={live} practiceEntry="none" title="Idioma y reconocimiento de voz" />
    </section>
  );
}
