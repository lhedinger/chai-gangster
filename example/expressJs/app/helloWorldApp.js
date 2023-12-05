import fetch from 'node-fetch';
import express from 'express';
import asyncHandler from 'express-async-handler';

export const app = express();
export const port = 3000;

export function buildRoutes(router) {
  router.get('/hello', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ status: 'Hello World' }));
    res.end();
  });
  router.get(
    '/downstream',
    asyncHandler(async (req, res) => {
      const response = await callAnApi();
      res.send(response);
    })
  );
}

async function callAnApi() {
  const url = 'http://example.com/api';
  const response = await fetch(url);
  return await response.text();
}
