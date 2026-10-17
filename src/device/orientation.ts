type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'portrait') => Promise<void>;
};

/** Fullscreen is requested only from the explicit user action, never during voice capture. */
export async function lockPortrait(fullscreen = false): Promise<boolean> {
  const orientation = screen.orientation as LockableOrientation | undefined;
  if (!orientation?.lock) {
    return false;
  }
  let enteredFullscreen = false;
  try {
    if (fullscreen && !document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
      enteredFullscreen = true;
    }
    await orientation.lock('portrait');
    return true;
  } catch {
    if (enteredFullscreen && document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
    return false;
  }
}
