import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signInWithCustomToken,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';

let persistenceReady = false;

export const signInUser = async (auth, initialToken) => {
  if (!auth || !auth.app) return;
  if (!persistenceReady) {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (err) {
      console.warn('Auth persistence not available, continuing:', err);
    } finally {
      persistenceReady = true;
    }
  }
  if (auth.currentUser) return;
  if (initialToken) {
    await signInWithCustomToken(auth, initialToken);
  }
};

export const signInWithGoogle = async (auth) => {
  if (!auth || !auth.app) return null;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  try {
    return await signInWithPopup(auth, provider);
  } catch (err) {
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/popup-closed-by-user'
    ) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw err;
  }
};

export const signInAnonymousUser = async (auth) => {
  if (!auth || !auth.app) return null;
  if (auth.currentUser) return auth.currentUser;
  return signInAnonymously(auth);
};

export const isAnonymousAuthUser = (user) => Boolean(user?.isAnonymous);

export const subscribeToAuth = (auth, onUser) => {
  if (!auth || !auth.app || typeof onAuthStateChanged !== 'function')
    return () => {};
  return onAuthStateChanged(auth, onUser);
};

export const signOutUser = async (auth) => {
  if (!auth || !auth.currentUser) return;
  await signOut(auth);
};
