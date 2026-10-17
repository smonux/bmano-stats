import { resolve } from 'node:path';
import { loadVoiceModule } from '../lib/voice-bundle.mjs';

export async function datasetContract(root) {
  // Read the application's real schema without maintaining a second field list.
  const {
    exports: { extractionSchema, proposalSchema },
  } = await loadVoiceModule(resolve(root, 'src/voice/schema.ts'));
  const events = extractionSchema.properties.evento.enum.filter((value) => value !== 'desconocido');
  const schema = structuredClone(extractionSchema);
  schema.properties.equipo.enum = ['equipo1', 'equipo2', 'desconocido'];
  schema.properties.equipo.description =
    'Equipo del participante principal desde quien graba: nuestro/nosotros/mi equipo=equipo1; ellos/rival/contrario/suyo=equipo2. Sin referencia al equipo: desconocido. Local y visitante no determinan la perspectiva.';
  const tools = [
    {
      name: 'registrar_jugada',
      description:
        'Extrae una sola jugada de balonmano afirmada. Conserva solo los datos explícitos. Una frase ajena al juego, negada o con varias jugadas no genera llamadas.',
      parameters: schema,
    },
  ];
  return { events, schema, tools, proposalSchema };
}
