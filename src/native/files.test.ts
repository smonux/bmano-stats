import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ write: vi.fn(), share: vi.fn() }));
vi.mock('./platform', () => ({ nativePlatform: () => true }));
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: { writeFile: mocks.write },
}));
vi.mock('@capacitor/share', () => ({ Share: { share: mocks.share } }));
import { exportFile, shareNativeFile } from './files';
afterEach(() => vi.resetAllMocks());
it('shares a private cache URI and does not send file contents or public paths to another service', async () => {
  mocks.write.mockResolvedValue({ uri: 'file:///private/cache/exports/test.pdf' });
  mocks.share.mockResolvedValue({});
  await shareNativeFile(new File(['abc'], '../stats.pdf'), 'Statistics');
  expect(mocks.write.mock.calls[0][0]).toMatchObject({
    directory: 'CACHE',
    data: 'YWJj',
    recursive: true,
  });
  expect(mocks.write.mock.calls[0][0].path).toMatch(/^exports\/\d+-.._stats.pdf$/);
  expect(mocks.share).toHaveBeenCalledWith({
    title: 'Statistics',
    dialogTitle: 'Statistics',
    files: ['file:///private/cache/exports/test.pdf'],
  });
});
it('cancel does not fall through to a download, and real errors remain errors', async () => {
  mocks.write.mockResolvedValue({ uri: 'file:///private/cache/exports/test.zip' });
  mocks.share.mockRejectedValueOnce(new Error('Share canceled'));
  await expect(exportFile(new File(['abc'], 'backup.zip'), 'Backup')).resolves.toBe('cancelled');
  mocks.share.mockRejectedValueOnce(new Error('Disk unavailable'));
  await expect(exportFile(new File(['abc'], 'backup.zip'), 'Backup')).rejects.toThrow(
    'Disk unavailable',
  );
});
it('bounds a temporary Unicode filename without changing the exported content', async () => {
  mocks.write.mockResolvedValue({ uri: 'file:///private/cache/exports/report.zip' });
  mocks.share.mockResolvedValue({});
  await shareNativeFile(new File(['unchanged'], '愛'.repeat(200) + '.zip'), 'Backup');
  const written = mocks.write.mock.calls[0][0];
  expect(new TextEncoder().encode(written.path).length).toBeLessThan(170);
  expect(written.path.endsWith('.zip')).toBe(true);
  expect(atob(written.data)).toBe('unchanged');
});
