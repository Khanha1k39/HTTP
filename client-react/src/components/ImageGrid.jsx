import styles from './ImageGrid.module.css';

export default function ImageGrid({ requests }) {
  if (!requests.length) return null;

  return (
    <div className={styles.grid}>
      {requests.map(req => (
        <div
          key={req.index}
          className={`${styles.slot} ${req.timedOut ? styles.timedOut : ''} ${req.error ? styles.errored : ''}`}
          title={req.timedOut ? `Timeout` : req.name}
        >
          {req.src ? (
            <img src={req.src} alt={req.name} className={styles.img} />
          ) : (
            <span className={styles.placeholder}>
              {req.timedOut ? '⏱' : req.error ? '✗' : req.start ? '…' : '·'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
