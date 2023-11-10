const stubs = require("././stubs/index");
const helpers = require("./helpers");
const Gangster = require("./gangster");

const { getConfig } = require("./config");
const { bootstrap: setProxy } = require("global-agent");

const gangster = new Gangster();

function rewriteRestCallsToMockServer(conf) {
  process.env.GLOBAL_AGENT_NO_PROXY = `localhost:${conf.app.port},127.0.0.1:${conf.app.port}`;
  process.env.GLOBAL_AGENT_HTTP_PROXY = `http://localhost:${conf.mockServerPort}`;
  setProxy();
}

async function setup() {
  const config = getConfig();
  rewriteRestCallsToMockServer(config);
  await stubs.rest.startMockServer(config.mockServerPort);
}

async function teardown() {
  await stubs.rest.stopMockServer();
}

module.exports = {
  gangster,
  stubs,
  helpers,
  setup,
  teardown,
};
