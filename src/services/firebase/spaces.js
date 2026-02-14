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

const normalizeSpaceName = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

// FNV-1a 32-bit hash; deterministic and compact for stable IDs.
const hashString = (input) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
};

export const getSpaceIdFromName = (name) => {
  const normalized = normalizeSpaceName(name);
  if (!normalized) return '';
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const base = slug || 'space';
  return `space-${base}-${hashString(normalized)}`;
};

export const createSpace = async ({ db, appId, name, userId }) => {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const deterministicSpaceId = getSpaceIdFromName(trimmedName);
  const newSpaceId = deterministicSpaceId || generateSpaceId();
  const spaceRef = doc(db, 'artifacts', appId, 'spaces', newSpaceId);
  await setDoc(spaceRef, {
    name: trimmedName,
    nameLower: normalizeSpaceName(trimmedName),
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

  let snapshot;
  try {
    const spacesRef = collection(db, 'artifacts', appId, 'spaces');
    const spacesQuery = query(
      spacesRef,
      where('members', 'array-contains', userId),
    );
    snapshot = await getDocs(spacesQuery);
  } catch (err) {
    if (err?.code === 'permission-denied') {
      // If rules reject the lookup query, continue directly to create flow.
      return null;
    }
    throw err;
  }

  const targetLower = normalizeSpaceName(trimmedName);
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

export const createOrJoinSpaceByName = async ({ db, appId, name, userId }) => {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) return null;

  // Compatibility path for legacy spaces that were created with random IDs.
  const existingMemberSpace = await findUserSpaceByName({
    db,
    appId,
    userId,
    name: trimmedName,
  });
  if (existingMemberSpace?.id) {
    return existingMemberSpace;
  }

  const deterministicSpaceId = getSpaceIdFromName(trimmedName);
  if (!deterministicSpaceId) return null;

  try {
    const joinedSpace = await joinSpace({
      db,
      appId,
      spaceId: deterministicSpaceId,
      userId,
    });
    if (joinedSpace) {
      return {
        id: deterministicSpaceId,
        ...joinedSpace,
      };
    }
  } catch (err) {
    if (err?.code !== 'not-found') {
      throw err;
    }
  }

  try {
    const createdSpace = await createSpace({
      db,
      appId,
      name: trimmedName,
      userId,
    });
    return createdSpace;
  } catch (err) {
    // Race condition: another user may have created the same deterministic space.
    if (err?.code === 'permission-denied' || err?.code === 'already-exists') {
      const joinedSpace = await joinSpace({
        db,
        appId,
        spaceId: deterministicSpaceId,
        userId,
      });
      if (joinedSpace) {
        return {
          id: deterministicSpaceId,
          ...joinedSpace,
        };
      }
    }
    throw err;
  }
};
