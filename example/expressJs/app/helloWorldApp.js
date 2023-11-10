/* eslint-disable promise/no-callback-in-promise */

const express = require("express");
const fetch = require("node-fetch");
const asyncHandler = require("express-async-handler");
const app = express();
const port = 3000;

function buildRoutes(router) {
  router.get("/hello", (req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ status: "Hello World" }));
    res.end();
  });
  router.get(
    "/downstream",
    asyncHandler(async (req, res) => {
      const response = await callAnApi();
      res.send(response);
    })
  );
}

async function callAnApi() {
  const url = "http://example.com/api";
  const response = await fetch(url);
  return await response.text();
}

module.exports = { buildRoutes, app, port };
