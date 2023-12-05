import { bootstrap as setProxy } from 'global-agent';

import allStubs from './stubs/index.js';
import Gangster from './gangster.js';
import { getConfig } from './config.js';

export const gangster = new Gangster();
export const stubs = allStubs;

function rewriteRestCallsToMockServer(conf) {
  process.env.GLOBAL_AGENT_NO_PROXY = `localhost:${conf.app.port},127.0.0.1:${conf.app.port}`;
  process.env.GLOBAL_AGENT_HTTP_PROXY = `http://localhost:${conf.mockServerPort}`;
  setProxy();
}

export async function setup() {
  const config = getConfig();
  rewriteRestCallsToMockServer(config);
  await stubs.rest.startMockServer(config.mockServerPort);
}

export async function teardown() {
  await stubs.rest.stopMockServer();
}
