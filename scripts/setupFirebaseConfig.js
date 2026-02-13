const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '../public');
const firebaseConfigPath = path.join(publicDir, 'firebase-config.js');
const firebaseConfigExamplePath = path.join(publicDir, 'firebase-config.example.js');

// Only create if it doesn't exist and we're in development
if (!fs.existsSync(firebaseConfigPath)) {
  try {
    const exampleContent = fs.readFileSync(firebaseConfigExamplePath, 'utf8');
    fs.writeFileSync(firebaseConfigPath, exampleContent, 'utf8');
    console.log('✓ Created public/firebase-config.js from example (dev mode)');
  } catch (err) {
    console.error('⚠ Warning: Could not create firebase-config.js:', err.message);
    console.error('  Please copy public/firebase-config.example.js to public/firebase-config.js manually');
  }
}
