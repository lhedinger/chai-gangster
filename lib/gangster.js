const assert = require("./assert");
const basicAuth = require("basic-auth");
const qs = require("qs");
const axios = require("axios");
const { getConfig } = require("./config");

class Gangster {
  get(path, headers) {
    this.method = "get";
    this.path = path;
    this.requestHeaders = headers;
    return this;
  }

  post(path, body, headers) {
    this.method = "post";
    this.path = path;
    this.requestBody = body;
    this.requestHeaders = headers;
    return this;
  }

  put(path, body, headers) {
    this.method = "put";
    this.path = path;
    this.requestBody = body;
    this.requestHeaders = headers;
    return this;
  }

  delete(path, body, headers) {
    this.method = "delete";
    this.path = path;
    this.requestBody = body;
    this.requestHeaders = headers;
    return this;
  }

  options(path, headers) {
    this.method = "options";
    this.path = path;
    this.requestHeaders = headers;
    return this;
  }

  response(status, body, headers) {
    return this.expectResponse(status, body, headers, false);
  }

  exactResponseBody(status, body, headers) {
    return this.expectResponse(status, body, headers, true);
  }

  expectResponse(status, body, headers, matchExactResponseBody) {
    this.responseStatus = status;
    this.responseBody = body;
    this.responseHeaders = headers;
    this.matchExactResponseBody = matchExactResponseBody;
    return this;
  }

  stub(spies) {
    this.spies = spies;
    return this;
  }

  async run() {
    // Initialize the providers
    await Promise.all(this.spies.map((provider) => provider.init()));

    // Make the test request to application instance
    const applicationResponse = await callApplication(
      this.method,
      this.path,
      this.requestBody,
      this.requestHeaders
    );

    // Parse the provider responses

    const resolvedProvidersWithSpies = await Promise.all(
      this.spies.map((provider) => provider.spy())
    );

    // Assert the mocked endpoints and response
    await assert(applicationResponse, resolvedProvidersWithSpies, [], this);
    return applicationResponse;
  }
}

async function callApplication(method, path, body, headers = {}) {
  let auth = {};

  if (headers.authorization) {
    const parsedAuthHeader = basicAuth.parse(headers.authorization);
    auth = {
      username: parsedAuthHeader.name,
      password: parsedAuthHeader.pass,
    };
  }

  let data = null;

  // FIXME currently case sensitive
  if (headers["Content-Type"]?.includes("x-www-form-urlencoded")) {
    data = qs.stringify(body);
  } else {
    data = body;
  }

  const request = {
    method,
    data,
    headers,
    url: `${getConfig().app.domain}${path}`,
    auth,
    proxy: null, // null to not inherit the global proxy configs
    validateStatus: () => true,
  };
  const response = await axios.request(request);
  return {
    headers: { ...response.headers },
    data: response.data,
    status: response.status,
  };
}

module.exports = Gangster;
