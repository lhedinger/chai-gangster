import { setup, teardown, gangster, stubs } from '../../../lib/index.js';
import { startAppServer, stopAppServer } from '../app/bootstrap.js';

const restStub = stubs.restStub;
describe('Basic Component Test', () => {
  before(async () => await startAppServer());
  after(async () => await stopAppServer());
  beforeEach(async () => await setup());
  afterEach(async () => await teardown());

  it('return value from application server', async () => {
    const expectedResponseBody = {
      status: 'Hello World',
    };
    await gangster
      .get('/hello', { 'Content-Type': 'application/json' })
      .response(200, expectedResponseBody, {})
      .stub([])
      .run();
  });
  it('return the value from downstream rest api', async () => {
    const expectedResponseBody = { status: 'Bonjourno' };
    await gangster
      .get('/downstream', { 'Content-Type': 'application/json' })
      .response(200, expectedResponseBody, {})
      .stub([restStub.get(200, '/api/sayhello', { word: 'Bonjourno' })])
      .run();
  });
});
