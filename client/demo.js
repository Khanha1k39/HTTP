/**
 * demo.js — Logic chính của demo HTTP/1.1 vs HTTP/2
 */

// ── Config ──────────────────────────────────────────────────────────────────
const CONFIG = {
  H1_BASE: 'http://localhost:3001',
  H2_BASE: 'https://localhost:3002',
  TOTAL_IMAGES: 100,
  CLIENT_TIMEOUT_MS: 0,
  SERVER_DELAY_MS: 0,
};

// ── State ────────────────────────────────────────────────────────────────────
let state = {
  running: false,
  imageCount: 100,
  clientTimeoutMs: 0,
  serverDelayMs: 0,
  mode: 'compare',        // 'compare' | 'h1only' | 'h2only'
  h1: { requests: [], startTime: null, endTime: null, loaded: 0, timedOut: 0 },
  h2: { requests: [], startTime: null, endTime: null, loaded: 0, timedOut: 0 },
  h1Aborts: [],
  h2Aborts: [],
};

// ── DOM refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const btnStart        = $('btn-start');
const btnReset        = $('btn-reset');
const imgCount        = $('img-count');
const countDisp       = $('count-display');
const certNotice      = $('cert-notice');
const clientTmoInput  = $('client-timeout');
const clientTmoDisp   = $('client-timeout-display');
const serverDelayInput= $('server-delay');
const serverDelayDisp = $('server-delay-display');

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(ms) {
  if (ms == null || ms < 0) return '—';
  if (ms >= 1000) return (ms / 1000).toFixed(2) + 's';
  return Math.round(ms) + 'ms';
}

function pad(n) { return String(n).padStart(2, '0'); }

function getImageNames(count) {
  const names = [];
  for (let i = 1; i <= count; i++) names.push(`img-${pad(i)}.svg`);
  return names;
}

// ── Init UI ──────────────────────────────────────────────────────────────────
function initUI(count) {
  // Reset state
  state.h1 = { requests: [], startTime: null, endTime: null, loaded: 0, timedOut: 0 };
  state.h2 = { requests: [], startTime: null, endTime: null, loaded: 0, timedOut: 0 };
  state.h1Aborts = [];
  state.h2Aborts = [];

  const images = getImageNames(count);

  // Hiển thị/ẩn panels theo mode
  const panelsEl   = document.querySelector('.panels');
  const h1Panel    = document.getElementById('panel-h1');
  const h2Panel    = document.getElementById('panel-h2');
  const summaryEl  = $('summary');

  if (state.mode === 'compare') {
    panelsEl.classList.remove('single');
    h1Panel.style.display = '';
    h2Panel.style.display = '';
  } else if (state.mode === 'h1only') {
    panelsEl.classList.add('single');
    h1Panel.style.display = '';
    h2Panel.style.display = 'none';
  } else {
    panelsEl.classList.add('single');
    h1Panel.style.display = 'none';
    h2Panel.style.display = '';
  }

  // Ẩn summary khi reset
  if (summaryEl) summaryEl.classList.add('hidden');

  // Create request tracking objects (chỉ tạo cho protocol đang dùng)
  const useH1 = state.mode !== 'h2only';
  const useH2 = state.mode !== 'h1only';

  images.forEach((name, i) => {
    if (useH1) state.h1.requests.push({ name, index: i, start: null, end: null, duration: null });
    if (useH2) state.h2.requests.push({ name, index: i, start: null, end: null, duration: null });
  });

  // Render waterfall + images chỉ cho panel hiển thị
  if (useH1) {
    renderWaterfallInit('h1-waterfall', state.h1.requests, 'h1');
    renderImageSlots('h1-images', images, 'h1');
  }
  if (useH2) {
    renderWaterfallInit('h2-waterfall', state.h2.requests, 'h2');
    renderImageSlots('h2-images', images, 'h2');
  }

  // Reset stats
  if (useH1) {
    $('h1-time').textContent = '—';
    $('h1-time').className = 'stat-value';
    $('h1-count').textContent = `0/${count}`;
    $('h1-timeout-count').textContent = '';
    $('h1-progress').style.width = '0%';
  }
  if (useH2) {
    $('h2-time').textContent = '—';
    $('h2-time').className = 'stat-value';
    $('h2-count').textContent = `0/${count}`;
    $('h2-timeout-count').textContent = '';
    $('h2-progress').style.width = '0%';
  }
}

