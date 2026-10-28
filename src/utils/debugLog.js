export const isDebugLoggingEnabled = () => {
  if (!import.meta.env?.DEV) return false;
  try {
    return globalThis.localStorage?.getItem('hearth:debug') === '1';
  } catch {
    return false;
  }
};

export const debugLog = (...args) => {
  if (isDebugLoggingEnabled()) console.info(...args);
};
