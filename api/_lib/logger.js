const logInfo = (message, payload = {}) => {
  console.log(
    JSON.stringify({
      level: 'info',
      message,
      ...payload,
    }),
  );
};

const logError = (message, payload = {}) => {
  console.error(
    JSON.stringify({
      level: 'error',
      message,
      ...payload,
    }),
  );
};

module.exports = {
  logError,
  logInfo,
};
