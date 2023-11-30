Gangster - A Component Testing Framework
========================================================


## Overview

**Gangster** is a mocha/chai-based component testing framework
for web application servers.

Component, aka Black box testing allows you to write tests from the perspective of a consumer.
It works by starting the application locally and attempting to 
mock downstream dependencies, such as REST services and databases.


## Usage

Gangster inherits the same functionality and structure as the [Mocha](https://mochajs.org/) testing framework.

When properly configured, Ganster is intended to run in the same manner as your unit tests.
Fast, consistent and isolated.

Please see the [example](example) folder for different use-cases.


## Setup

In order to Gangster to work, you need to be able to run the application locally by invoking it with a js/ts function call.
For a simple example with ExpressJS, see [example/expressJs/test](example/expressJs/test/basic.component-test.js).

Any outbound connections (REST, HTTP, ...) need to be proxied over localhost.
For more details see below.

## Configuration

You can place a configuration file on the root level of your project. Gangster will automatically try to load it.

The file can be named either `gangster.js` or `ganster.json`.

```javascript
{
  // properties of your local web application that is spun up before the test
  app: {
    // the domain and port of the local server
    domain: "http://localhost:3003"
    port: 3003
  }
  // the port of the endpoint mock server
  mockServerPort: 3000
}
```

## Writing your first test

Using the builder pattern, you can define a test case:

```javascript
// this is the app server we will be black-box testing
before(async () => await startAppServer(appServerPort));
after(async () => await stopAppServer());
// we should always reset the testing state before each test
beforeEach(async () => await gangster.setup());
afterEach(async () => await gangster.teardown());

// your first test case
it("return value from application server", async () => {
    const expectedResponseBody = {
      status: "Hello World",
    };
    await gangster
      // this is the app's endpoint we will be testing
      .get("/hello")
      // the response we expect from the app endpoint
      .response(200, expectedResponseBody)
      .stub([]) // defines the behavior or responses of external dependencies
      .run(); // executes the test
});
```

Please note that you can move the `before()` and `after()` into the config file 
to reduce the amount of boilerplate for each test suite.

## Gangster API

### invoke / get / put / post / delete

These functions define the starting point of the test.
They call an endpoint of the application under test.

### response()

Define the expected response of the above endpoint.
If the response does not match the provided values, then that test case will fail.

### stub()

This defines a list of endpoints or dependencies you need to mock.
Note that by default unmocked endpoints will return a 418 (I'm a teapot).

## Stubs

Stubs are the objects you can pass into the `stub([])` functions.
They 

### restStub

The most commonly used.
This stub allows you to define mocked endpoints that the application will call.

Supports the functions `get()`, `post()`, `put()`, `delete()`.

### dateStub

_Coming soon._

### cacheStub

_Coming soon._

### databaseStub

_Coming soon._


## FAQ

### What is component testing?

In a microservice architecture, the components are the services themselves. 
By writing tests at this granularity, the contract of the API is driven through tests from the perspective of a consumer.

For more information, see: [Martin Fowler - Component Testing](https://martinfowler.com/articles/microservice-testing/#testing-component-in-process-diagram)
