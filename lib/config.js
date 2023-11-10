let config = null;
function loadConfig() {
  return {
    // some dummy values
    hello: "world",
    app: {
      domain: "http://localhost:3003",
      port: 3003,
    },
    mockServerPort: 3000,
  };
}

function getConfig() {
  if (!config) {
    config = loadConfig();
  }
  return config;
}

module.exports = {
  loadConfig,
  getConfig,
};
