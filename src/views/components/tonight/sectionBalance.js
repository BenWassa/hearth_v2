const getItemDedupeKey = (item) => {
  if (!item || typeof item !== 'object') return null;
  if (item.id != null && item.id !== '') return `id:${item.id}`;
  const title = String(item.title || '')
    .trim()
    .toLowerCase();
  if (!title) return null;
  return `fallback:${item.type || ''}:${title}:${item.year || ''}`;
};

export const dedupeRowsInOrder = (rows) => {
  const seen = new Set();
  return rows.map((row) =>
    row.filter((item) => {
      const key = getItemDedupeKey(item);
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  );
};

export const getBalancedRowCounts = (lengths) => {
  const normalized = lengths.map((length) => Math.max(0, Number(length) || 0));
  const activeRowCount = normalized.filter((length) => length > 0).length;

  if (!activeRowCount) return normalized.map(() => 0);

  const totalItems = normalized.reduce((sum, length) => sum + length, 0);
  const perRowCap = Math.max(1, Math.ceil(totalItems / activeRowCount));

  return normalized.map((length) => Math.min(length, perRowCap));
};

export const balanceRows = (rows) => {
  const counts = getBalancedRowCounts(rows.map((row) => row.length));
  return rows.map((row, index) => row.slice(0, counts[index]));
};
