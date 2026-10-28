import { Capacitor } from '@capacitor/core';

export const nativeBundle = import.meta.env.VITE_NATIVE_BUNDLE === 'true';
export const nativePlatform = () => Capacitor.isNativePlatform();
