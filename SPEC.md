# Gangster Component Test Framework - Specification

## Part 1: Framework Behavior (Language-Agnostic)

### 1.1 Overview

Gangster is a black-box component test framework for HTTP-based applications. It
tests an application by starting it locally, intercepting its outbound HTTP calls
via a proxy, and routing them to a built-in mock server. The test author
describes the entire request-response cycle declaratively: what to send to the
application, what the application's downstream dependencies should return, and
what the final response should look like.

### 1.2 Core Concepts

#### Application Under Test (AUT)

The AUT is a locally running HTTP server. Gangster does not manage the AUT's
lifecycle directly -- the test author is responsible for starting and stopping it.
Gangster communicates with the AUT by sending HTTP requests to its configured
domain and port.

#### Mock Server

A local HTTP proxy server intercepts all outbound requests made by the AUT. The
test author registers "stubs" that define what each intercepted endpoint should
return. Any request that does not match a registered stub receives a
`418 I'm a Teapot` response with the body `"This endpoint was not mocked"`.

#### Test Lifecycle

Each test follows this lifecycle:

1. **Setup** - Start the mock server and configure the HTTP proxy so the AUT's
   outbound traffic is routed through it. Requests to the AUT's own
   host/port are excluded from proxying.
2. **Define** - Declare the test using the builder API: the request to send,
   the stubs for downstream dependencies, and the expected response.
3. **Run** - Initialize all stubs on the mock server, send the HTTP request to
   the AUT, collect stub call data, and run assertions.
4. **Teardown** - Stop the mock server and reset all stubs.

A typical test suite calls setup/teardown around each individual test case so
that stubs do not leak between tests.

### 1.3 Builder API

Tests are defined using a fluent (method-chaining) builder. The builder has
four phases that must be called in order:

#### Phase 1: Request

Define the HTTP request to send to the AUT.

| Builder Method                      | Description                                        |
|-------------------------------------|----------------------------------------------------|
| `get(path, headers)`                | Send a GET request                                 |
| `post(path, body, headers)`         | Send a POST request with a body                    |
| `put(path, body, headers)`          | Send a PUT request with a body                     |
| `delete(path, body, headers)`       | Send a DELETE request with a body                  |
| `options(path, headers)`            | Send an OPTIONS request                            |

- `path` is appended to the configured application domain.
- `headers` is a key-value map of HTTP headers.
- `body` can be a JSON-serializable object or a string.

**Basic auth**: If the request headers contain an `authorization` header with a
Basic auth value, the framework parses it and passes the credentials to the
underlying HTTP client as structured auth.

**Form encoding**: If the request headers contain a `Content-Type` of
`x-www-form-urlencoded`, the body is automatically form-encoded before sending.

#### Phase 2: Expected Response

Define what the AUT should respond with.

| Builder Method                            | Description                                       |
|-------------------------------------------|---------------------------------------------------|
| `response(status, body, headers)`         | Assert response contains the given subset          |
| `exactResponseBody(status, body, headers)`| Assert response body matches exactly (deep equal)  |

- **Subset matching** (default): The actual response body must contain all
  fields specified in the expected body, but may contain additional fields.
  This applies to both the body and headers.
- **Exact matching**: The actual response body must be deeply equal to the
  expected body. Status and headers still use subset matching.
- **XML enrichment**: If the response body is a string, the framework attempts
  to parse it as XML and converts it to JSON for comparison. Both the original
  string and the XML-as-JSON representation are made available. If parsing
  fails, the original string is used as-is.

#### Phase 3: Stubs

Provide an array of stubs representing the AUT's downstream dependencies.

| Builder Method   | Description                                 |
|------------------|---------------------------------------------|
| `stub(stubs[])`  | Register an array of downstream dependency stubs |

An empty array is valid when the AUT endpoint has no downstream calls.

#### Phase 4: Execution

| Builder Method | Description                              |
|----------------|------------------------------------------|
| `run()`        | Execute the test (async). Returns the raw application response. |

Execution proceeds as:
1. Initialize all stubs on the mock server (in parallel).
2. Send the HTTP request to the AUT.
3. Collect call data from each stub (in parallel).
4. Run all assertions.

### 1.4 Stub Behavior

A stub represents a single downstream HTTP endpoint that the AUT calls during
the test. Stubs are created via factory methods and configured with a fluent API.

#### Creating Stubs

| Factory Method                          | Description                          |
|-----------------------------------------|--------------------------------------|
| `restStub.get(status, path, body, headers)`    | Stub a GET endpoint            |
| `restStub.post(status, path, body, headers)`   | Stub a POST endpoint           |
| `restStub.put(status, path, body, headers)`    | Stub a PUT endpoint            |
| `restStub.delete(status, path, body, headers)` | Stub a DELETE endpoint         |

