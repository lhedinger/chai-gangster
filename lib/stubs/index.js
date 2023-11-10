const { RestStub, startMockServer, stopMockServer } = require("./RestStub");

const restStub = {
  get: (status, path, body, headers) =>
    new RestStub("get", path, status, body, headers),
  post: (status, path, body, headers) =>
    new RestStub("post", path, status, body, headers),
  put: (status, path, body, headers) =>
    new RestStub("put", path, status, body, headers),
  delete: (status, path, body, headers) =>
    new RestStub("delete", path, status, body, headers),
};

module.exports = {
  restStub,
  rest: {
    startMockServer,
    stopMockServer,
  },
};
