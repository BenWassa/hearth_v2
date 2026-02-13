const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const app = require('./app');
const { initializeFirebaseAdmin } = require('./firebaseAdmin');

const loadEnv = () => {
  const cwd = process.cwd();
  const envFiles = ['.env.local', '.env.api', '.env'];

  envFiles.forEach((name) => {
    const filePath = path.join(cwd, name);
    if (!fs.existsSync(filePath)) return;
    dotenv.config({ path: filePath, override: false });
  });
};

loadEnv();

const PORT = Number.parseInt(process.env.PORT || '8080', 10);

try {
  initializeFirebaseAdmin();
  console.log('Firebase Admin initialized.');
} catch (error) {
  console.warn(`Firebase Admin initialization skipped: ${error.message}`);
}

app.listen(PORT, () => {
  console.log(`Hearth server listening on port ${PORT}`);
});
