import express from 'express';
import { buildRoutes } from './helloWorldApp.js';

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

export default bootstrap;
