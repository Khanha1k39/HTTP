export const CONFIG = {
  H1_BASE: 'http://localhost:3001',
  H2_BASE: 'https://localhost:3002',
  TOTAL_IMAGES: 100,
};

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function getImageNames(count) {
  return Array.from({ length: count }, (_, i) => `img-${pad(i + 1)}.svg`);
}

export function fmt(ms) {
  if (ms == null || ms < 0) return '—';
  if (ms >= 1000) return (ms / 1000).toFixed(2) + 's';
  return Math.round(ms) + 'ms';
}
