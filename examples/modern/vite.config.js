import { defineConfig } from 'vite';
import jsonImporter from 'dark-sass-json-importer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Modern API 模式：需要 Vite >= 5.4
// 使用 sass.compile（modern JS API），importer 为对象式 { canonicalize, load }
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        importers: [jsonImporter({
          aliases: { '@': path.resolve(__dirname, 'src') }
        })]
      }
    }
  }
});
