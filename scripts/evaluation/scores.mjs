export const stable = (value) =>
  value === null
    ? 'null'
    : JSON.stringify(
        Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))),
      );

const ratio = (correct, total) => ({
  correct,
  total,
  percent: total ? Number(((correct / total) * 100).toFixed(2)) : null,
});
export const summarize = (items) => {
  const known = items.filter((row) => row.expected && row.expected.evento !== 'desconocido');
  const negative = items.filter((row) => !row.expected);
  const uncertain = items.filter((row) => row.expected?.evento === 'desconocido');
  return {
    samples: items.length,
    exact: ratio(items.filter((row) => row.exact).length, items.length),
    event: ratio(
      known.filter((row) => row.actual?.evento === row.expected.evento).length,
      known.length,
    ),
    team: ratio(
      known.filter((row) => row.actual?.equipo === row.expected.equipo).length,
      known.length,
    ),
    eventAndTeam: ratio(
      known.filter(
        (row) =>
          row.actual?.evento === row.expected.evento && row.actual?.equipo === row.expected.equipo,
      ).length,
      known.length,
    ),
    rejection: ratio(negative.filter((row) => !row.actual).length, negative.length),
    safeUncertain: ratio(
      uncertain.filter((row) => !row.actual || row.actual.evento === 'desconocido').length,
      uncertain.length,
    ),
    falsePositiveActions: negative.filter(
      (row) => row.actual && row.actual.evento !== 'desconocido',
    ).length,
  };
};

export function fieldScores(results) {
  const fields = [
    'evento',
    'equipo',
    'dorsal',
    'nombre',
    'dorsal_relacionado',
    'nombre_relacionado',
    'penalti',
    'azul',
    'infraccion',
  ];
  const scores = Object.fromEntries(
    fields.map((field) => {
      const applicable = results.filter(
        (row) => row.expected && Object.hasOwn(row.expected, field),
      );
      return [
        field,
        {
          ...ratio(
            applicable.filter((row) => row.actual?.[field] === row.expected[field]).length,
            applicable.length,
          ),
          unexpected: results.filter(
            (row) =>
              row.actual &&
              Object.hasOwn(row.actual, field) &&
              (!row.expected || !Object.hasOwn(row.expected, field)),
          ).length,
        },
      ];
    }),
  );
  return scores;
}
