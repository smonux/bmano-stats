let fonts: Promise<string[]> | undefined;
export function loadFonts() {
  return (fonts ??= Promise.all(
    ['handball-sans.ttf', 'handball-sans-bold.ttf'].map(async (name) => {
      const response = await fetch(`${import.meta.env.BASE_URL}fonts/${name}`);
      if (!response.ok) {
        throw new Error('No se pudo generar el PDF.');
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      let text = '';
      for (let i = 0; i < bytes.length; i += 8192) {
        text += String.fromCharCode(...bytes.subarray(i, i + 8192));
      }
      return btoa(text);
    }),
  ).catch((error) => {
    fonts = undefined;
    throw error;
  }));
}
