import { setup, teardown, gangster, stubs } from '../../../lib/index.js';
import application from '../app/bootstrap.js';

let appServerInstance = null;
const appServerPort = 3003;

const restStub = stubs.restStub;
describe('Basic Component Test', () => {
  before(async () => await startAppServer(appServerPort));
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
    const expectedResponseBody = 'Bonjourno';
    await gangster
      .get('/downstream', { 'Content-Type': 'application/json' })
      .response(200, expectedResponseBody, {})
      .stub([restStub.get(200, 'example.com/api', 'Bonjourno')])
      .run();
  });
});

async function startAppServer(port) {
  console.log('Starting app server...');
  try {
    // eslint-disable-next-line global-require
    const app = application();
    appServerInstance = await app.listen(port);
    console.log(`Started app server port=${port}`);
  } catch (err) {
    console.error('Error starting app server', err);
  }
}

async function stopAppServer() {
  await appServerInstance.close();
  appServerInstance = null;
}