function renderWaterfallInit(containerId, requests, proto) {
  const container = $(containerId);
  container.innerHTML = '';
  requests.forEach((req) => {
    const row = document.createElement('div');
    row.className = 'waterfall-row';
    row.id = `wf-${proto}-${req.index}`;
    row.innerHTML = `
      <span class="row-label" title="${req.name}">${req.name}</span>
      <div class="row-bar-wrap">
        <div class="row-bar bar-pending" id="bar-${proto}-${req.index}" style="width:0%"></div>
      </div>
      <span class="row-duration" id="dur-${proto}-${req.index}">—</span>
    `;
    container.appendChild(row);
  });
}

function renderImageSlots(containerId, images, proto) {
  const container = $(containerId);
  container.innerHTML = '';
  images.forEach((name, i) => {
    const slot = document.createElement('div');
    slot.className = 'img-slot';
    slot.id = `slot-${proto}-${i}`;
    slot.innerHTML = `
      <div class="spinner" id="spin-${proto}-${i}">···</div>
      <img id="img-${proto}-${i}" alt="${name}" />
    `;
    container.appendChild(slot);
  });
}

// ── Waterfall update ─────────────────────────────────────────────────────────
function updateWaterfallBar(proto, index, startTime) {
  const req = state[proto].requests[index];
  if (!req.start || !req.end) return;

  const totalDuration = (state[proto].endTime || Date.now()) - startTime;
  const span = req.end - req.start;
  const offset = req.start - startTime;

  const totalRange = Math.max(totalDuration, 500); // min 500ms range
  const leftPct = (offset / totalRange) * 100;
  const widthPct = Math.max((span / totalRange) * 100, 1);

  const bar = $(`bar-${proto}-${index}`);
  const dur = $(`dur-${proto}-${index}`);

  if (bar) {
    bar.className = `row-bar bar-${proto}`;
    bar.style.left = leftPct + '%';
    bar.style.width = widthPct + '%';
    bar.textContent = span >= 10 ? fmt(span) : '';
  }
  if (dur) dur.textContent = fmt(span);
}

function refreshWaterfall(proto, startTime) {
  state[proto].requests.forEach((req, i) => {
    if (req.start) updateWaterfallBar(proto, i, startTime);
  });
}

// ── Image load (với AbortController timeout) ──────────────────────────────────
function loadImage(proto, base, req, globalStart) {
  return new Promise((resolve) => {
    const delay = state.serverDelayMs > 0 ? `&delay=${state.serverDelayMs}` : '';
    const url   = `${base}/assets/${req.name}?t=${Date.now()}&i=${req.index}${delay}`;
    const img   = new Image();

    req.start = Date.now();
    req.timedOut = false;

    // ── AbortController cho fetch timeout ─────────────────────────────────
    // Image() không hỗ trợ AbortController trực tiếp,
    // nên ta dùng setTimeout để hủy bằng cách set src = '' + resolve sớm.
    let clientTimeoutHandle = null;
    let settled = false;

    const settle = (result) => {
      if (settled) return;
      settled = true;
      if (clientTimeoutHandle) clearTimeout(clientTimeoutHandle);
      resolve(result);
    };

    if (state.clientTimeoutMs > 0) {
      clientTimeoutHandle = setTimeout(() => {
        if (settled) return;
        req.timedOut = true;
        req.end = Date.now();
        req.duration = req.end - req.start;
        img.src = ''; // hủy tải ảnh

        // Cập nhật UI: slot timeout
        const spinner = $(`spin-${proto}-${req.index}`);
        const slot    = $(`slot-${proto}-${req.index}`);
        if (spinner) { spinner.textContent = '⏱'; spinner.style.color = '#f59e0b'; }
        if (slot)    { slot.style.border = '1px solid #f59e0b'; slot.title = `Timeout sau ${state.clientTimeoutMs}ms`; }

        // Cập nhật waterfall bar với màu timeout
        const bar = $(`bar-${proto}-${req.index}`);
        if (bar) bar.classList.add('bar-timeout');

        // Tăng counter timeout
        state[proto].timedOut = (state[proto].timedOut || 0) + 1;
        state[proto].loaded++;
        updateTimeoutBadge(proto);
        updateProgressCount(proto);
        updateWaterfallBar(proto, req.index, globalStart);

        settle({ success: false, timedOut: true, req });
      }, state.clientTimeoutMs);
    }

    img.onload = () => {
      req.end = Date.now();
      req.duration = req.end - req.start;

      // Update image slot
      const slotImg = $(`img-${proto}-${req.index}`);
      const spinner = $(`spin-${proto}-${req.index}`);
      if (slotImg) {
        slotImg.src = img.src;
        slotImg.classList.add('loaded');
      }
      if (spinner) spinner.classList.add('hidden');

      // Update stats
      state[proto].loaded++;
      updateProgressCount(proto);

      // Update waterfall
      updateWaterfallBar(proto, req.index, globalStart);

      settle({ success: true, req });
    };

    img.onerror = () => {
      req.end = Date.now();
      req.duration = req.end - req.start;
      const spinner = $(`spin-${proto}-${req.index}`);
      if (spinner) { spinner.textContent = '✗'; spinner.style.color = '#ef4444'; }
      state[proto].loaded++;
      updateProgressCount(proto);
      settle({ success: false, req });
    };

    img.src = url;
  });
}

