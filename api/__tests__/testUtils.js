const createMockReq = (overrides = {}) => ({
  headers: {},
  query: {},
  ...overrides,
});

const createMockRes = () => {
  const output = {
    statusCode: 200,
    headers: {},
    body: null,
  };

  return {
    output,
    setHeader(name, value) {
      output.headers[name] = value;
    },
    status(code) {
      output.statusCode = code;
      return this;
    },
    json(payload) {
      output.body = payload;
      return this;
    },
  };
};

module.exports = {
  createMockReq,
  createMockRes,
};
