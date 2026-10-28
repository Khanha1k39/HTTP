/**
 * HTTP/2 Server - Demo
 * Port: 3002 (HTTPS/TLS required for HTTP/2)
 * Phục vụ 30 ảnh nhỏ qua HTTP/2 với multiplexing
 *
 * Timeout support:
 *   - SERVER_TIMEOUT_MS  : env var, thời gian tối đa xử lý 1 stream (default: 5000ms)
 *   - ?delay=<ms>        : query param, giả lập delay server-side (max = SERVER_TIMEOUT_MS)
 */

const http2 = require('http2');
const fs = require('fs');
const path = require('path');

const PORT = 3002;
const ASSETS_DIR = path.join(__dirname, 'assets');
const CERTS_DIR = path.join(__dirname, 'certs');

// ── Timeout config ─────────────────────────────────────────────────────────────
const SERVER_TIMEOUT_MS = parseInt(process.env.SERVER_TIMEOUT_MS || '5000', 10);

console.log(`⏱️  Request timeout: ${SERVER_TIMEOUT_MS}ms`);

// Load TLS certificates
const serverOptions = {
  key: fs.readFileSync(path.join(CERTS_DIR, 'key.pem')),
  cert: fs.readFileSync(path.join(CERTS_DIR, 'cert.pem')),
  allowHTTP1: true, // fallback cho browser cũ
};

// CORS headers
function setCORSHeaders(headers) {
  return {
    ...headers,
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    'timing-allow-origin': '*',
    'x-server-timeout-ms': String(SERVER_TIMEOUT_MS),
  };
}

// Parse query string từ path
function parseQuery(fullPath) {
  const idx = fullPath.indexOf('?');
  if (idx === -1) return {};
  return Object.fromEntries(new URLSearchParams(fullPath.slice(idx + 1)));
}

const mimeTypes = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const server = http2.createSecureServer(serverOptions);

server.on('stream', (stream, headers) => {
  const method  = headers[':method'];
  const fullPath = headers[':path'] || '';
  const urlPath  = fullPath.split('?')[0];
  const query    = parseQuery(fullPath);

  // OPTIONS preflight
  if (method === 'OPTIONS') {
    stream.respond(setCORSHeaders({ ':status': 204 }));
    stream.end();
    return;
  }

  // Health check — trả về cả timeout config
  if (urlPath === '/ping') {
    const body = JSON.stringify({
      protocol: 'HTTP/2',
      status: 'ok',
      port: PORT,
      serverTimeoutMs: SERVER_TIMEOUT_MS,
    });
    stream.respond(setCORSHeaders({
      ':status': 200,
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(body),
    }));
    stream.end(body);
    return;
  }

  // List available assets
  if (urlPath === '/assets') {
    const files = fs.readdirSync(ASSETS_DIR).filter(f => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f));
    const body = JSON.stringify({ files, count: files.length });
    stream.respond(setCORSHeaders({
      ':status': 200,
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(body),
    }));
    stream.end(body);
    return;
  }

  // Serve image assets
  if (urlPath.startsWith('/assets/')) {
    const filename = path.basename(urlPath);
    const filePath = path.join(ASSETS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      const body = JSON.stringify({ error: 'Not found', file: filename });
      stream.respond(setCORSHeaders({
        ':status': 404,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      }));
      stream.end(body);
      return;
    }

    // Delay giả lập từ query param (bị cap bởi SERVER_TIMEOUT_MS)
    const requestedDelay = Math.min(
      parseInt(query.delay || '0', 10) || 0,
      SERVER_TIMEOUT_MS
    );

    // ── Server-side stream timeout ─────────────────────────────────────────
    let timedOut = false;
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      if (!stream.destroyed) {
        const body = JSON.stringify({
          error: 'Gateway Timeout',
          message: `Stream exceeded server timeout of ${SERVER_TIMEOUT_MS}ms`,
          timeoutMs: SERVER_TIMEOUT_MS,
        });
        try {
          stream.respond(setCORSHeaders({
            ':status': 504,
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
          }));
          stream.end(body);
        } catch (_) { stream.destroy(); }
      }
    }, SERVER_TIMEOUT_MS);

    // Set stream-level timeout (hủy stream nếu không active)
    stream.setTimeout(SERVER_TIMEOUT_MS, () => {
      if (!timedOut && !stream.destroyed) stream.destroy();
    });

    // Xử lý sau delay
    setTimeout(() => {
      clearTimeout(timeoutHandle);
      if (timedOut || stream.destroyed) return;

      const ext = path.extname(filename).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      const data = fs.readFileSync(filePath);

      stream.respond(setCORSHeaders({
        ':status': 200,
        'content-type': contentType,
        'content-length': data.length,
        'cache-control': 'no-store',
        'x-protocol': 'HTTP/2',
        'x-served-at': String(Date.now()),
        'x-delay-ms': String(requestedDelay),
      }));
      stream.end(data);
    }, requestedDelay);

    return;
  }

  stream.respond({ ':status': 404 });
  stream.end('Not found');
});

server.on('error', (err) => {
  console.error('HTTP/2 Server error:', err.message);
});

server.listen(PORT, () => {
  console.log(`⚡ HTTP/2 Server running at https://localhost:${PORT}`);
  console.log(`   Assets:  https://localhost:${PORT}/assets`);
  console.log(`   ⚠️  Accept self-signed cert in browser: https://localhost:${PORT}/ping`);
  console.log(`   ?delay=<ms> để giả lập độ trễ (vd: /assets/img-01.svg?delay=200)`);
});
