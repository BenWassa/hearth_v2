const getImportMetaEnv = () => {
  if (typeof window === 'undefined') return {};
  return window.__vite_import_meta_env__ || {};
};

const getProcessEnv = () => {
  if (typeof process === 'undefined' || !process.env) return {};
  return process.env;
};

export const readEnv = (...keys) => {
  const importMetaEnv = getImportMetaEnv();
  const processEnv = getProcessEnv();

  for (const key of keys) {
    const fromImportMeta = importMetaEnv?.[key];
    if (typeof fromImportMeta === 'string' && fromImportMeta.length > 0) {
      return fromImportMeta;
    }
    const fromProcess = processEnv?.[key];
    if (typeof fromProcess === 'string' && fromProcess.length > 0) {
      return fromProcess;
    }
  }

  return '';
};

export const getAppBase = () => {
  const base = readEnv('BASE_URL', 'PUBLIC_URL');
  if (!base || base === '/') return '';
  return base.replace(/\/$/, '');
};

export const isProductionBuild = () => {
  const env = readEnv('MODE', 'NODE_ENV');
  return env === 'production';
};
