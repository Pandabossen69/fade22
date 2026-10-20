// Lokal server: dist/ + api/-funktionerna (samma Web-Request/Response som på Vercel). Bokningar sparas i data/bookings.json.
//   npm run build && ADMIN_PASSWORD=hemligt123 npm run dev      → http://localhost:3000
import http from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 3000);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const file = join(ROOT, normalize(url.pathname).replace(/\/$/, '') + '.js');
      if (!file.startsWith(join(ROOT, 'api')) || !existsSync(file)) { res.writeHead(404).end(); return; }
      const mod = await import(pathToFileURL(file).href);
      const fn = mod[req.method];
      if (!fn) { res.writeHead(405).end(); return; }
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
      const out = await fn(request);
      res.writeHead(out.status, Object.fromEntries(out.headers));
      res.end(Buffer.from(await out.arrayBuffer()));
      return;
    }
    let p = join(DIST, normalize(decodeURIComponent(url.pathname)));
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!p.startsWith(DIST) || !existsSync(p)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }).end(readFileSync(join(DIST, '404.html'))); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }).end(readFileSync(p));
  } catch (e) {
    console.error(e);
    res.writeHead(500).end('error');
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
