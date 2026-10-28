import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist-native');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
};
createServer(async (request, response) => {
  try {
    const path = resolve(
      root,
      '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname),
    );
    if (path !== root && !path.startsWith(root + '/')) throw new Error('outside root');
    const target = (await stat(path)).isDirectory() ? path + '/index.html' : path;
    response.setHeader('Content-Type', types[extname(target)] ?? 'application/octet-stream');
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
}).listen(4175, '127.0.0.1');
