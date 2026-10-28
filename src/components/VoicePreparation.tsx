import { useEffect } from 'react';
import { useMicrophoneCheck } from './voice/useMicrophoneCheck';
import { Check, Download, Mic } from 'lucide-react';
import { languages, tr, type Language } from '../i18n';
import { nativeBundle } from '../native/platform';
import {
  chooseVoiceLanguage,
  prepareVoice,
  refreshVoiceFiles,
  useVoiceSetup,
} from '../voice/setup';
import { microphoneProblem } from '../voice/readiness';
import { ErrorMessage } from './ui';
import { WheelPicker } from './WheelPicker';
import { VoicePracticeEntry } from './voice-practice/VoicePracticeEntry';
export function VoicePreparation({
  live = false,
  practiceEntry = 'first',
}: {
  live?: boolean;
  practiceEntry?: 'first' | 'always' | 'none';
}) {
  const setup = useVoiceSetup();
  const { mic, error, testMic } = useMicrophoneCheck();
  useEffect(() => {
    void refreshVoiceFiles();
  }, []);
  const problem = microphoneProblem();
  const missing = ['missing', 'error'].includes(setup.phase);

  return (
    <section className="voice-preparation" aria-label={tr('Preparación de voz')}>
      <div className="section-heading">
        <h2>{tr('Prepara la voz antes del partido')}</h2>
        {setup.phase === 'ready' && (
          <span className="badge live">
            <Check size={12} /> {tr('Reconocimiento listo')}
          </span>
        )}
      </div>
      {practiceEntry !== 'none' && <VoicePracticeEntry always={practiceEntry === 'always'} />}
      {missing && (
        <p role="alert" className="preparation-alert">
          {tr(
            'El reconocimiento de voz no está preparado. Elige el idioma y cárgalo para usar voz.',
          )}
        </p>
      )}
      {setup.phase === 'cached' && (
        <p className="caption">
          {tr('Los archivos están en este dispositivo. Carga el reconocimiento antes del partido.')}
        </p>
      )}
      <WheelPicker<Language | ''>
        label={tr('Idioma de voz')}
        value={setup.languageChosen ? setup.language : ''}
        disabled={setup.phase === 'loading' || live}
        options={[
          { value: '', label: tr('Elige el idioma de voz'), disabled: true },
          ...(Object.keys(languages) as Language[]).map((code) => ({
            value: code,
            label: languages[code],
          })),
        ]}
        change={(language) => {
          if (language) {
            void chooseVoiceLanguage(language);
          }
        }}
      />
      <p className="caption">
        {tr(
          'Di: evento, equipo, jugador 1, jugador 2 y metadatos. Sin equipo, se usa el equipo 1. En cambios: primero sale y después entra.',
        )}
      </p>
      {setup.phase === 'loading' ? (
        <p role="status">
          {tr('Preparando reconocimiento…')} {setup.progress}
        </p>
      ) : (
        setup.phase !== 'ready' && (
          <button
            type="button"
            className="primary"
            disabled={
              !setup.languageChosen || setup.phase === 'checking' || Boolean(problem) || live
            }
            onClick={() => void prepareVoice(true)}
          >
            <Download size={16} />
            {tr('Cargar reconocimiento de voz')}
          </button>
        )
      )}
      <button
        type="button"
        disabled={mic === 'asking' || Boolean(problem)}
        onClick={() => void testMic()}
      >
        <Mic size={16} />
        {tr(
          mic === 'asking'
            ? 'Solicitando permiso…'
            : mic === 'ok'
              ? 'Micrófono comprobado'
              : 'Comprobar micrófono',
        )}
      </button>
      {mic === 'ok' && (
        <p className="caption" role="status">
          {tr(
            'Permiso concedido. El micrófono se ha cerrado; solo se abrirá mientras mantengas pulsado para hablar.',
          )}
        </p>
      )}
      {problem && (
        <p role="alert" className="error">
          {tr(problem)}
        </p>
      )}
      <ErrorMessage text={error || setup.error} />
      <p className="caption">
        {tr(
          nativeBundle
            ? 'Los archivos de voz vienen incluidos. Elige el idioma y carga la voz; no necesitas descargarlos.'
            : 'La descarga necesita conexión una vez. La voz funciona con los modelos locales; mantén pulsado para hablar y suelta para terminar.',
        )}
      </p>
    </section>
  );
}
