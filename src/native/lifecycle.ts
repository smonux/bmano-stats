import { App } from '@capacitor/app';
import { nativePlatform } from './platform';

/** Native back respects the existing dialog's cancel handling. No data writes. */
export async function installNativeLifecycle() {
  if (!nativePlatform()) return () => {};
  const background = await App.addListener('appStateChange', ({ isActive }) => {
    window.dispatchEvent(new Event(isActive ? 'focus' : 'handball:inactive'));
  });
  const back = await App.addListener('backButton', ({ canGoBack }) => handleNativeBack(canGoBack));
  return () => {
    void background.remove();
    void back.remove();
  };
}

export function handleNativeBack(canGoBack: boolean) {
  const dialogs = document.querySelectorAll('dialog[open]');
  const dialog = dialogs[dialogs.length - 1];
  if (dialog) {
    dialog.dispatchEvent(new Event('cancel', { cancelable: true, bubbles: true }));
  } else if (canGoBack) {
    history.back();
  } else if (location.hash && location.hash !== '#/') {
    location.hash = '/';
  } else {
    void App.exitApp();
  }
}
