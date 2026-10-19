const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// 清空 dist 目录
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

async function build() {
  // CommonJS 构建：从 ESM 源码打包为 CJS（import → require / export → module.exports）
  await esbuild.build({
    bundle: true,
    platform: 'node',
    target: 'node14',
    minify: true,
    sourcemap: false,
    legalComments: 'none',
    logLevel: 'info',
    entryPoints: [path.join(rootDir, 'src/index.js')],
    format: 'cjs',
    outfile: path.join(distDir, 'index.cjs'),
    external: ['fs', 'path', 'url'],
    // ESM 源码用 `export default jsonImporter`。esbuild 把 default
    // 导出挂到 `module.exports.default`，但旧测试 / 消费方期望
    // `require(...)` 直接返回函数。这里在 footer 把 default 提到
    // module.exports，同时把具名导出（createImporter / createLegacyImporter）
    // 挂到函数上，保证 `require('...').createImporter` 仍可用。
    footer: {
      js: 'var _exp = module.exports; if (_exp.default) { var _fn = _exp.default; _fn.createImporter = _exp.createImporter; _fn.createLegacyImporter = _exp.createLegacyImporter; _fn.default = _fn; module.exports = _fn; }'
    }
  });
  console.log('✓ CJS → dist/index.cjs');

  // ESM 构建：保留源码原生 ESM import 语法
  await esbuild.build({
    bundle: true,
    platform: 'node',
    target: 'node14',
    minify: true,
    sourcemap: false,
    legalComments: 'none',
    logLevel: 'info',
    entryPoints: [path.join(rootDir, 'src/index.js')],
    format: 'esm',
    outfile: path.join(distDir, 'index.mjs'),
    // 外部化 Node 内置模块，esbuild 原生保留为 ESM import
    external: ['fs', 'path', 'url']
  });
  console.log('✓ ESM → dist/index.mjs');

  // converter 独立构建（供单测直接引用，不暴露到包公开 API）
  await esbuild.build({
    bundle: true,
    platform: 'node',
    target: 'node14',
    minify: true,
    sourcemap: false,
    legalComments: 'none',
    logLevel: 'info',
    entryPoints: [path.join(rootDir, 'src/converter.js')],
    format: 'cjs',
    outfile: path.join(distDir, 'converter.cjs'),
    external: ['fs', 'path', 'url']
  });
  console.log('✓ CJS → dist/converter.cjs');

  console.log('\nBuild complete!');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
