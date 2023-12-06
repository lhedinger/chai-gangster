import { setup, teardown, gangster, stubs } from '../../../lib/index.js';
import { startAppServer, stopAppServer } from '../app/bootstrap.js';

const restStub = stubs.restStub;
describe('Advanced Component Test', () => {
  before(async () => await startAppServer());
  after(async () => await stopAppServer());
  beforeEach(async () => await setup());
  afterEach(async () => await teardown());

  it('expect value from first call to be passed to second call', async () => {
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

  it('expect behavior to be different based on body', async () => {
    const expectedResponseBody = {
      fruit: 'apple',
      vegetable: 'carrot',
    };
    await gangster
      .get('/advanced-downstream2', { 'Content-Type': 'application/json' })
      .response(200, expectedResponseBody, {})
      .stub([
        restStub
          .post(200, 'http://example.com/api/getfood', { food: 'apple' })
          .when({ type: 'fruit' }, { 'Content-Type': 'application/json' }),
        restStub
          .post(200, 'http://example.com/api/getfood', { food: 'carrot' })
          .when({ type: 'vegetable' }, { 'Content-Type': 'application/json' }),
      ])
      .run();
  });
});
