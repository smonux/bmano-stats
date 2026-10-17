/** Lint annotation evidence only. This module never interprets application input. */
export function validateFamilies(seeds, events, schema, proposalSchema) {
  const ids = new Set();
  const texts = new Set();
  const normalizedFamilies = new Map();
  const errors = [];
  const requireThat = (condition, message) => {
    if (!condition) {
      errors.push(message);
    }
  };
  const normalize = (text) =>
    text
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  const units = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = [
    'diez',
    'once',
    'doce',
    'trece',
    'catorce',
    'quince',
    'dieciséis',
    'diecisiete',
    'dieciocho',
    'diecinueve',
  ];
  const tens = [
    '',
    '',
    'veinte',
    'treinta',
    'cuarenta',
    'cincuenta',
    'sesenta',
    'setenta',
    'ochenta',
    'noventa',
  ];
  const numberWords = (number) =>
    number < 10
      ? units[number]
      : number < 20
        ? teens[number - 10]
        : number % 10 === 0
          ? tens[number / 10]
          : number < 30
            ? `veinti${units[number % 10]}`
            : `${tens[Math.floor(number / 10)]} y ${units[number % 10]}`;
  // Annotation lint only: checks literal number evidence, never interprets app input.
  const numberIsMentioned = (text, number) => {
    const haystack = ` ${normalize(text)} `;
    const words = numberWords(number);
    const spellings = [
      String(number),
      words,
      ...(number === 1 ? ['un', 'una'] : number === 21 ? ['veintiun', 'veintiuna'] : []),
    ];
    return spellings.some((value) => haystack.includes(` ${normalize(value)} `));
  };
  const relatedEvents = new Set([
    'gol',
    'parada',
    'recuperacion',
    'penalti_cometido',
    'exclusion',
    'descalificacion',
    'sustitucion',
  ]);
  for (const family of seeds) {
    const where = family.id ?? '(sin id)';
    requireThat(
      typeof family.id === 'string' && /^[a-z][a-z0-9_-]+$/.test(family.id),
      `${where}: identificador inválido`,
    );
    requireThat(!ids.has(family.id), `${where}: familia duplicada`);
    ids.add(family.id);
    requireThat(
      typeof family.category === 'string' && family.category.length > 0,
      `${where}: falta categoría`,
    );
    requireThat(
      Array.isArray(family.teams) &&
        family.teams.length === 2 &&
        family.teams.every(
          (name) => typeof name === 'string' && name.trim().length > 0 && name.length <= 100,
        ) &&
        normalize(family.teams[0]) !== normalize(family.teams[1]),
      `${where}: se requieren dos equipos distintos`,
    );
    requireThat(
      typeof family.reason === 'string' && family.reason.length > 0,
      `${where}: falta criterio de anotación`,
    );
    requireThat(
      Array.isArray(family.variants) && family.variants.length === 3,
      `${where}: se esperan tres variantes`,
    );
    for (const [index, variant] of (family.variants ?? []).entries()) {
      const label = `${where}/${index + 1}`;
      requireThat(
        typeof variant.text === 'string' &&
          variant.text.trim().length > 0 &&
          variant.text.length <= 1000,
        `${label}: texto inválido`,
      );
      requireThat(
        typeof variant.style === 'string' && variant.style.length > 0,
        `${label}: falta estilo`,
      );
      if (typeof variant.text !== 'string') {
        continue;
      }
      if (index === 2) {
        requireThat(
          variant.style === 'parafrasis',
          `${label}: la tercera variante debe ser una paráfrasis`,
        );
        requireThat(
          normalize(variant.text) !== normalize(family.variants[0].text),
          `${label}: la paráfrasis solo cambia puntuación o tildes`,
        );
      }
      requireThat(!texts.has(variant.text), `${label}: texto literal duplicado`);
      texts.add(variant.text);
      const key = normalize(variant.text);
      requireThat(
        !normalizedFamilies.has(key) || normalizedFamilies.get(key) === family.id,
        `${label}: texto equivalente en otra familia (${normalizedFamilies.get(key)})`,
      );
      normalizedFamilies.set(key, family.id);
      const args = variant.arguments;
      if (args === null) {
        requireThat(
          !events.includes(family.category),
          `${label}: categoría de evento sin respuesta`,
        );
        continue;
      }
      const parsed = proposalSchema.strict().safeParse(args);
      requireThat(
        parsed.success,
        `${label}: respuesta fuera del esquema (${parsed.error?.message})`,
      );
      if (!parsed.success) {
        continue;
      }
      requireThat(
        Object.hasOwn(args, 'equipo') && schema.properties.equipo.enum.includes(args.equipo),
        `${label}: equipo canónico obligatorio`,
      );
      requireThat(
        args.evento === family.category ||
          (!events.includes(family.category) && args.evento === 'desconocido'),
        `${label}: evento no corresponde a su categoría`,
      );
      requireThat(
        !Object.hasOwn(args, 'penalti') || ['gol', 'parada', 'fallo'].includes(args.evento),
        `${label}: penalti incompatible`,
      );
      requireThat(
        !Object.hasOwn(args, 'azul') || args.evento === 'descalificacion',
        `${label}: azul incompatible`,
      );
      requireThat(
        !Object.hasOwn(args, 'infraccion') ||
          (args.evento === 'infraccion' &&
            ['Pasos', 'Dobles', 'Pisando'].includes(args.infraccion)),
        `${label}: subtipo incompatible`,
      );
      requireThat(
        relatedEvents.has(args.evento) ||
          (!Object.hasOwn(args, 'dorsal_relacionado') &&
            !Object.hasOwn(args, 'nombre_relacionado')),
        `${label}: participante relacionado incompatible`,
      );
      if (args.evento === 'pasivo') {
        requireThat(
          Object.keys(args).every((key) => ['evento', 'equipo'].includes(key)),
          `${label}: pasivo solo tiene evento y equipo`,
        );
      }
      for (const field of ['nombre', 'nombre_relacionado']) {
        if (Object.hasOwn(args, field)) {
          requireThat(
            typeof args[field] === 'string' &&
              args[field].trim().length > 0 &&
              variant.text.includes(args[field]),
            `${label}: ${field} no es literal en el texto`,
          );
        }
      }
      for (const field of ['dorsal', 'dorsal_relacionado']) {
        if (Object.hasOwn(args, field)) {
          requireThat(
            numberIsMentioned(variant.text, args[field]),
            `${label}: ${field}=${args[field]} sin número literal en el texto`,
          );
        }
      }
    }
  }
  if (errors.length) {
    throw new Error(`Dataset inválido:\n${errors.join('\n')}`);
  }
}
