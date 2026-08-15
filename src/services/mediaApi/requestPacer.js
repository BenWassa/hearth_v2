const defaultSleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const createRequestPacer = ({
  minIntervalMs = 500,
  now = () => Date.now(),
  sleep = defaultSleep,
} = {}) => {
  let lastStartedAt = null;

  return async (request) => {
    if (lastStartedAt !== null) {
      const waitMs = Math.max(0, minIntervalMs - (now() - lastStartedAt));
      if (waitMs > 0) await sleep(waitMs);
    }
    lastStartedAt = now();
    return request();
  };
};
