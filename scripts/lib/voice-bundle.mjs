import { rolldown } from 'rolldown';

/** Load browser-independent TypeScript modules for dataset checks under Node. */
export async function loadVoiceModule(path) {
  const bundle = await rolldown({ input: path, platform: 'node', logLevel: 'silent' });
  try {
    const { output } = await bundle.generate({ format: 'esm' });
    if (output.length !== 1) {
      throw new Error('El módulo de voz debe generar un único archivo.');
    }
    const code = output[0].code;
    const exports = await import(
      'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
    );
    return { code, exports };
  } finally {
    await bundle.close();
  }
}
