import { expect, test, vi } from 'vitest';
import { canShareFile, shareFile } from './share-file';
const file = new File(['%PDF-'], 'match.pdf', { type: 'application/pdf' });
test('shares the prepared PDF synchronously from the invoking gesture', async () => {
  const share = vi.fn(async () => {});
  const pending = shareFile(file, 'Partido', { canShare: () => true, share });
  expect(share).toHaveBeenCalledWith({ files: [file], title: 'Partido' });
  expect(await pending).toBe('shared');
});
test('unsupported file sharing is detected without throwing or attempting a native share', async () => {
  const share = vi.fn();
  expect(canShareFile(file, {})).toBe(false);
  expect(canShareFile(file, { canShare: () => true })).toBe(false);
  expect(
    await shareFile(file, '', {
      canShare: () => {
        throw new Error('unsupported');
      },
      share,
    }),
  ).toBe('unsupported');
  expect(share).not.toHaveBeenCalled();
});
test('cancelling never falls through to download; genuine errors remain actionable', async () => {
  expect(
    await shareFile(file, '', {
      canShare: () => true,
      share: async () => {
        throw { name: 'AbortError' };
      },
    }),
  ).toBe('cancelled');
  await expect(
    shareFile(file, '', {
      canShare: () => true,
      share: async () => {
        throw new Error('blocked');
      },
    }),
  ).rejects.toThrow('blocked');
});
