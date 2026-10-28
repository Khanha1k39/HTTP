import styles from './ModeTabs.module.css';

const MODES = [
  { id: 'compare', label: '⚖️ So sánh'       },
  { id: 'h1only',  label: '🔴 HTTP/1.1 Only' },
  { id: 'h2only',  label: '🔵 HTTP/2 Only'   },
];

export default function ModeTabs({ mode, onChange, disabled }) {
  return (
    <div className={styles.tabs}>
      {MODES.map(m => (
        <button
          key={m.id}
          className={`${styles.tab} ${mode === m.id ? styles.active : ''}`}
          onClick={() => onChange(m.id)}
          disabled={disabled}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
