import express from 'express';
import { buildRoutes } from './helloWorldApp.js';

let appServerInstance = null;
const appServerPort = 3003;
function bootstrap() {
  const app = express();
  addRoutes(app);
  return app;
}

function addRoutes(app) {
  const router = express.Router();
  buildRoutes(router);
  app.use(router);
}

export async function startAppServer(port = appServerPort) {
  console.log('Starting app server...');
  try {
    // eslint-disable-next-line global-require
    const app = bootstrap();
    appServerInstance = await app.listen(port);
    console.log(`Started app server port=${port}`);
  } catch (err) {
    console.error('Error starting app server', err);
  }
}

export async function stopAppServer() {
  await appServerInstance.close();
  appServerInstance = null;
}
