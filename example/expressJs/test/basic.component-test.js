import {
  setup,
  teardown,
  gangster,
  downstream,
  fixture,
  setFixturePath,
} from '../../../lib/index.js';
import { startAppServer, stopAppServer } from '../app/bootstrap.js';

describe('Basic Component Test', () => {
  before(async () => {
    setFixturePath('example/expressJs/test/fixtures');
    await startAppServer();
  });
  after(async () => await stopAppServer());
  beforeEach(async () => await setup());
  afterEach(async () => await teardown());

  it('return value from application server', async () => {
    await gangster
      .given([])
      .get('/hello', { 'Content-Type': 'application/json' })
      .expectResponse(200, { status: 'Hello World' })
      .run();
  });

  it('return the value from downstream rest api', async () => {
    await gangster
      .given([
        downstream.get('/api/sayhello').returns(200, fixture('sayhello/response.json')),
      ])
      .get('/downstream', { 'Content-Type': 'application/json' })
      .expectResponse(200, { status: 'Bonjourno' })
      .run();
  });
});
