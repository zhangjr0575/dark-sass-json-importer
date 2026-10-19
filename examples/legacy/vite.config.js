import path from 'path';
import { defineConfig } from 'vite';
import jsonImporter from '@zhangjr0575/dark-sass-json-importer';

// Legacy API 模式：需要 Vite < 5.4
// 使用 sass.render + 函数式 importer（legacy: true）
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
        importer: jsonImporter({
          legacy: true,
          aliases: { '@': path.resolve(__dirname, '../src') }
        })
      }
    }
  }
});
