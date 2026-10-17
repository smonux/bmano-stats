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

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      recorder.current?.cancel();
      if (inferenceRunning.current) {
        void discardVoiceEngine();
      }
    };
  }, []);
  useEffect(() => {
    if (setup.phase === 'cached') {
      void prepareVoice(false);
    }
  }, [setup.phase]);
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
    inferenceRunning.current = true;
    setPhase('transcribing');
    setStatus(tr('Whistle está transcribiendo…'));
    try {
      const audio = await recorder.current.stop();
      recorder.current = null;
      if (!mounted.current) {
        return;
      }
      const recognized = await recognizeCapture(audio, capturedMatch.current!, setup.language, {
        isActive: () => mounted.current,
        onInterpreting: () => {
          setPhase('interpreting');
          setStatus(tr('Aplicando reglas de evento y participantes…'));
        },
        onError: (error) => setError(voiceError(error)),
      });
      if (mounted.current && recognized) {
        setResult(recognized);
        setPhase('review');
      }
    } catch (error) {
      await discardVoiceEngine();
      if (mounted.current) {
        setError(voiceError(error));
        setPhase('ready');
      }
    } finally {
      operationLocked.current = false;
      inferenceRunning.current = false;
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
      if (!mounted.current) {
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
      if (mounted.current) {
        setError(voiceError(error));
        setPhase('ready');
      }
      recorder.current = null;
    } finally {
      operationLocked.current = false;
    }
  }

  function release() {
    buttonHeld.current = false;
    if (phase === 'recording') {
      void stop();
    }
  }
  function cancelRecording() {
    if (!['recording', 'permission'].includes(phase)) {
      return;
    }
    buttonHeld.current = false;
    recorder.current?.cancel();
    recorder.current = null;
    setPhase('ready');
  }
  function closeReview() {
    setResult(null);
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
    cancelRecording,
    closeReview,
    ready: setup.phase === 'ready',
    problem: microphoneProblem(),
  };
}
