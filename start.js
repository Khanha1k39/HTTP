/**
 * start.js — Khởi động BE (HTTP/1.1, HTTP/2) + FE (React Vite) cùng lúc
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const serverDir = path.join(__dirname, 'server');
const reactDir  = path.join(__dirname, 'client-react');

function startProcess(cmd, args, cwd, label, useShell = false) {
  const proc = spawn(cmd, args, {
    stdio: 'inherit',
    cwd,
    shell: useShell,
  });

  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ [${label}] exited with code ${code}`);
    }
  });

  return proc;
}

console.log('');
console.log('╔═══════════════════════════════════════════════════╗');
console.log('║      HTTP/1.1 vs HTTP/2 — React Demo Project      ║');
console.log('╚═══════════════════════════════════════════════════╝');
console.log('');

// Check assets exist
const assetsDir = path.join(serverDir, 'assets');
const assetCount = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir).filter(f => f.endsWith('.svg')).length
  : 0;

if (assetCount < 100) {
  console.log('📦 Generating 100 SVG assets...');
  require(path.join(serverDir, 'gen-assets.js'));
}

// 1. Start HTTP/1.1 Server
const h1 = startProcess(process.execPath, [path.join(serverDir, 'http1-server.js')], serverDir, 'HTTP/1.1', false);

// 2. Start HTTP/2 Server
const h2 = startProcess(process.execPath, [path.join(serverDir, 'http2-server.js')], serverDir, 'HTTP/2', false);

// 3. Start React Vite Dev Server
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const reactProc = startProcess(npmCmd, ['run', 'dev'], reactDir, 'React Frontend', true);

setTimeout(() => {
  console.log('');
  console.log('───────────────────────────────────────────────────────');
  console.log('🌐  HTTP/1.1 Backend : http://localhost:3001');
  console.log('⚡  HTTP/2 Backend   : https://localhost:3002');
  console.log('⚛️   React Frontend   : http://localhost:5173');
  console.log('───────────────────────────────────────────────────────');
  console.log('');
  console.log('📋 Bước quan trọng (nếu chưa làm):');
  console.log('   Mở tab mới: https://localhost:3002/ping');
  console.log('   → Click "Advanced" / "Nâng cao"');
  console.log('   → Click "Proceed to localhost" để duyệt self-signed cert.');
  console.log('');
  console.log('📌 Nhấn Ctrl+C để dừng toàn bộ hệ thống.');
  console.log('');
}, 1200);

// Graceful shutdown
function shutdown() {
  console.log('\n👋 Đang tắt các server...');
  try { h1.kill(); } catch (_) {}
  try { h2.kill(); } catch (_) {}
  try { reactProc.kill(); } catch (_) {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
