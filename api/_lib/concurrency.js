const mapWithConcurrency = async (values, limit, mapper) => {
  if (!Array.isArray(values) || values.length === 0) return [];

  const results = new Array(values.length);
  const workerCount = Math.max(1, Math.min(limit, values.length));
  let cursor = 0;

  const worker = async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(values[index], index);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
};

module.exports = { mapWithConcurrency };
