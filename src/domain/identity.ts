export const unknownId = (teamId: string) => `unknown:${teamId}`;
export const nameKey = (name: string) => name.trim().normalize('NFKC').toLocaleLowerCase('es');
