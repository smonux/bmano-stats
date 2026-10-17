import { toolForPlay } from '../src/voice/legacy/routing';
import { normalizeShirtNumbers } from '../src/voice/legacy/numbers';
import { createNeedle } from 'cactus-needle/browser';
import { schemaForTeams } from '../src/voice/legacy/needle';
import {
  teams,
  properties,
  systemPrompt,
  participantFields,
  type Variant,
} from './benchmarks/needle-schemas';
export type { Variant } from './benchmarks/needle-schemas';
export async function benchmark(
  variant: Variant,
  text: string,
  model?: { model: string; modelSha256: string },
) {
  const system = systemPrompt(variant);
  const started = performance.now();
  const needle = await createNeedle({ ...model, stateless: true, system, maxOutputTokens: 256 });
  const loadMs = performance.now() - started;
  const calls: unknown[] = [];
  let schemaCharacters = 0;
  const run = async (schema: object, maxNewTokens = 256) => {
    const tools = {
      registrar_jugada: {
        description:
          variant === 'current'
            ? 'Extract a single handball play from the recording language. Copy only explicitly mentioned facts.'
            : 'Una jugada de balonmano.',
        inputSchema: schema,
      },
    };
    schemaCharacters += JSON.stringify(tools).length;
    const before = performance.now();
    const result = await needle.complete(text, {
      tools,
      maxNewTokens,
      abortSignal: AbortSignal.timeout(65000),
    });
    calls.push({ ms: performance.now() - before, result });
    return result;
  };
  const before = performance.now();
  try {
    if (variant === 'current') {
      await run(schemaForTeams(teams));
    } else if (variant === 'optimized') {
      const route = toolForPlay(text, 'es', teams);
      schemaCharacters = route.schemaCharacters;
      const start = performance.now();
      const result = await needle.complete(route.text, {
        tools: route.tools,
        maxNewTokens: 128,
        abortSignal: AbortSignal.timeout(65000),
      });
      calls.push({ ms: performance.now() - start, result });
    } else if (variant === 'routed' || variant === 'routed-normalized') {
      const tools = {
        gol: {
          description: 'Gol de balonmano.',
          inputSchema: {
            type: 'object',
            properties: {
              equipo: {
                type: 'string',
                description: 'Equipo del goleador: palabra nuestro, rival o nombre.',
              },
              dorsal: {
                type: 'integer',
                minimum: 0,
                maximum: 99,
                description: 'Dorsal del goleador.',
              },
            },
            required: [],
            additionalProperties: false,
          },
        },
      };
      schemaCharacters = JSON.stringify(tools).length;
      const start = performance.now();
      const result = await needle.complete(
        variant === 'routed-normalized' ? normalizeShirtNumbers(text, 'es') : text,
        { tools, maxNewTokens: 128, abortSignal: AbortSignal.timeout(65000) },
      );
      calls.push({ ms: performance.now() - start, result });
    } else if (variant === 'compact') {
      await run({
        type: 'object',
        properties,
        required: ['evento', 'equipo'],
        additionalProperties: false,
      });
    } else {
      const classification = await run(
        {
          type: 'object',
          properties: { evento: properties.evento },
          required: ['evento'],
          additionalProperties: false,
        },
        96,
      );
      const selected = [...classification.function_calls, ...classification.suppressed_calls][0]
        ?.arguments.evento;
      if (typeof selected === 'string' && selected !== 'desconocido') {
        const { evento, ...rest } = properties;
        const roleKeys = participantFields(selected);
        await run(
          {
            type: 'object',
            properties: Object.fromEntries(
              Object.entries(rest).filter(([key]) => roleKeys.includes(key)),
            ),
            required: ['equipo'],
            additionalProperties: false,
          },
          160,
        );
      }
    }
    return {
      variant,
      text,
      loadMs,
      totalMs: performance.now() - before,
      schemaCharacters,
      systemCharacters: system.length,
      calls,
    };
  } finally {
    await needle.close();
  }
}
