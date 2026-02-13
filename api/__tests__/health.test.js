const test = require('node:test');
const assert = require('node:assert/strict');

const healthHandler = require('../health');
const { createMockReq, createMockRes } = require('./testUtils');

test('health returns 200 and healthy payload', async () => {
  const req = createMockReq();
  const res = createMockRes();

  await healthHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.ok, true);
  assert.equal(res.output.body.data.status, 'healthy');
  assert.equal(res.output.body.data.service, 'hearth-api');
  assert.ok(typeof res.output.body.meta.requestId === 'string');
});
