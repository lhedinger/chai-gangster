import { RestStub, startMockServer, stopMockServer } from './RestStub.js';

const restStub = {
  get: (status, path, body, headers) =>
    new RestStub('get', path, status, body, headers),
  post: (status, path, body, headers) =>
    new RestStub('post', path, status, body, headers),
  put: (status, path, body, headers) =>
    new RestStub('put', path, status, body, headers),
  delete: (status, path, body, headers) =>
    new RestStub('delete', path, status, body, headers),
};

export const downstream = {
  get: (path) => new RestStub('get', path),
  post: (path) => new RestStub('post', path),
  put: (path) => new RestStub('put', path),
  delete: (path) => new RestStub('delete', path),
};

export default {
  restStub,
  downstream,
  rest: {
    startMockServer,
    stopMockServer,
  },
};
