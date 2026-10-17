import { useEffect, useRef, useState } from 'react';
import { checkMicrophone } from '../../voice/readiness';
import { voiceError } from '../../voice/engine';
export function useMicrophoneCheck() {
  const [mic, setMic] = useState<'idle' | 'asking' | 'ok'>('idle');
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const testMic = async () => {
    if (mic === 'asking') {
      return;
    }
    setMic('asking');
    setError('');
    try {
      await checkMicrophone();
      if (mounted.current) {
        setMic('ok');
      }
    } catch (error) {
      if (mounted.current) {
        setMic('idle');
        setError(voiceError(error));
      }
    }
  };
  return {
    mic,
    error,
    testMic,
  };
}
