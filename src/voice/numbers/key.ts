export const numberKey = (value: string) =>
  value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/ß/g, 'ss')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
