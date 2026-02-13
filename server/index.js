const app = require('./app');
const { initializeFirebaseAdmin } = require('./firebaseAdmin');

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