- `status` is the HTTP status code the stub returns.
- `path` is the URL path the stub matches. It may be a full URL
  (e.g., `http://example.com/api/foo`) or a relative path (`/api/foo`).
  Query parameters in the path are extracted and matched separately.
- `body` is the response body the stub returns (object or string).
- `headers` are optional response headers.

#### Stub Modifiers

| Modifier                             | Description                                          |
|--------------------------------------|------------------------------------------------------|
| `.times(n)`                          | Expect the stub to be called exactly `n` times       |
| `.never()`                           | Expect the stub to never be called (0 times)         |
| `.always()`                          | Allow the stub to be called any number of times      |
| `.optional()`                        | Do not fail the test if this stub is not called       |
| `.expect(body, headers)`            | Spy on the request: assert the AUT sent the given body and headers |
| `.when(body, headers)`              | Conditional matching: only respond when the request body and headers match |
| `.config(options)`                   | Override stub options (advanced)                     |

#### Call Count Enforcement

By default, every stub is expected to be called **exactly once**. The framework
enforces this after the AUT responds:

- If a required stub was called a different number of times than expected, the
  test fails with a descriptive error listing the expected vs actual call count.
- `.optional()` stubs are exempt from call-count enforcement.
- `.always()` stubs disable call-count enforcement (the stub is registered
  without a times limit on the mock server).

#### Conditional Stubs (`.when()`)

Multiple stubs can be registered for the same path. When `.when(body, headers)`
is used, the mock server applies strict matching: it only responds when the
incoming request's JSON body includes the specified fields and the headers match.
This enables testing endpoints where the AUT makes multiple calls to the same
downstream URL with different payloads, receiving different responses.

#### Request Spying (`.expect()`)

When `.expect(body, headers)` is set on a stub, the framework captures the
first request the stub receives and asserts:

- The request headers contain the expected headers (subset match).
- The request body contains the expected body (subset match). String bodies are
  compared as substrings; object bodies use subset matching.

If the assertion fails, the error message includes the full actual vs expected
values for debugging.

### 1.5 Assertion Behavior

After the AUT responds, the framework runs assertions in this order:

1. **Stub request assertions** - For each stub with `.expect()`, verify the
   request headers and body.
2. **Call count assertions** - For each required stub with a defined expected
   call count, verify it was called the right number of times.
3. **Unmatched request check** - If any outbound requests from the AUT did not
   match a registered stub, fail with a list of unmatched paths.
4. **Response assertion** - Verify the AUT's response status, headers, and body
   match the expected values (subset or exact depending on the builder method).

All stub-related errors are collected and printed before the response assertion
runs, so the test author sees all failures at once rather than one at a time.

### 1.6 Proxy Architecture

The framework uses an HTTP proxy to intercept the AUT's outbound traffic:

- The proxy is configured via environment variables so that all HTTP requests
  from the AUT's process are routed through the mock server.
- Requests to the AUT's own host and port are excluded from proxying (the
  `NO_PROXY` equivalent), so the test's request to the AUT goes directly.
- This approach is transparent to the AUT -- it requires no code changes or
  dependency injection to enable testing.

---

## Part 2: JavaScript Implementation Details

### 2.1 Technology Stack

| Concern             | Library                 |
|---------------------|-------------------------|
| Test runner          | Mocha                   |
| Assertion library    | Chai + chai-subset + chai-as-promised |
| HTTP client (test -> AUT) | Axios              |
| Mock server          | mockttp                 |
| HTTP proxy           | global-agent            |
| XML parsing          | xml2js                  |
| URL query parsing    | qs / URLSearchParams    |

### 2.2 Module Structure

```
lib/
  index.js          - Public API: exports gangster, stubs, setup(), teardown()
  gangster.js       - Gangster class (fluent builder + HTTP client)
  assert.js         - Assertion engine
  config.js         - Configuration loader (app domain, ports)
  helpers.js        - Test utilities (mockDateTime, loadFile, loadJson)
  stubs/
    index.js        - Stub factory functions
    RestStub.js     - RestStub class + mock server management
  utils/
    HeaderUtils.js  - Base64 and Basic Auth encoding/decoding
    UrlUtils.js     - Query string extraction from URL paths
    XmlUtils.js     - XML-to-JSON conversion and XML template rendering
```

### 2.3 Public API

#### Exports from `lib/index.js`

| Export       | Type     | Description                                     |
|--------------|----------|-------------------------------------------------|
| `gangster`   | Object   | Singleton `Gangster` instance for building tests |
| `stubs`      | Object   | Stub factories (`stubs.restStub.get(...)`, etc.) |
| `setup()`    | Function | Start mock server and configure proxy            |
| `teardown()` | Function | Stop mock server                                 |

#### `Gangster` Class (`lib/gangster.js`)

The singleton `gangster` object is reused across tests. Each test overwrites
its properties via the builder methods. The `run()` method:

