import styles from './Controls.module.css';

export default function Controls({
  imageCount, onImageCountChange,
  clientTimeout, onClientTimeoutChange,
  serverDelay, onServerDelayChange,
  onStart, onReset,
  running, canReset,
}) {
  return (
    <div className={styles.controls}>
      <label className={styles.sliderGroup}>
        <span>Số ảnh: <strong>{imageCount}</strong></span>
        <input
          type="range" min={10} max={100} step={5} value={imageCount}
          onChange={e => onImageCountChange(Number(e.target.value))}
          disabled={running}
        />
      </label>

      <label className={styles.sliderGroup} title="Client hủy request nếu không phản hồi sau thời gian này">
        <span>⏱ Client timeout: <strong>{clientTimeout === 0 ? 'Tắt' : `${clientTimeout}ms`}</strong></span>
        <input
          type="range" min={0} max={3000} step={100} value={clientTimeout}
          onChange={e => onClientTimeoutChange(Number(e.target.value))}
          disabled={running}
        />
      </label>

      <label className={styles.sliderGroup} title="Server trì hoãn mỗi response (giả lập mạng chậm)">
        <span>🐢 Server delay: <strong>{serverDelay === 0 ? 'Không' : `${serverDelay}ms`}</strong></span>
        <input
          type="range" min={0} max={2000} step={50} value={serverDelay}
          onChange={e => onServerDelayChange(Number(e.target.value))}
          disabled={running}
        />
      </label>

      <div className={styles.btnGroup}>
        <button className={styles.btnPrimary} onClick={onStart} disabled={running}>
          {running ? <><span className={styles.spin}>⟳</span> Đang chạy...</> : '▶ Bắt đầu Demo'}
        </button>
        <button className={styles.btnReset} onClick={onReset} disabled={running || !canReset}>
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
