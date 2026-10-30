declare const __APP_VERSION__: string;
declare const __BUILD_COMMIT__: string;

/** Values are embedded at build time, so an offline/cached app identifies its own build. */
export const buildInfo = { version: __APP_VERSION__, commit: __BUILD_COMMIT__ };