1. Calls `init()` on every stub (registers it with mockttp).
2. Calls `callApplication()` which builds an Axios request with:
   - Parsed Basic auth from the `authorization` header (if present).
   - Form-encoded body when `Content-Type` includes `x-www-form-urlencoded`.
   - `proxy: null` to prevent Axios from inheriting the global proxy
     (the proxy is handled at the process level by global-agent).
   - `validateStatus: () => true` so non-2xx responses don't throw.
3. Calls `spy()` on every stub to collect request data.
4. Passes everything to `assert()`.

#### `RestStub` Class (`lib/stubs/RestStub.js`)

Each `RestStub` instance holds:

| Property          | Default   | Description                            |
|-------------------|-----------|----------------------------------------|
| `expectedTimes`   | `1`       | How many times the stub should be called |
| `options.requiredCall` | `true` | Whether call-count is enforced        |
| `options.strictMatching` | `false` | Whether to show strict error messages |
| `enableSpy`       | `false`   | Whether `.expect()` assertions are active |

The `init()` method registers the endpoint on the mockttp server:
- Builds a matcher for the HTTP method, path, and query.
- If `.when()` was used, adds `withJsonBodyIncluding()` and `withHeaders()`
  matchers for conditional routing.
- Sets `.times(n)` on the mock unless `expectedTimes` is negative (`.always()`).
- Replies with the configured status, body (JSON-stringified if object), and
  headers.

The `spy()` method retrieves seen requests from mockttp and returns structured
data including the first request's headers, body (JSON or form data), and raw
body string.

#### `assert()` Function (`lib/assert.js`)

Uses `chai.expect` with `chai-subset`'s `.containSubset()` for all subset
matching. Errors from stub assertions are collected into an array, printed to
console, and then asserted to be empty at the end.

The `enrichResponseAndCallData()` helper mutates response and expected data
in-place: if either is a string, it attempts XML-to-JSON conversion and wraps
the result in `{ ORIGINAL, XML_AS_JSON }` for richer diff output.

#### Configuration (`lib/config.js`)

Provides `loadConfig()` and `getConfig()`. Configuration is cached after first
load. Currently returns hardcoded values:

| Key               | Value                    |
|-------------------|--------------------------|
| `app.domain`      | `http://localhost:3003`  |
| `app.port`        | `3003`                   |
| `mockServerPort`  | `3000`                   |

#### Utility Modules

**`HeaderUtils.js`**:
- `encodeBasicAuth(user, password)` - Returns `"Basic <base64>"` string.
- `decodeBase64EncodedJson(value)` - Decodes a base64 string and parses as JSON.
- `encodeAsBase64EncodedJson(obj)` - JSON-stringifies an object and base64-encodes it.
- `isEncodedAsBase64(header)` - Returns `true` if a string matches the base64 pattern.

**`UrlUtils.js`**:
- `queryFromPath(path)` - Splits a path at `?` and returns `{ path, query }`.
  Query is parsed into a plain object via `URLSearchParams`. Returns empty
  `query: {}` if no query string is present.

**`XmlUtils.js`**:
- `xmlToJson(payload, simplified)` - Parses XML string to JSON via xml2js.
  In simplified mode (default): trims whitespace, collapses single-element
  arrays, strips attributes and namespace prefixes, lowercases first character
  of tag names.
- `transformToXml(fields, templateName)` - Reads an XML template file and
  replaces `#key` placeholders with values from the `fields` object. Note:
  the template path is hardcoded to `app/src/shared/clients/mbps_templates/`.

**`helpers.js`**:
- `mockDateTime()` - Freezes `Date.now()` to `2012-01-31T23:30:00.000Z`.
- `loadFile(path)` - Reads a UTF-8 file from `test/data/<path>`.
- `loadJson(path)` - Reads and JSON-parses a file from `test/data/<path>`.

### 2.4 Mock Server Details

The mock server is a single `mockttp.getLocal()` instance (module-level
singleton). On `startMockServer(port)`:

1. The server starts on the given port.
2. A catch-all rule is registered for unmatched requests, returning
   `418 I'm a Teapot`.

On `stopMockServer()`, the server is stopped. Both operations catch and log
errors rather than propagating them.

### 2.5 Test Wiring

A test suite is expected to follow this pattern:

```javascript
import { setup, teardown, gangster, stubs } from 'chai-gangster';

describe('My Component Test', () => {
  before(()  => startMyApp());       // author's responsibility
  after(()   => stopMyApp());        // author's responsibility
  beforeEach(() => setup());         // starts mock server + proxy
  afterEach(()  => teardown());      // stops mock server

  it('does something', async () => {
    await gangster
      .get('/my-endpoint', { 'Content-Type': 'application/json' })
      .response(200, { key: 'value' }, {})
      .stub([
        stubs.restStub.get(200, 'http://dep.com/api', { data: 'mocked' }),
      ])
      .run();
  });
});
```
