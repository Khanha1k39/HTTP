import { fmt } from '../config';
import Waterfall from './Waterfall';
import ImageGrid from './ImageGrid';
import styles from './Panel.module.css';

const META = {
  h1: { label: 'HTTP/1.1', badge: styles.badgeH1, subtitle: 'Tuần tự (max 6 conn)' },
  h2: { label: 'HTTP/2',   badge: styles.badgeH2, subtitle: 'Multiplexing (1 conn)' },
};

export default function Panel({ proto, protoState }) {
  const { label, badge, subtitle } = META[proto];
  const { requests, startTime, endTime, loaded, timedOut } = protoState;
  const count = requests.length;

  const elapsed = startTime
    ? endTime
      ? endTime - startTime
      : Date.now() - startTime   // live update qua _tick
    : null;

  const pct = count > 0 ? (loaded / count) * 100 : 0;

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={`${styles.badge} ${badge}`}>{label}</span>
          <span className={styles.subtitle}>{subtitle}</span>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Thời gian</div>
            <div className={`${styles.statVal} ${startTime && !endTime ? styles.live : endTime ? styles[`done${proto.toUpperCase()}`] : ''}`}>
              {elapsed != null ? fmt(elapsed) : '—'}
            </div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Loaded</div>
            <div className={styles.statVal}>{count > 0 ? `${loaded}/${count}` : '0/0'}</div>
          </div>
          {timedOut > 0 && (
            <div className={styles.timeoutBadge}>⏱ {timedOut} timeout</div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressWrap}>
        <div
          className={`${styles.progressBar} ${styles[`progress${proto.toUpperCase()}`]}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Waterfall */}
      <Waterfall
        requests={requests}
        startTime={startTime}
        endTime={endTime}
        proto={proto}
      />

      {/* Images */}
      <div className={styles.imagesSection}>
        <div className={styles.imagesSectionTitle}>Ảnh đã tải</div>
        <ImageGrid requests={requests} />
      </div>
    </div>
  );
}
