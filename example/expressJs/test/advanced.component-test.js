import { setup, teardown, gangster, stubs } from '../../../lib/index.js';
import { startAppServer, stopAppServer } from '../app/bootstrap.js';

const restStub = stubs.restStub;
describe('Advanced Component Test', () => {
  before(async () => await startAppServer());
  after(async () => await stopAppServer());
  beforeEach(async () => await setup());
  afterEach(async () => await teardown());

  it('return value from application server', async () => {
    const expectedResponseBody = {
      status: 'running',
      id: 1234,
    };
    await gangster
      .get('/advanced-downstream', { 'Content-Type': 'application/json' })
      .response(200, expectedResponseBody, {})
      .stub([
        restStub.get(200, 'http://example.com/api/isalive', {
          status: 'running',
        }),
        restStub
          .post(200, 'http://some-db.com/api/store', { id: 1234 })
          .expect({ value: 'running' }, { 'content-type': 'application/json' }),
      ])
      .run();
  });
});
