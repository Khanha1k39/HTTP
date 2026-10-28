import { fmt } from '../config';
import styles from './Summary.module.css';

export default function Summary({ mode, h1State, h2State, imageCount }) {
  const useH1 = mode !== 'h2only';
  const useH2 = mode !== 'h1only';

  const h1Total   = useH1 && h1State.endTime ? h1State.endTime - h1State.startTime : null;
  const h2Total   = useH2 && h2State.endTime ? h2State.endTime - h2State.startTime : null;
  const h1Loaded  = h1State.requests.filter(r => r.duration != null && !r.timedOut).length;
  const h2Loaded  = h2State.requests.filter(r => r.duration != null && !r.timedOut).length;
  const h1Tmo     = h1State.timedOut || 0;
  const h2Tmo     = h2State.timedOut || 0;

  const speedup = (useH1 && useH2 && h1Total && h2Total) ? h1Total / h2Total : null;
  const saved   = speedup ? h1Total - h2Total : null;

  const timeoutNote = n => n > 0 ? ` • ⏱ ${n} timeout` : '';

  return (
    <div className={styles.summary}>
      <h2 className={styles.title}>📊 Kết quả</h2>

      <div className={`${styles.grid} ${!useH1 || !useH2 ? styles.single : ''}`}>
        {useH1 && (
          <div className={`${styles.card} ${styles.cardH1}`}>
            <div className={styles.protoLabel}>HTTP/1.1</div>
            <div className={`${styles.bigTime} ${styles.timeH1}`}>{fmt(h1Total)}</div>
            <div className={styles.detail}>
              {h1Loaded}/{imageCount} ảnh • ~6 connections{timeoutNote(h1Tmo)}
            </div>
          </div>
        )}
        {useH2 && (
          <div className={`${styles.card} ${styles.cardH2}`}>
            <div className={styles.protoLabel}>HTTP/2</div>
            <div className={`${styles.bigTime} ${styles.timeH2}`}>{fmt(h2Total)}</div>
            <div className={styles.detail}>
              {h2Loaded}/{imageCount} ảnh • 1 conn, {imageCount} stream{timeoutNote(h2Tmo)}
            </div>
          </div>
        )}
      </div>

      {speedup != null && (
        <div className={styles.speedupBox}>
          <div className={styles.speedupLabel}>⚡ HTTP/2 nhanh hơn</div>
          <div className={styles.speedupNum}>{speedup.toFixed(2)}×</div>
          <div className={styles.speedupDesc}>
            HTTP/2 nhanh hơn HTTP/1.1 {speedup.toFixed(2)} lần — tiết kiệm {fmt(saved)}
          </div>
        </div>
      )}
    </div>
  );
}
