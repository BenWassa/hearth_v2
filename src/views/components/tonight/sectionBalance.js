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
