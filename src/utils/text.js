export const slugifyTitle = (title) =>
  (title || '')
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const normalizeSearchText = (text) => {
  const cleaned = text.toLowerCase().trim();
  if (!cleaned) return '';
  return cleaned.replace(/^the\s+/, '');
};
