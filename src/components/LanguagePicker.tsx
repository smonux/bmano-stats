import { languages, setLanguage, tr, useLanguage, type Language } from '../i18n';
import { WheelPicker } from './WheelPicker';

export function LanguagePicker() {
  const language = useLanguage();
  return (
    <div className="language-picker">
      <WheelPicker<Language>
        label={tr('Idioma')}
        value={language}
        options={(Object.keys(languages) as Language[]).map((code) => ({
          value: code,
          label: languages[code],
        }))}
        change={setLanguage}
      />
    </div>
  );
}
