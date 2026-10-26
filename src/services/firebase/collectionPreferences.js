import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

// Canonical provider/collection identity, never a display title or a movie ID.
// These bounds also apply in firestore.rules.
export const isCollectionPreferenceKey = (key) =>
  typeof key === 'string' &&
  /^[a-z][a-z0-9_-]{0,19}:[A-Za-z0-9_-]{1,80}$/.test(key);

const preferenceCollection = (db, appId, spaceId) =>
  collection(
    db,
    'artifacts',
    appId,
    'spaces',
    spaceId,
    'collection_preferences',
  );

export const subscribeCollectionPreferences = ({
  db,
  appId,
  spaceId,
  onNext,
  onError,
}) =>
  onSnapshot(
    preferenceCollection(db, appId, spaceId),
    (snapshot) => {
      const preferences = {};
      snapshot.docs.forEach((entry) => {
        const data = entry.data();
        if (
          isCollectionPreferenceKey(entry.id) &&
          typeof data?.visible === 'boolean'
        ) {
          preferences[entry.id] = data.visible;
        }
      });
      onNext(preferences);
    },
    onError,
  );

export const saveCollectionPreference = async ({
  db,
  appId,
  spaceId,
  key,
  visible,
}) => {
  if (!db || !appId || !spaceId)
    throw new Error('Household preferences are unavailable.');
  if (!isCollectionPreferenceKey(key))
    throw new Error('Invalid collection identity.');
  if (visible !== null && typeof visible !== 'boolean') {
    throw new Error('Choose Show, Hide, or Default for this collection.');
  }
  const reference = doc(
    db,
    'artifacts',
    appId,
    'spaces',
    spaceId,
    'collection_preferences',
    key,
  );
  // Reset means absence, not false: a future editorial default can apply again.
  if (visible === null) return deleteDoc(reference);
  return setDoc(reference, { visible, updatedAt: serverTimestamp() });
};
