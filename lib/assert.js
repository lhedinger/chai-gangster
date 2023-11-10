const { xmlToJson } = require("./utils/XmlUtils");

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const chaiSubset = require("chai-subset");
chai.use(chaiAsPromised);
chai.use(chaiSubset);

const expect = chai.expect;

// eslint-disable-next-line sonarjs/cognitive-complexity
async function assert(response, stubs, unmatchedRequestPaths, call) {
  const errors = [];

  stubs.forEach((stub) => {
    if (stub.enableSpy) {
      try {
        expect(stub.firstRequest.headers).containSubset(stub.expectedHeaders);
      } catch (err) {
        errors.push(
          `Endpoint ${
            stub.url
          } was called with the wrong headers:\n${JSON.stringify(
            err.actual,
            null,
            2
          )}\nExpected:\n${JSON.stringify(err.expected, null, 2)}`
        );
      }

      if (stub.expectedBody) {
        try {
          if (typeof stub.expectedBody === "string") {
            expect(stub.firstRequest.bodyStr).containSubset(stub.expectedBody);
          } else {
            expect(stub.firstRequest.body).containSubset(stub.expectedBody);
          }
        } catch (err) {
          errors.push(
            `Endpoint ${
              stub.url
            } was called with the wrong body:\n${JSON.stringify(
              err.actual,
              null,
              2
            )}\nExpected:\n${JSON.stringify(err.expected, null, 2)}`
          );
        }
      }
    }

    if (
      stub.options.requiredCall &&
      stub.expectedTimes >= 0 &&
      stub.wasCalledTimes !== stub.expectedTimes
    ) {
      if (stub.strictMatching) {
        errors.push(
          `Expected strict endpoint be called once, but was called ${
            stub.wasCalledTimes
          } times:\n"${stub.url}"\nExpected body:  ${JSON.stringify(
            stub.expectedBody
          )}\nExpected header:  ${JSON.stringify(stub.expectedHeaders)}`
        );
      } else {
        errors.push(
          `Expected endpoint be called once, but was called ${stub.wasCalledTimes} times:\n"${stub.url}"`
        );
      }
    }
  });

  if (unmatchedRequestPaths.length > 0) {
    errors.push(
      `There are unmatched calls: ${JSON.stringify(
        unmatchedRequestPaths,
        null,
        2
      )}`
    );
  }

  // eslint-disable-next-line no-console -- print errors first so that user can see them all in one go
  errors.forEach((error) => console.warn(error));

  await enrichResponseAndCallData(response, call);

  // Assert response
  expect({
    status: response.status,
    headers: response.headers || {},
    data: response.data,
  }).containSubset({
    status: call.responseStatus,
    headers: call.responseHeaders || {},
    data: call.responseBody,
  });

  if (call.matchExactResponseBody) {
    expect({
      data: response.data,
    }).deep.eq({
      data: call.responseBody,
    });
  }

  // Don't let the test pass if there are warnings
  expect(errors).deep.eq([], "There are mocked endpoint warnings");
}

/**
 * Make encoded or formatted strings more human-readable
 *
 * SIDE-EFFECT: mutates response and call objects
 */
async function enrichResponseAndCallData(response, call) {
  if (typeof response.data === "string") {
    try {
      response.data = {
        ORIGINAL: response.data,
        XML_AS_JSON: await xmlToJson(response.data, false),
      };
      // eslint-disable-next-line no-empty
    } catch (err) {}
  }
  if (typeof call.responseBody === "string") {
    try {
      call.responseBody = {
        ORIGINAL: call.responseBody,
        XML_AS_JSON: await xmlToJson(call.responseBody, false),
      };
      // eslint-disable-next-line no-empty
    } catch (err) {}
  }
}

module.exports = assert;
