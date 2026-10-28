import { useEffect, useRef, useState } from 'react';
import type { Match, Snapshot } from '../../domain/schema';
import { tr } from '../../i18n';
import { VoiceRecorder } from '../../voice/recorder';
import { microphoneProblem } from '../../voice/readiness';
import { voiceError } from '../../voice/engine';
import { useVoiceSetup, prepareVoice, discardVoiceEngine } from '../../voice/setup';
import { captureContext, type CaptureContext } from '../../voice/interpretation';
import { recognizeCapture, type RecognizedEvent } from '../../voice/recognition';

export type CapturePhase =
  'ready' | 'permission' | 'recording' | 'transcribing' | 'interpreting' | 'review';

/** Owns microphone lifetime and review state; presentation never opens the microphone itself. */
export function useVoiceCapture(match: Match, data: Snapshot) {
  const setup = useVoiceSetup();
  const [phase, setPhase] = useState<CapturePhase>('ready');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<RecognizedEvent | null>(null);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<VoiceRecorder | null>(null);
  const mounted = useRef(true);
  const operationLocked = useRef(false);
  const buttonHeld = useRef(false);
  const inferenceRunning = useRef(false);
  const capturedMatch = useRef<CaptureContext | null>(null);
  const onRecordingLimit = useRef<() => void>(() => {});
  const generation = useRef(0);
  useEffect(() => {
    window.addEventListener('handball:inactive', cancel);
    return () => window.removeEventListener('handball:inactive', cancel);
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current++;
      recorder.current?.cancel();
      if (inferenceRunning.current) {
        void discardVoiceEngine();
      }
    };
  }, []);
  useEffect(() => {
    if (setup.phase === 'cached' && setup.languageChosen) {
      void prepareVoice(false);
    }
  }, [setup.phase, setup.languageChosen]);
  useEffect(() => {
    if (phase !== 'recording') {
      return;
    }
    const startedAt = Date.now();
    const timer = setInterval(
      () => setSeconds(Math.min(20, Math.floor((Date.now() - startedAt) / 1000))),
      200,
    );
    return () => clearInterval(timer);
  }, [phase]);

  async function stop() {
    if (!recorder.current || operationLocked.current) {
      return;
    }
    operationLocked.current = true;
    const operation = generation.current;
    const active = () => mounted.current && operation === generation.current;
    inferenceRunning.current = true;
    setPhase('transcribing');
    setStatus(tr('Whistle está transcribiendo…'));
    try {
      const recording = recorder.current;
      const audio = await recording.stop();
      if (recorder.current === recording) recorder.current = null;
      if (!active()) {
        return;
      }
      const recognized = await recognizeCapture(audio, capturedMatch.current!, setup.language, {
        isActive: active,
        onInterpreting: () => {
          if (active()) {
            setPhase('interpreting');
            setStatus(tr('Interpretando el comando de voz…'));
          }
        },
        onError: (error) => {
          if (active()) setError(voiceError(error));
        },
      });
      if (active() && recognized) {
        setResult(recognized);
        setPhase('review');
      }
    } catch (error) {
      if (active()) {
        await discardVoiceEngine();
      }
      if (active()) {
        setError(voiceError(error));
        setPhase('ready');
      }
    } finally {
      if (operation === generation.current) {
        operationLocked.current = false;
        inferenceRunning.current = false;
      }
    }
  }
  onRecordingLimit.current = () => {
    buttonHeld.current = false;
    void stop();
  };

  async function start() {
    if (operationLocked.current || phase !== 'ready' || setup.phase !== 'ready') {
      return;
    }
    buttonHeld.current = true;
    const operation = ++generation.current;
    operationLocked.current = true;
    setError('');
    setResult(null);
    setSeconds(0);
    setPhase('permission');
    capturedMatch.current = captureContext(match, data);
    const recording = new VoiceRecorder();
    recorder.current = recording;
    try {
      const started = await recording.start(() => onRecordingLimit.current());
      if (!mounted.current || operation !== generation.current) {
        recording.cancel();
        return;
      }
      operationLocked.current = false;
      if (started) {
        setPhase('recording');
        if (!buttonHeld.current) {
          await stop();
        }
      } else {
        setPhase('ready');
      }
    } catch (error) {
      if (mounted.current && operation === generation.current) {
        setError(voiceError(error));
        setPhase('ready');
      }
      if (operation === generation.current) recorder.current = null;
    } finally {
      if (operation === generation.current) operationLocked.current = false;
    }
  }

  function release() {
    buttonHeld.current = false;
    if (phase === 'recording') {
      void stop();
    }
  }
  function closeReview() {
    setResult(null);
    setPhase('ready');
  }

  function cancel() {
    generation.current++;
    buttonHeld.current = false;
    recorder.current?.cancel();
    recorder.current = null;
    if (inferenceRunning.current) void discardVoiceEngine();
    inferenceRunning.current = false;
    operationLocked.current = false;
    setResult(null);
    setError('');
    setStatus('');
    setPhase('ready');
  }

  return {
    setup,
    phase,
    status,
    error,
    result,
    seconds,
    start,
    release,
    closeReview,
    cancel,
    ready: setup.phase === 'ready',
    problem: microphoneProblem(),
  };
}
