const fs = require('fs');
const path = require('path');
const { initializeApp, cert, applicationDefault, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const DEFAULT_SERVICE_ACCOUNT_FILENAME =
  'hearthv2-firebase-adminsdk-fbsvc-88544fef3e.json';

const resolveServiceAccountPath = () => {
  const configuredPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (configuredPath) {
    return path.resolve(process.cwd(), configuredPath);
  }

  return path.resolve(process.cwd(), DEFAULT_SERVICE_ACCOUNT_FILENAME);
};

const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountPath = resolveServiceAccountPath();

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return initializeApp({
    credential: applicationDefault(),
  });
};

const getAdminDb = () => getFirestore(initializeFirebaseAdmin());

module.exports = {
  initializeFirebaseAdmin,
  getAdminDb,
};
