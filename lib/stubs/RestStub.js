const clone = require("lodash.clonedeep");
const mockttp = require("mockttp");
const { StatusCodes } = require("http-status-codes");
const { queryFromPath } = require("../utils/UrlUtils");

class RestStub {
  state = {};

  constructor(method, path, status, body, headers) {
    this.method = method;
    this.path = path;
    this.status = status;
    this.body = body;
    this.headers = headers;
    this.expectedTimes = 1;
    this.options = { requiredCall: true, strictMatching: false };
    this.enableSpy = false;
  }

  times(times) {
    this.expectedTimes = times;
    return this;
  }

  never() {
    this.expectedTimes = 0;
    return this;
  }

  optional() {
    this.options.requiredCall = false;
    return this;
  }

  always() {
    this.expectedTimes = -1;
    return this;
  }

  /** Validates headers and body in assertion step */
  expect(expectBody, expectHeaders) {
    this.expectedHeaders = cleanHeaders(expectHeaders) || {};
    this.expectedBody = expectBody;
    this.enableSpy = true;
    return this;
  }

  config(options) {
    this.options = options;
    return this;
  }

  async init() {
    this.state = await initiateProvider(this);
  }

  async spy() {
    const requests = await this.state.mock.getSeenRequests();
    return {
      ...this.state,
      url: this.state.pathWithQuery,
      wasCalledTimes: requests.length,
      firstRequest: {
        original: requests[0],
        bodyStr: requests[0]?.body?.text,
        body: requests[0]?.body?.json || requests[0]?.body?.formData,
        headers: requests[0]?.headers,
      },
    };
  }
}

async function initiateProvider(stub) {
  let mockedEndpoint = null;

  mockedEndpoint = await mockEndpoint(
    {
      method: stub.method,
      pathWithQuery: stub.path,
      status: stub.status,
      response: stub.body,
      headers: stub.headers,
      expectedBody: stub.expectedBody,
      expectedHeaders: stub.expectedHeaders,
      expectedTimes: stub.expectedTimes,
    },
    stub.options
  );

  return {
    ...stub,
    mock: mockedEndpoint,
    pathWithQuery: stub.path,
  };
}

/**
 * converts cookie array to string
 * @param headers
 * @returns {*}
 */
function cleanHeaders(headers) {
  if (!headers) {
    return headers;
  }

  const output = clone(headers);

  if (output.cookie) {
    output.cookie = output.cookie.join("; ");
  }

  // if (output.host) {
  //   output.host = `${getConfig().endpointMockServer.host}:${getConfig().endpointMockServer.port}`;
  // }

  return output;
}

const mockServer = mockttp.getLocal();

function mockEndpoint(conf, options) {
  const { query, path } = queryFromPath(conf.pathWithQuery);

  let mockBuilder = null;

  switch (conf.method) {
    case "get":
      mockBuilder = mockServer.forGet(path);
      break;
    case "post":
      mockBuilder = mockServer.forPost(path);
      break;
    case "put":
      mockBuilder = mockServer.forPut(path);
      break;
    case "delete":
      mockBuilder = mockServer.forDelete(path);
      break;
    case "options":
      mockBuilder = mockServer.forOptions(path);
      break;
  }

  if (options.strictMatching) {
    // enabling this will cause the endpoint to be very strict
    mockBuilder = mockBuilder.withJsonBodyIncluding(conf.expectedBody);
    mockBuilder = mockBuilder.withHeaders(conf.expectedHeaders);
  }

  mockBuilder = mockBuilder.withQuery(query);

  if (conf.expectedTimes >= 0) {
    mockBuilder = mockBuilder.times(conf.expectedTimes);
  }

  // returns promise -> once resolved it will register the endpoint on the server
  return mockBuilder.thenReply(
    conf.status,
    typeof conf.response === "string"
      ? conf.response
      : JSON.stringify(conf.response),
    conf.headers
  );
}

async function startMockServer(port) {
  try {
    await mockServer.start(port);
    await mockServer
      .forUnmatchedRequest()
      .thenReply(StatusCodes.IM_A_TEAPOT, "This endpoint was not mocked");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("error starting mock server", err);
  }
}

async function stopMockServer() {
  try {
    await mockServer.stop();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("error stopping mock server", err);
  }
}

module.exports = {
  RestStub,
  startMockServer,
  stopMockServer,
};
