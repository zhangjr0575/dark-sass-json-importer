import path from 'path';
import { defineConfig } from 'vite';
import jsonImporter from '@zhangjr0575/dark-sass-json-importer';

// Modern API 模式：需要 Vite >= 5.4
// 使用 sass.compile（modern JS API），importer 为对象式 { canonicalize, load }
export default defineConfig({
  root: path.resolve(__dirname, '..'),
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, '../index.html')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        importers: [jsonImporter({
          aliases: { '@': path.resolve(__dirname, '../src') }
        })]
      }
    }
  }
});
