import { getFirestore } from 'firebase/firestore';
import { initializeFirebase as initializeAuth } from './authClient.js';
export { getAppId } from './authClient.js';

// Publish auth and db together for both immediate and delayed config.
export const initializeFirebase = (onReady) => {
  const withFirestore = (client) => {
    try {
      return { ...client, db: client.app ? getFirestore(client.app) : null };
    } catch (err) {
      console.warn('Firebase initialization failed; continuing offline:', err);
      return { app: null, auth: null, db: null };
    }
  };
  return withFirestore(
    initializeAuth((client) => {
      if (onReady) onReady(withFirestore(client));
    }),
  );
};
