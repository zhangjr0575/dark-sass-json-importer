const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const entryPoint = path.join(rootDir, 'src', 'index.js');

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

const sharedOptions = {
  entryPoints: [entryPoint],
  bundle: true,
  platform: 'node',
  target: 'node14',
  external: ['sass'],
};

async function build() {
  // ESM build → dist/index.mjs
  await esbuild.build({
    ...sharedOptions,
    outfile: path.join(distDir, 'index.mjs'),
    format: 'esm',
  });

  // CJS build → dist/index.cjs
  await esbuild.build({
    ...sharedOptions,
    outfile: path.join(distDir, 'index.cjs'),
    format: 'cjs',
  });

  console.log('Build complete:');
  console.log('  ESM  → dist/index.mjs');
  console.log('  CJS  → dist/index.cjs');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});


