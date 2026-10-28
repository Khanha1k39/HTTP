import { useEffect, useRef } from 'react';
import { useDemo } from './useDemo';
import { CONFIG } from './config';
import ModeTabs   from './components/ModeTabs';
import Controls   from './components/Controls';
import Panel      from './components/Panel';
import Summary    from './components/Summary';
import FactCards  from './components/FactCards';
import styles from './App.module.css';

export default function App() {
  const {
    mode, setMode,
    imageCount, setImageCount,
    clientTimeout, setClientTimeout,
    serverDelay, setServerDelay,
    running, done,
    h1State, h2State,
    run, reset,
  } = useDemo();

  const useH1 = mode !== 'h2only';
  const useH2 = mode !== 'h1only';

  // Ping HTTP/2 server để check cert
  useEffect(() => {
    fetch(`${CONFIG.H2_BASE}/ping`, { mode: 'cors' })
      .then(r => r.json())
      .then(d => {
        if (d.protocol === 'HTTP/2') {
          const el = document.getElementById('cert-notice');
          if (el) {
            el.style.background    = '#14532d';
            el.style.borderColor   = '#22c55e';
            el.style.color         = '#86efac';
            el.innerHTML = '✅ <strong>HTTP/2 server đã kết nối!</strong> Nhấn <strong>"Bắt đầu Demo"</strong> để chạy.';
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const summaryRef = useRef(null);
  useEffect(() => {
    if (done && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [done]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <h1>
          <span className={styles.h1Label}>HTTP/1.1</span>
          <span className={styles.vs}>VS</span>
          <span className={styles.h2Label}>HTTP/2</span>
        </h1>
        <p>So sánh hiệu năng tải ảnh song song — Multiplexing thực chiến</p>
      </header>

      {/* Cert notice — chỉ hiện khi cần HTTP/2 */}
      {useH2 && (
        <div className={styles.notice} id="cert-notice">
          ⚠️ <strong>Bước đầu tiên:</strong> Mở tab mới →{' '}
          <a href="https://localhost:3002/ping" target="_blank" rel="noreferrer">
            https://localhost:3002/ping
          </a>{' '}
          → nhấn <strong>"Advanced" → "Proceed"</strong> để chấp nhận self-signed cert.
        </div>
      )}

      {/* Mode tabs */}
      <ModeTabs mode={mode} onChange={handleModeChange} disabled={running} />

      {/* Controls */}
      <Controls
        imageCount={imageCount}       onImageCountChange={setImageCount}
        clientTimeout={clientTimeout} onClientTimeoutChange={setClientTimeout}
        serverDelay={serverDelay}     onServerDelayChange={setServerDelay}
        onStart={run}
        onReset={reset}
        running={running}
        canReset={done || h1State.loaded > 0 || h2State.loaded > 0}
      />

      {/* Panels */}
      <div className={`${styles.panels} ${!useH1 || !useH2 ? styles.single : ''}`}>
        {useH1 && <Panel proto="h1" protoState={h1State} />}
        {useH2 && <Panel proto="h2" protoState={h2State} />}
      </div>

      {/* Summary */}
      {done && (
        <div ref={summaryRef}>
          <Summary
            mode={mode}
            h1State={h1State}
            h2State={h2State}
            imageCount={imageCount}
          />
        </div>
      )}

      {/* Facts */}
      <FactCards />
    </div>
  );
}
