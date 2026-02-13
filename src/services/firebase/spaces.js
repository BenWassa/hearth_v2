import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const generateSpaceId = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.getRandomValues
  ) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => charset[byte % charset.length]).join('');
  }
  return Array.from(
    { length },
    () => charset[Math.floor(Math.random() * charset.length)],
  ).join('');
};

export const createSpace = async ({ db, appId, name, userId }) => {
  const newSpaceId = generateSpaceId();
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const spaceRef = doc(db, 'artifacts', appId, 'spaces', newSpaceId);
  await setDoc(spaceRef, {
    name: trimmedName,
    nameLower: trimmedName.toLowerCase(),
    ownerUid: userId,
    members: [userId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: newSpaceId, name: trimmedName };
};

export const joinSpace = async ({ db, appId, spaceId, userId }) => {
  const spaceRef = doc(db, 'artifacts', appId, 'spaces', spaceId);
  await updateDoc(spaceRef, {
    members: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });
  const snapshot = await getDoc(spaceRef);
  if (!snapshot.exists()) return null;
  return snapshot.data();
};

export const fetchSpace = async ({ db, appId, spaceId }) => {
  const spaceRef = doc(db, 'artifacts', appId, 'spaces', spaceId);
  const snapshot = await getDoc(spaceRef);
  if (!snapshot.exists()) return null;
  return snapshot.data();
};

export const findUserSpaceByName = async ({ db, appId, userId, name }) => {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) return null;

  const spacesRef = collection(db, 'artifacts', appId, 'spaces');
  const spacesQuery = query(spacesRef, where('members', 'array-contains', userId));
  const snapshot = await getDocs(spacesQuery);

  const targetLower = trimmedName.toLowerCase();
  const match = snapshot.docs.find((docSnap) => {
    const data = docSnap.data();
    const candidate = typeof data?.nameLower === 'string' ? data.nameLower : '';
    return candidate === targetLower;
  });

  if (!match) return null;
  return {
    id: match.id,
    ...match.data(),
  };
};
