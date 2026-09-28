import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 3000);

const server = createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/api/v1/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ data: { status: 'ok' } }));
    return;
  }

  response.writeHead(404, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }));
});

server.listen(port, () => {
  console.log(`Peerup API listening on http://localhost:${port}`);
});
