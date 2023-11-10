const express = require("express");
const { buildRoutes } = require("./helloWorldApp");

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

module.exports = bootstrap;
