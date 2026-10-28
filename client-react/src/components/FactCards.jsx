import styles from './FactCards.module.css';

const FACTS = [
  { icon: '🔀', title: 'Multiplexing',
    body: <>HTTP/2 gửi <strong>nhiều request song song</strong> trên 1 TCP connection. HTTP/1.1 bị giới hạn <strong>6 connections</strong> mỗi domain.</> },
  { icon: '🗜️', title: 'Header Compression (HPACK)',
    body: <>HTTP/2 nén headers bằng HPACK, giảm <strong>85–95%</strong> kích thước header so với HTTP/1.1 plain text.</> },
  { icon: '⚙️', title: 'Binary Protocol',
    body: <>HTTP/2 dùng <strong>binary framing</strong> thay vì text, giúp parse nhanh hơn và ít lỗi hơn.</> },
  { icon: '🚦', title: 'Head-of-Line Blocking',
    body: <>HTTP/1.1 bị <strong>HOL blocking</strong>: request sau phải chờ request trước hoàn thành trên cùng connection.</> },
  { icon: '📡', title: 'Server Push',
    body: <>HTTP/2 cho phép server <strong>chủ động gửi</strong> tài nguyên trước khi client request (Server Push).</> },
  { icon: '🔒', title: 'HTTPS Required',
    body: <>Trên thực tế, HTTP/2 <strong>yêu cầu TLS</strong> trên hầu hết browser. HTTP/1.1 vẫn hoạt động qua HTTP thường.</> },
];

export default function FactCards() {
  return (
    <div className={styles.grid}>
      {FACTS.map(f => (
        <div key={f.title} className={styles.card}>
          <div className={styles.icon}>{f.icon}</div>
          <div className={styles.title}>{f.title}</div>
          <p>{f.body}</p>
        </div>
      ))}
    </div>
  );
}
