/**
 * HTTP/1.1 Server - Demo
 * Port: 3001 (HTTP, no TLS needed for HTTP/1.1 demo)
 * Phục vụ 30 ảnh nhỏ qua HTTP/1.1
 *
 * Timeout support:
 *   - SERVER_TIMEOUT_MS  : env var, thời gian tối đa xử lý 1 request (default: 5000ms)
 *   - ?delay=<ms>        : query param, giả lập delay server-side (max = SERVER_TIMEOUT_MS)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const ASSETS_DIR = path.join(__dirname, 'assets');

// ── Timeout config ─────────────────────────────────────────────────────────────
// Thời gian tối đa server cho phép xử lý một request asset (ms)
const SERVER_TIMEOUT_MS = parseInt(process.env.SERVER_TIMEOUT_MS || '5000', 10);

console.log(`⏱️  Request timeout: ${SERVER_TIMEOUT_MS}ms`);

// CORS headers helper
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Timing-Allow-Origin', '*');
  res.setHeader('X-Server-Timeout-Ms', SERVER_TIMEOUT_MS);
}

// Parse query string thủ công (không dùng thêm thư viện)
function parseQuery(url) {
  const idx = url.indexOf('?');
  if (idx === -1) return {};
  return Object.fromEntries(new URLSearchParams(url.slice(idx + 1)));
}

const server = http.createServer((req, res) => {
  setCORSHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = req.url.split('?')[0];
  const query   = parseQuery(req.url);

  // Health check — trả về cả timeout config
  if (urlPath === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      protocol: 'HTTP/1.1',
      status: 'ok',
      port: PORT,
      serverTimeoutMs: SERVER_TIMEOUT_MS,
    }));
    return;
  }

  // Serve image assets
  if (urlPath.startsWith('/assets/')) {
    const filename = path.basename(urlPath);
    const filePath = path.join(ASSETS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found', file: filename }));
      return;
    }

    // Delay giả lập từ query param (bị cap bởi SERVER_TIMEOUT_MS)
    const requestedDelay = Math.min(
      parseInt(query.delay || '0', 10) || 0,
      SERVER_TIMEOUT_MS
    );

    // ── Server-side request timeout ────────────────────────────────────────
    let timedOut = false;
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      if (!res.headersSent) {
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Gateway Timeout',
          message: `Request exceeded server timeout of ${SERVER_TIMEOUT_MS}ms`,
          timeoutMs: SERVER_TIMEOUT_MS,
        }));
      }
    }, SERVER_TIMEOUT_MS);

    // Xử lý sau delay
    setTimeout(() => {
      clearTimeout(timeoutHandle);
      if (timedOut || res.destroyed) return; // request đã timeout/bị hủy

      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      const data = fs.readFileSync(filePath);

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': data.length,
        'Cache-Control': 'no-store',
        'X-Protocol': 'HTTP/1.1',
        'X-Served-At': String(Date.now()),
        'X-Delay-Ms': String(requestedDelay),
      });
      res.end(data);
    }, requestedDelay);

    return;
  }

  // List available assets
  if (urlPath === '/assets') {
    const files = fs.readdirSync(ASSETS_DIR).filter(f => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ files, count: files.length }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// ── Socket-level keep-alive timeout (toàn bộ connection) ──────────────────────
server.keepAliveTimeout = 10_000; // 10s
server.headersTimeout   = SERVER_TIMEOUT_MS + 1000;

server.listen(PORT, () => {
  console.log(`🌐 HTTP/1.1 Server running at http://localhost:${PORT}`);
  console.log(`   Assets:  http://localhost:${PORT}/assets`);
  console.log(`   ?delay=<ms> để giả lập độ trễ (vd: /assets/img-01.svg?delay=200)`);
});

server.on('error', (err) => {
  console.error('HTTP/1.1 Server error:', err.message);
});