// Helper: cập nhật thanh progress + count text
function updateProgressCount(proto) {
  const count = state[proto].requests.length;
  const loaded = state[proto].loaded;
  $(`${proto}-count`).textContent = `${loaded}/${count}`;
  $(`${proto}-progress`).style.width = `${(loaded / count) * 100}%`;
}

// Helper: cập nhật badge số timeout
function updateTimeoutBadge(proto) {
  const el = $(`${proto}-timeout-count`);
  if (!el) return;
  const n = state[proto].timedOut || 0;
  el.textContent = n > 0 ? `⏱ ${n} timeout` : '';
  el.style.display = n > 0 ? 'inline' : 'none';
}

// ── Live timer ───────────────────────────────────────────────────────────────
function startTimer(proto, startTime, doneCallback) {
  const el = $(`${proto}-time`);
  el.className = 'stat-value loading';
  const iv = setInterval(() => {
    if (state[proto].endTime) {
      clearInterval(iv);
      const total = state[proto].endTime - startTime;
      el.textContent = fmt(total);
      el.className = `stat-value done-${proto}`;
      doneCallback();
    } else {
      el.textContent = fmt(Date.now() - startTime);
    }
  }, 50);
  return iv;
}

// ── Run demo ─────────────────────────────────────────────────────────────────
async function runDemo() {
  const count = state.imageCount;

  btnStart.disabled = true;
  btnStart.innerHTML = '<span class="spin-icon">⟳</span> Đang chạy...';
  certNotice.classList.add('hidden');

  initUI(count);

  await new Promise(r => setTimeout(r, 100));

  const globalStart = Date.now();
  const useH1 = state.mode !== 'h2only';
  const useH2 = state.mode !== 'h1only';
  let h1Done = !useH1;  // nếu không chạy H1, coi như đã xong
  let h2Done = !useH2;

  const checkBothDone = () => {
    if (h1Done && h2Done) showSummary();
  };

  const runners = [];

  if (useH1) {
    state.h1.startTime = Date.now();
    startTimer('h1', state.h1.startTime, () => {});
    runners.push(
      (async () => {
        const promises = state.h1.requests.map(req =>
          loadImage('h1', CONFIG.H1_BASE, req, state.h1.startTime)
        );
        const results = await Promise.all(promises);
        state.h1.endTime = Date.now();
        h1Done = true;
        checkBothDone();
        return results;
      })()
    );
  }

  if (useH2) {
    state.h2.startTime = Date.now() + (useH1 ? 5 : 0);
    startTimer('h2', state.h2.startTime, () => {});
    runners.push(
      (async () => {
        const promises = state.h2.requests.map(req =>
          loadImage('h2', CONFIG.H2_BASE, req, state.h2.startTime)
        );
        const results = await Promise.all(promises);
        state.h2.endTime = Date.now();
        h2Done = true;
        checkBothDone();
        return results;
      })()
    );
  }

  await Promise.all(runners);

  if (useH1) refreshWaterfall('h1', state.h1.startTime);
  if (useH2) refreshWaterfall('h2', state.h2.startTime);

  btnStart.disabled = false;
  btnStart.innerHTML = '<span>▶</span> Chạy lại';
  btnReset.disabled = false;
}

