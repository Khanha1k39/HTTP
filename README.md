# HTTP/1.1 vs HTTP/2 — React Demo Project 🚀

Dự án demo trực quan bằng **React + Vite** so sánh hiệu năng giữa **HTTP/1.1** và **HTTP/2 (Multiplexing)** qua việc tải 10–100 ảnh song song với biểu đồ Waterfall thời gian thực.

---

## ⚡ Tính năng nổi bật

1. **3 Chế độ linh hoạt:**
   - ⚖️ **So sánh (Compare):** Chạy đồng thời cả HTTP/1.1 và HTTP/2 để đối đầu trực tiếp.
   - 🔴 **HTTP/1.1 Only:** Xem cơ chế tuần tự (tối đa ~6 connection đồng thời do trình duyệt giới hạn).
   - 🔵 **HTTP/2 Only:** Xem cơ chế ghép kênh (Multiplexing) trên duy nhất 1 TCP connection.
2. **Quy mô:** Slider tùy chọn từ **10 đến 100 ảnh SVG**.
3. **Cơ chế Timeout & Delay:**
   - ⏱ **Client Timeout:** Slider tùy chỉnh thời gian timeout (AbortController / hủy tải ảnh, hiển thị badge vàng ⏱).
   - 🐢 **Server Delay:** Tùy biến giả lập độ trễ mạng phía backend.
4. **Trực quan hóa:**
   - Biểu đồ Waterfall live cho từng request.
   - Thống kê thời gian tải chính xác theo mili-giây.
   - Thẻ Summary tính tỷ lệ tăng tốc (speedup ratio `Nx`).

---

## 🛠️ Cấu trúc dự án

```
D:\http-demo/
├── start.js                # Script 1 lệnh khởi động cả 2 BE server và React FE
├── package.json
├── client-react/           # Frontend React (Vite + CSS Modules)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ModeTabs.jsx     # Tabs chuyển đổi 3 chế độ
│   │   │   ├── Controls.jsx     # Sliders (ảnh, timeout, delay) & nút bấm
│   │   │   ├── Panel.jsx        # Khung hiển thị từng protocol
│   │   │   ├── Waterfall.jsx    # Biểu đồ Waterfall
│   │   │   ├── ImageGrid.jsx    # Lưới ảnh live preview
│   │   │   ├── Summary.jsx      # Thống kê & so sánh tốc độ
│   │   │   └── FactCards.jsx    # Kiến thức cốt lõi về HTTP/2
│   │   ├── useDemo.js           # Custom hook quản lý state & luồng fetch
│   │   ├── config.js            # Cấu hình ports, helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── server/                 # Backend Node.js
    ├── http1-server.js     # HTTP/1.1 Server (Port 3001)
    ├── http2-server.js     # HTTP/2 Secure Server (Port 3002, HTTPS)
    ├── gen-assets.js       # Script tạo 100 ảnh SVG test
    ├── certs/              # SSL certificate (self-signed)
    └── assets/             # Thư mục chứa 100 ảnh SVG
```

---

## 🚀 Cách chạy dự án

### Cách 1: Chạy tất cả bằng 1 lệnh duy nhất (Khuyên dùng)

```bash
cd D:\http-demo
npm start
# hoặc: node start.js
```

Lệnh này sẽ tự động:
1. Tạo 100 ảnh test nếu chưa có.
2. Bật Backend HTTP/1.1 tại `http://localhost:3001`.
3. Bật Backend HTTP/2 tại `https://localhost:3002`.
4. Bật Frontend React (Vite) tại `http://localhost:5173` và tự động mở trình duyệt!

---

### ⚠️ Lưu ý quan trọng về SSL Certificate (Chỉ cần làm 1 lần)

Do HTTP/2 bắt buộc giao thức bảo mật TLS/HTTPS và dự án sử dụng chứng chỉ tự ký (`localhost`):

1. Mở tab mới trên trình duyệt: **[https://localhost:3002/ping](https://localhost:3002/ping)**
2. Trình duyệt sẽ hiện cảnh báo bảo mật. Bấm **"Nâng cao" (Advanced)** → Bấm **"Tiếp tục truy cập localhost" (Proceed to localhost)**.
3. Khi thấy kết quả JSON `{"protocol":"HTTP/2", ...}`, quay lại trang React `http://localhost:5173` là thông báo sẽ chuyển sang màu xanh lá và bạn có thể chạy mượt mà!

---

### Cách 2: Chạy riêng từng phần (nếu muốn)

- **Frontend React:**
  ```bash
  cd D:\http-demo\client-react
  npm run dev
  ```
- **Backend HTTP/1.1:**
  ```bash
  node D:\http-demo\server\http1-server.js
  ```
- **Backend HTTP/2:**
  ```bash
  node D:\http-demo\server\http2-server.js
  ```
