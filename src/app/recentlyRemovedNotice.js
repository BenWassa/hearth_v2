// Only Recently removed re-add confirmations use the floating notice.
export const isRecentlyRemovedNotice = (message) =>
  typeof message === 'string' &&
  message.startsWith('Brought back ') &&
  message.endsWith(' from Recently removed.');
