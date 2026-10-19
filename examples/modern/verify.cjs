// 验证 Modern API：vite build 后检查 dist/assets/*.css 是否包含 JSON 注入的变量值
const fs = require('fs');
const path = require('path');

const assetsDir = path.resolve(__dirname, 'dist/assets');
if (!fs.existsSync(assetsDir)) {
  console.error('✗ dist/assets 不存在，请先执行 npm run build');
  process.exit(1);
}

const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
if (cssFiles.length === 0) {
  console.error('✗ 未找到 CSS 产物');
  process.exit(1);
}

const css = fs.readFileSync(path.join(assetsDir, cssFiles[0]), 'utf-8');

const checks = [
  { name: 'primaryColor',  needle: '#007aff' },
  { name: 'mutedColor',    needle: '#7a7e83' },
  { name: 'boxBgColor',    needle: '#f8f8f8' },
  { name: 'fontSize→16px', needle: '16px' }
];

let ok = true;
for (const c of checks) {
  const found = css.includes(c.needle);
  console.log(`${found ? '✓' : '✗'} ${c.name} → ${c.needle}`);
  if (!found) ok = false;
}

console.log(ok ? '\n✓ Modern API 验证通过' : '\n✗ Modern API 验证失败');
process.exit(ok ? 0 : 1);