// ── Summary ──────────────────────────────────────────────────────────────────
function showSummary() {
  const useH1 = state.mode !== 'h2only';
  const useH2 = state.mode !== 'h1only';

  const h1Total   = useH1 ? (state.h1.endTime - state.h1.startTime) : null;
  const h2Total   = useH2 ? (state.h2.endTime - state.h2.startTime) : null;
  const h1Loaded  = useH1 ? state.h1.requests.filter(r => r.duration != null && !r.timedOut).length : 0;
  const h2Loaded  = useH2 ? state.h2.requests.filter(r => r.duration != null && !r.timedOut).length : 0;
  const h1Timeout = state.h1.timedOut || 0;
  const h2Timeout = state.h2.timedOut || 0;
  const timeoutNote = n => n > 0 ? ` • ⏱ ${n} timeout` : '';

  // Summary cards — ẩn/hiện theo mode
  const sumH1Card = $('sum-card-h1');
  const sumH2Card = $('sum-card-h2');
  const speedupBox = $('speedup-box');

  if (sumH1Card) sumH1Card.style.display = useH1 ? '' : 'none';
  if (sumH2Card) sumH2Card.style.display = useH2 ? '' : 'none';
  if (speedupBox) speedupBox.style.display = (useH1 && useH2) ? '' : 'none';

  if (useH1) {
    $('sum-h1-time').textContent = fmt(h1Total);
    $('sum-h1-detail').textContent = `${h1Loaded}/${state.imageCount} ảnh • ~6 connections song song${timeoutNote(h1Timeout)}`;
  }
  if (useH2) {
    $('sum-h2-time').textContent = fmt(h2Total);
    $('sum-h2-detail').textContent = `${h2Loaded}/${state.imageCount} ảnh • 1 connection, ${state.imageCount} stream${timeoutNote(h2Timeout)}`;
  }

  // Chỉ hiện speedup khi chạy cả 2
  if (useH1 && useH2) {
    const speedup = h1Total / h2Total;
    const saved   = h1Total - h2Total;
    $('speedup').textContent    = speedup.toFixed(2) + '×';
    $('speedup-desc').textContent = `HTTP/2 nhanh hơn HTTP/1.1 ${speedup.toFixed(2)} lần — tiết kiệm ${fmt(saved)}`;
  }

  $('summary').classList.remove('hidden');
  $('summary').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Reset ────────────────────────────────────────────────────────────────────
function resetDemo() {
  initUI(state.imageCount);
  btnStart.disabled = false;
  btnStart.innerHTML = '<span>▶</span> Bắt đầu Demo';
  btnReset.disabled = true;
  certNotice.classList.remove('hidden');
}

// ── Event listeners ───────────────────────────────────────────────────────────
btnStart.addEventListener('click', () => {
  if (!state.running) runDemo();
});

btnReset.addEventListener('click', resetDemo);

imgCount.addEventListener('input', () => {
  state.imageCount = parseInt(imgCount.value);
  countDisp.textContent = state.imageCount;
});

clientTmoInput.addEventListener('input', () => {
  const val = parseInt(clientTmoInput.value);
  state.clientTimeoutMs = val;
  CONFIG.CLIENT_TIMEOUT_MS = val;
  clientTmoDisp.textContent = val === 0 ? 'Tắt' : `${val}ms`;
});

serverDelayInput.addEventListener('input', () => {
  const val = parseInt(serverDelayInput.value);
  state.serverDelayMs = val;
  CONFIG.SERVER_DELAY_MS = val;
  serverDelayDisp.textContent = val === 0 ? 'Không' : `${val}ms`;
});

// Mode tabs
document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const newMode = tab.dataset.mode;
    if (newMode === state.mode) return;

    state.mode = newMode;
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Ẩn cert notice nếu không dùng H2
    if (newMode === 'h1only') {
      certNotice.classList.add('hidden');
    } else {
      certNotice.classList.remove('hidden');
    }

    // Reset UI theo mode mới
    resetDemo();
  });
});

// ── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  state.imageCount = parseInt(imgCount.value);
  initUI(state.imageCount);

  // Check if HTTP/2 server is accessible
  fetch(`${CONFIG.H2_BASE}/ping`, { mode: 'cors' })
    .then(r => r.json())
    .then(d => {
      if (d.protocol === 'HTTP/2') {
        certNotice.innerHTML = '✅ <strong>HTTP/2 server đã kết nối!</strong> Nhấn <strong>"Bắt đầu Demo"</strong> để chạy.';
        certNotice.style.background = '#14532d';
        certNotice.style.borderColor = '#22c55e';
        certNotice.style.color = '#86efac';
      }
    })
    .catch(() => {
      // Server chưa accept cert — giữ nguyên notice
    });
});
