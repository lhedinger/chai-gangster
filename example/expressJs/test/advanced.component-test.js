import {
  setup,
  teardown,
  gangster,
  downstream,
  fixture,
  setFixturePath,
} from '../../../lib/index.js';
import { startAppServer, stopAppServer } from '../app/bootstrap.js';

describe('Advanced Component Test', () => {
  before(async () => {
    setFixturePath('example/expressJs/test/fixtures');
    await startAppServer();
  });
  after(async () => await stopAppServer());
  beforeEach(async () => await setup());
  afterEach(async () => await teardown());

  it('expect value from first call to be passed to second call', async () => {
    await gangster
      .given([
        downstream
          .get('http://example.com/api/isalive')
          .returns(200, fixture('isalive/response.json')),
        downstream
          .post('http://some-db.com/api/store')
          .returns(200, fixture('store/response.json'))
          .expect({ value: 'running' }, { 'content-type': 'application/json' }),
      ])
      .get('/advanced-downstream', { 'Content-Type': 'application/json' })
      .expectResponse(200, fixture('advanced-downstream/expected.json'))
      .run();
  });

  it('expect behavior to be different based on body', async () => {
    await gangster
      .given([
        downstream
          .post('http://example.com/api/getfood')
          .returns(200, fixture('getfood/fruit-response.json'))
          .when({ type: 'fruit' }, { 'Content-Type': 'application/json' }),
        downstream
          .post('http://example.com/api/getfood')
          .returns(200, fixture('getfood/vegetable-response.json'))
          .when({ type: 'vegetable' }, { 'Content-Type': 'application/json' }),
      ])
      .get('/advanced-downstream2', { 'Content-Type': 'application/json' })
      .expectResponse(200, { fruit: 'apple', vegetable: 'carrot' })
      .run();
  });
});
