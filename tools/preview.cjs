/* designed/corrected by YZ, implemented by openAI */
// Optional localhost preview. The application also opens directly via index.html.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = http.createServer((req, res) => {
  let url;
  try { url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  if (url === '/') url = '/index.html';
  // Serve only public app assets, never logs, source specs, tools or .venv.
  if (url !== '/index.html' && !/^\/(css|js)\/[\w/.-]+\.(css|js)$/.test(url)) { res.writeHead(404).end(); return; }
  const file = path.resolve(root, '.' + url);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, bytes) => {
    if (err) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)], 'Cache-Control': 'no-store' }); res.end(bytes);
  });
});
server.listen(0, '127.0.0.1', () => console.log(`MW Count: http://127.0.0.1:${server.address().port}`));
