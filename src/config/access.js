const MAIN_APP_WHITELIST_UIDS = new Set([
  'CdP5YrCYW1d1RjqVQVbnm5QJCLV2',
  '7lGXb8XSW4NVSoIPWW8udn3tntK2',
]);

export const isWhitelistedUid = (uid) =>
  MAIN_APP_WHITELIST_UIDS.has(String(uid || '').trim());

