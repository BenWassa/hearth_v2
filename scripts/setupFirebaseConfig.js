const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '../public');
const firebaseConfigPath = path.join(publicDir, 'firebase-config.js');
const firebaseConfigExamplePath = path.join(publicDir, 'firebase-config.example.js');
const APP_ID_DEFAULT = 'hearth-default';

const readFirst = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const isPlaceholder = (value) => /^YOUR_|YOUR_/i.test(String(value || '').trim());

const firebaseConfigFromEnv = {
  apiKey: readFirst('FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY'),
  authDomain: readFirst('FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readFirst('FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readFirst(
    'FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_STORAGE_BUCKET',
  ),
  messagingSenderId: readFirst(
    'FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
  ),
  appId: readFirst('FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID'),
};
const appId = readFirst('APP_ID') || APP_ID_DEFAULT;

const hasCompleteEnvConfig =
  Object.values(firebaseConfigFromEnv).every(Boolean) &&
  !Object.values(firebaseConfigFromEnv).some(isPlaceholder);

if (hasCompleteEnvConfig) {
  const contents = `window.__firebase_config = ${JSON.stringify(firebaseConfigFromEnv, null, 2)};
window.__app_id = ${JSON.stringify(appId)};
`;
  fs.writeFileSync(firebaseConfigPath, contents, 'utf8');
  console.log('✓ Generated public/firebase-config.js from environment variables');
  process.exit(0);
}

if (fs.existsSync(firebaseConfigPath)) {
  console.log('ℹ Using existing public/firebase-config.js');
  process.exit(0);
}

const isProductionBuild =
  process.env.NODE_ENV === 'production' ||
  process.env.CI === 'true' ||
  process.env.FIREBASE_APP_HOSTING === 'true';

if (isProductionBuild) {
  console.error('✖ Missing required Firebase env vars for production build.');
  console.error(
    '  Set FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, and FIREBASE_APP_ID.',
  );
  process.exit(1);
}

try {
  const exampleContent = fs.readFileSync(firebaseConfigExamplePath, 'utf8');
  fs.writeFileSync(firebaseConfigPath, exampleContent, 'utf8');
  console.log('✓ Created public/firebase-config.js from example (dev mode)');
} catch (err) {
  console.error('⚠ Warning: Could not create firebase-config.js:', err.message);
  console.error(
    '  Please copy public/firebase-config.example.js to public/firebase-config.js manually',
  );
}
