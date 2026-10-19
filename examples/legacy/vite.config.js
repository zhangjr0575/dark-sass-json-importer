import { defineConfig } from 'vite';
import jsonImporter from 'dark-sass-json-importer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Legacy API 模式：Vite 5.2.x（HBuilderX 内置版本）
// sass.render + 函数式 importer（legacy: true）
// 注意：不写 api: 'modern-compiler'，Vite 5.2.x 不识别
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        importer: jsonImporter({
          legacy: true,
          aliases: { '@': path.resolve(__dirname, 'src') }
        })
      }
    }
  }
});
