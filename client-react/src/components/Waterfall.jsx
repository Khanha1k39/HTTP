import { useMemo } from 'react';
import { fmt } from '../config';
import styles from './Waterfall.module.css';

export default function Waterfall({ requests, startTime, endTime, proto }) {
  const now = endTime || Date.now();
  const totalRange = Math.max(now - startTime, 300);

  const rows = useMemo(() => requests.map(req => {
    if (!req.start) return { req, barStyle: null, left: 0, width: 0 };
    const span   = (req.end || now) - req.start;
    const offset = req.start - startTime;
    const left   = Math.max(0, (offset / totalRange) * 100);
    const width  = Math.max((span / totalRange) * 100, 0.5);
    return { req, span, left, width };
  }), [requests, startTime, now, totalRange]);

  if (!startTime) return (
    <div className={styles.empty}>Chưa có dữ liệu — nhấn Bắt đầu Demo</div>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span>Request</span><span>Timeline</span><span>ms</span>
      </div>
      <div className={styles.rows}>
        {rows.map(({ req, span, left, width }) => {
          const barClass = req.timedOut
            ? styles.barTimeout
            : req.error
            ? styles.barError
            : req.end
            ? styles[`bar${proto.toUpperCase()}`]
            : styles.barPending;

          return (
            <div key={req.index} className={styles.row}>
              <span className={styles.label} title={req.name}>{req.name}</span>
              <div className={styles.barWrap}>
                {req.start && (
                  <div
                    className={`${styles.bar} ${barClass}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                )}
              </div>
              <span className={styles.dur}>
                {req.timedOut ? '⏱' : req.end ? fmt(span) : req.start ? '…' : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
