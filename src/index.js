import { createImporter, createLegacyImporter } from './importer.js';

/**
 * dark-sass-json-importer
 * Dart Sass 自定义 Importer，将 JSON 文件导入为 SCSS 变量
 *
 * @param {Object} [options] - 配置选项
 * @param {boolean} [options.asMap=false] - 是否将整个 JSON 作为一个 map 变量
 * @param {boolean} [options.legacy=false] - 返回 legacy 函数式 importer，用于 sass.render({ importer })
 * @returns {Object|Function} modern importer 对象 或 legacy importer 函数
 */
function jsonImporter(options = {}) {
  // legacy: 返回函数式 importer，适配 sass.render({ importer })
  // 否则返回 modern importer 对象，适配 sass.compile({ importers }) / vite api:'modern-compiler'
  if (options && options.legacy) {
    return createLegacyImporter(options);
  }
  return createImporter(options);
}

export default jsonImporter;
export { createImporter, createLegacyImporter };
