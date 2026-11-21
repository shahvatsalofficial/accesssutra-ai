import http from 'node:http';
import { readFile, lstat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
const equal = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const LOOPBACK = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
const HOST_OK = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i;
const FILES = { '/reports': ['assessment.json', 'application/json; charset=utf-8'], '/reports/markdown': ['assessment.md', 'text/plain; charset=utf-8'], '/reports/html': ['assessment.html', 'text/html; charset=utf-8'] };

/** Read-only loopback API over one report directory. Bearer token, GET only, no CORS, rate limited. */
export function createReportServer({ dir, token, port = 0, rateLimit = 100 } = {}) {
  if (typeof token !== 'string' || token.length < 24) throw new Error('Bearer token must have at least 24 characters');
  if (!dir) throw new Error('Report directory required');
  const root = resolve(dir); const requests = new Map();
  const server = http.createServer(async (req, res) => {
    const respond = (status, data, type = 'application/json; charset=utf-8') => {
      res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox", 'referrer-policy': 'no-referrer' });
      res.end(typeof data === 'string' ? data : JSON.stringify(data));
    };
    if (!LOOPBACK.includes(req.socket.remoteAddress)) return respond(403, { error: 'Loopback only' });
    if (!HOST_OK.test(req.headers.host ?? '')) return respond(403, { error: 'Host header not allowed' });
    const now = Date.now(), ip = req.socket.remoteAddress, entry = requests.get(ip) ?? { count: 0, since: now };
    if (now - entry.since > 60000) { entry.count = 0; entry.since = now; } entry.count++; requests.set(ip, entry);
    if (entry.count > rateLimit) return respond(429, { error: 'Rate limited' });
    if (!equal(req.headers.authorization ?? '', `Bearer ${token}`)) return respond(401, { error: 'Unauthorized' });
    if (req.method !== 'GET') return respond(405, { error: 'Read only' });
    let path; try { path = new URL(req.url, 'http://localhost').pathname; } catch { return respond(400, { error: 'Invalid URL' }); }
    if (path === '/health') return respond(200, { ok: true, mode: 'loopback-read-only' });
    const spec = FILES[path];
    if (!spec) return respond(404, { error: 'Unknown endpoint' });
    const file = resolve(root, spec[0]);
    if (!file.startsWith(root + sep)) return respond(403, { error: 'Invalid path' });
    try {
      const stat = await lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2 * 1024 * 1024) return respond(403, { error: 'Report unavailable' });
      const text = await readFile(file, 'utf8');
      if (path === '/reports') return respond(200, JSON.parse(text));
      return respond(200, text, spec[1]);
    } catch { return respond(404, { error: 'Report not found' }); }
  });
  return { server, listen: () => new Promise((ok, fail) => { server.once('error', fail); server.listen(port, '127.0.0.1', () => ok(server.address())); }) };
}
