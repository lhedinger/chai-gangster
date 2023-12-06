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
      const response = await callGetExample('http://example.com/api/sayhello');
      res.send({
        status: response.word,
      });
    })
  );
  router.get(
    '/advanced-downstream',
    asyncHandler(async (req, res) => {
      const response1 = await callGetExample('http://example.com/api/isalive');
      const response2 = await callPostExample('http://some-db.com/api/store', {
        value: response1.status,
      });
      res.send(
        JSON.stringify({
          status: response1.status,
          id: response2.id,
        })
      );
    })
  );
  router.get(
    '/advanced-downstream2',
    asyncHandler(async (req, res) => {
      const response1 = await callPostExample(
        'http://example.com/api/getfood',
        {
          type: 'fruit',
        }
      );
      const response2 = await callPostExample(
        'http://example.com/api/getfood',
        {
          type: 'vegetable',
        }
      );
      res.send(
        JSON.stringify({
          fruit: response1.food,
          vegetable: response2.food,
        })
      );
    })
  );
}

async function callGetExample(url) {
  const response = await fetch(url);
  return await response.json();
}

async function callPostExample(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  return await response.json();
}
