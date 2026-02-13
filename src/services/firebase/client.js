import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app = null;
let auth = null;
let db = null;
let firebaseConfig = {};

const isValidFirebaseConfig = (config) => {
  if (!config || typeof config !== 'object' || Array.isArray(config))
    return false;
  if (typeof config.apiKey !== 'string' || !config.apiKey.trim()) return false;
  if (typeof config.projectId !== 'string' || !config.projectId.trim())
    return false;
  const looksLikePlaceholder = (value) =>
    /^YOUR_|YOUR_/i.test(String(value || '').trim());
  if (looksLikePlaceholder(config.apiKey)) return false;
  if (looksLikePlaceholder(config.projectId)) return false;
  return true;
};

const loadFirebaseConfig = () => {
  try {
    firebaseConfig =
      typeof window !== 'undefined' && window.__firebase_config
        ? window.__firebase_config
        : {};
    console.log(
      'Firebase config loaded:',
      Object.keys(firebaseConfig).length > 0 ? 'present' : 'missing',
    );
    console.log('Config details:', {
      hasApiKey: !!firebaseConfig?.apiKey,
      hasProjectId: !!firebaseConfig?.projectId,
      apiKeyLength: firebaseConfig?.apiKey?.length,
      projectId: firebaseConfig?.projectId,
    });
  } catch (err) {
    console.warn('Error accessing firebase config:', err);
    firebaseConfig = {};
  }

  if (!isValidFirebaseConfig(firebaseConfig)) {
    if (Object.keys(firebaseConfig).length > 0) {
      console.warn('Invalid __firebase_config; running in offline mode');
    }
    firebaseConfig = {};
    app = null;
    auth = null;
    db = null;
    return { app, auth, db };
  }

  if (Object.keys(firebaseConfig).length > 0) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('Firebase initialized successfully');
    } catch (err) {
      console.warn(
        'Firebase initialization failed; continuing without firestore for tests:',
        err && err.message,
      );
      app = null;
      auth = null;
      db = null;
    }
  } else {
    console.log('No Firebase config found, running in offline mode');
  }

  return { app, auth, db };
};

export const initializeFirebase = (onReady) => {
  if (typeof window === 'undefined') return { app, auth, db };

  if (window.__firebase_config) {
    const result = loadFirebaseConfig();
    if (onReady) onReady(result);
    return result;
  }

  setTimeout(() => {
    if (window.__firebase_config) {
      const result = loadFirebaseConfig();
      if (onReady) onReady(result);
    } else {
      console.log('Firebase config still not loaded, running in offline mode');
      if (onReady) onReady({ app, auth, db });
    }
  }, 500);

  return { app, auth, db };
};

export const getAppId = () =>
  typeof window !== 'undefined' && window.__app_id
    ? window.__app_id
    : 'hearth-default';
