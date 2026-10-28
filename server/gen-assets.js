/**
 * Script tạo 30 ảnh SVG giả lập để demo
 * Mỗi ảnh có màu sắc và số khác nhau
 */
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets');
const COUNT = 100;

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F0B27A', '#82E0AA', '#F1948A', '#85C1E9', '#A9DFBF',
  '#FAD7A0', '#D7BDE2', '#A8D8EA', '#AA96DA', '#FCBAD3',
  '#FFFFD2', '#C4FAF8', '#EAD5DC', '#E6E5F8', '#D8E9A8',
  '#FDE2E4', '#FAD2E1', '#C5DEDD', '#DBE7E4', '#F0EFEB',
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#E8D5B7', '#B5EAD7', '#C7CEEA', '#FF9AA2', '#FFB7B2',
  '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#FF9AA2',
  '#A8E6CF', '#DCEDC1', '#FFD3B6', '#FFAAA5', '#FF8B94',
  '#A0C4FF', '#BDB2FF', '#FFC6FF', '#CAFFBF', '#FDFFB6',
  '#FFD6A5', '#FFADAD', '#9BF6FF', '#FFCBF2', '#F3C5FF',
  '#D8BBFF', '#B8C0FF', '#BBD0FF', '#C1E1C1', '#E1C1C1',
  '#C1C1E1', '#E1E1C1', '#D4E1C1', '#C1D4E1', '#E1C1D4',
  '#F9C74F', '#90BE6D', '#43AA8B', '#4D908E', '#577590',
  '#277DA1', '#F94144', '#F3722C', '#F8961E', '#F9844A',
  '#80B918', '#55A630', '#2DC653', '#006400', '#007F5F',
];

const icons = [
  '🎨', '🚀', '⚡', '🌈', '🎯', '💡', '🔥', '🎪', '🌟', '💎',
  '🎭', '🦋', '🌺', '🎸', '🏆', '🎲', '🔮', '🌙', '☀️', '🌊',
  '🦊', '🐬', '🦜', '🌵', '🍀', '🎋', '🌸', '🦩', '🐙', '🦁',
  '🐯', '🐸', '🦄', '🐳', '🦋', '🌻', '🍁', '🍄', '🎃', '🎄',
  '🎠', '🎡', '🎢', '🎰', '🎳', '🎻', '🥁', '🎷', '🎺', '🪗',
  '🚂', '🚀', '✈️', '🚁', '🛸', '⛵', '🚢', '🏎️', '🛺', '🚲',
  '🌍', '🌏', '🌎', '🗺️', '🧭', '🏔️', '🌋', '🏜️', '🏝️', '🌅',
  '🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍒', '🥭', '🍍', '🥝',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓',
  '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶',
];

for (let i = 1; i <= COUNT; i++) {
  const color = colors[i - 1] || '#888';
  const darkColor = color + 'CC';
  const icon = icons[i - 1] || '●';
  
  // Tạo ảnh SVG với kích thước ngẫu nhiên 100-200px để giả lập ảnh thật
  const size = 120 + (i % 5) * 20; // 120, 140, 160, 180, 200
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkColor};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow${i}">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="16" fill="url(#grad${i})"/>
  
  <!-- Pattern -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 10}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 25}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
  
  <!-- Number badge -->
  <circle cx="${size - 20}" cy="20" r="14" fill="rgba(0,0,0,0.3)" filter="url(#shadow${i})"/>
  <text x="${size - 20}" y="25" font-family="Arial, sans-serif" font-size="12" font-weight="bold" 
        fill="white" text-anchor="middle">${i}</text>
  
  <!-- Icon (as text) -->
  <text x="${size/2}" y="${size/2 + 5}" font-size="${size/3}" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  
  <!-- Label -->
  <text x="${size/2}" y="${size - 12}" font-family="Arial, sans-serif" font-size="11" font-weight="500"
        fill="rgba(255,255,255,0.9)" text-anchor="middle">img-${String(i).padStart(2, '0')}</text>
</svg>`;

  // Thêm padding bytes giả lập để ảnh có kích thước tương đương ảnh thật (~5-15KB)
  // Trong demo thực tế, bạn có thể thay bằng ảnh thật
  const paddingComment = `\n<!-- ${' '.repeat(Math.floor(Math.random() * 3000 + 2000))} -->`;
  const fullSvg = svg + paddingComment;
  
  const filename = `img-${String(i).padStart(2, '0')}.svg`;
  fs.writeFileSync(path.join(ASSETS_DIR, filename), fullSvg);
}

console.log(`✅ Generated ${COUNT} SVG images in ${ASSETS_DIR}`);
console.log(`   Total size: ${(fs.readdirSync(ASSETS_DIR).reduce((sum, f) => sum + fs.statSync(path.join(ASSETS_DIR, f)).size, 0) / 1024).toFixed(1)} KB`);
