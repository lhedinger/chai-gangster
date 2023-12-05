let config = null;
export function loadConfig() {
  return {
    // some dummy values
    hello: 'world',
    app: {
      domain: 'http://localhost:3003',
      port: 3003,
    },
    mockServerPort: 3000,
  };
}

export function getConfig() {
  if (!config) {
    config = loadConfig();
  }
  return config;
}
