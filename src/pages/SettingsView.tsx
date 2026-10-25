import { VoicePreparation } from '../components/VoicePreparation';
import { LanguagePicker } from '../components/Welcome';
import { tr } from '../i18n';
import { useState } from 'react';
import { Check, Download, ShieldCheck, Upload } from 'lucide-react';
import { repo } from '../data/database';
import { type Backup } from '../domain/model';
import { Confirm, ErrorMessage, PageTitle, useAction } from '../components/ui';
import { backupZip, readBackupFile } from '../data/backup-files';
import { todayDateString } from '../presentation/matches';
function SettingsView({ showWelcome }: { showWelcome: () => void }) {
  const action = useAction();
  const [backup, setBackup] = useState<Backup | null>(null);
  const [notice, setNotice] = useState('');
  return (
    <>
      <PageTitle
        title={tr('Ajustes')}
        subtitle={tr('Guardados en este dispositivo. Siempre a tu alcance.')}
      />
      <section className="panel settings-panel">
        <h2>{tr('Idioma de la aplicación')}</h2>
        <LanguagePicker />
      </section>
      <section className="panel settings-panel">
        <VoicePreparation />
        <p className="caption">
          {tr(
            'Interfaz y voz pueden usar idiomas distintos. Los siete idiomas comparten el mismo modelo Whistle.',
          )}
        </p>
        <button onClick={showWelcome}>{tr('Ver bienvenida')}</button>
      </section>
      <section className="panel settings-panel">
        <h2>{tr('Datos y copias')}</h2>
        <p className="muted">
          {tr(
            'Borrar los datos del navegador elimina los partidos locales. Conserva una copia ZIP fuera de este dispositivo. El PDF comparte un partido, pero no sirve para restaurarlo.',
          )}
        </p>
        <ShieldCheck size={30} />
        <h2>{tr('Una copia, por tranquilidad')}</h2>
        <p className="muted">
          {tr(
            'Exporta todos tus equipos, jugadores, partidos y eventos a un ZIP. Podrás restaurarlo en este u otro dispositivo.',
          )}
        </p>
        <button
          className="primary"
          disabled={action.busy}
          onClick={() =>
            action.run(async () => {
              const data = await repo.exportBackup();
              const bytes = await backupZip(data);
              const url = URL.createObjectURL(
                new Blob([new Uint8Array(bytes).buffer], {
                  type: 'application/zip',
                }),
              );
              const downloadLink = document.createElement('a');
              downloadLink.href = url;
              downloadLink.download = `handball-stats-${todayDateString()}.zip`;
              downloadLink.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              setNotice(
                tr(
                  'Descarga iniciada. Comprueba que el ZIP se ha guardado y consérvalo en un lugar seguro.',
                ),
              );
            })
          }
        >
          <Download size={18} /> {tr('Exportar copia ZIP')}
        </button>
        <hr />
        <h3>{tr('Restaurar una copia')}</h3>
        <p className="muted">
          {tr('Reemplaza los datos actuales. Primero te mostraremos un resumen para confirmar.')}
        </p>
        <label className="file-label">
          <Upload size={18} /> {tr('Elegir archivo ZIP o JSON')}
          <input
            disabled={action.busy}
            type="file"
            accept=".zip,.json,application/zip,application/x-zip-compressed,application/json"
            aria-label={tr('Importar copia')}
            onChange={(inputEvent) => {
              const file = inputEvent.target.files?.[0];
              inputEvent.target.value = '';
              if (file) {
                action.run(async () => {
                  setBackup(await readBackupFile(file));
                });
              }
            }}
          />
        </label>
        <ErrorMessage text={action.error} />
        {notice && (
          <p className="success" role="status">
            <Check size={16} />
            {notice}
          </p>
        )}
      </section>
      {backup && (
        <Confirm
          title={tr('Restaurar copia')}
          text={tr(
            'Se reemplazarán los datos locales por {teams} equipos, {matches} partidos y {events} eventos. Exporta antes una copia si necesitas conservar lo actual.',
            {
              teams: backup.teams.length,
              matches: backup.matches.length,
              events: backup.events.length,
            },
          )}
          danger
          close={() => setBackup(null)}
          confirm={async () => {
            await repo.importBackup(backup);
            setNotice(tr('Copia restaurada correctamente.'));
          }}
        />
      )}
    </>
  );
}
export { SettingsView };
