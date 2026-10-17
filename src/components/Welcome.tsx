import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { tr } from '../i18n';
import { Modal } from './ui';
import { LanguagePicker } from './welcome/LanguagePicker';
import { slides } from './welcome/slides';
import { Illustration } from './welcome/Illustration';
export { LanguagePicker } from './welcome/LanguagePicker';
export function hasSeenWelcome() {
  try {
    return localStorage.getItem('handball-welcome-v1') === 'done';
  } catch {
    return false;
  }
}
export function Welcome({ close }: { close: () => void }) {
  const [step, setStep] = useState(0);
  const slide = slides[step];
  const finish = () => {
    try {
      localStorage.setItem('handball-welcome-v1', 'done');
    } catch {}
    close();
  };
  return (
    <Modal title={tr('Guía de pista')} close={finish}>
      <div className="welcome">
        <LanguagePicker />
        <div className="welcome-visual" aria-hidden="true">
          <slide.icon size={44} />
          <Illustration step={step} />
        </div>
        <div className="welcome-copy" aria-live="polite">
          <span className="eyebrow">
            {step + 1} / {slides.length}
          </span>
          <h3>{tr(slide.title)}</h3>
          <p>{tr(slide.body)}</p>
        </div>
        <div className="welcome-dots">
          {slides.map((slide, index) => (
            <button
              key={index}
              type="button"
              aria-label={tr(slide.title)}
              aria-current={step === index ? 'step' : undefined}
              onClick={() => setStep(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <div className="actions">
          <button onClick={() => setStep(step - 1)} disabled={step === 0}>
            {tr('Anterior')}
          </button>
          <button
            className="primary"
            onClick={() => (step === slides.length - 1 ? finish() : setStep(step + 1))}
          >
            {tr(step === slides.length - 1 ? 'Empezar' : 'Siguiente')}
            <ArrowRight size={16} />
          </button>
        </div>
        <button className="text-button full" onClick={finish}>
          {tr('Omitir guía')}
        </button>
      </div>
    </Modal>
  );
}
