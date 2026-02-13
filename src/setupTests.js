// Polyfills for Jest Node environment so browser-like APIs are available
// Required for some dependencies (e.g., undici/fetch used by firebase)
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;

// Provide ReadableStream in the test environment (used by fetch/undici)
try {
  if (typeof global.ReadableStream === 'undefined') {
    // Use the ponyfill from web-streams-polyfill (dist path)
    const { ReadableStream } = require('web-streams-polyfill/dist/ponyfill');
    global.ReadableStream = ReadableStream;
  }
} catch (err) {
  // If polyfill is unavailable, tests that need it will fail explicitly
  // but we won't crash the test setup.
  // eslint-disable-next-line no-console
  console.warn(
    'ReadableStream polyfill not available in test environment:',
    err && err.message,
  );
}
