import { createImporter, createLegacyImporter } from './importer.js';

/**
 * @typedef {Object} JsonImporterOptions
 * @property {boolean} [asMap=false] - 是否将整个 JSON 作为一个 SCSS map 变量导出
 * @property {boolean} [legacy=false] - 返回 legacy 函数式 importer，用于 sass.render({ importer })
 * @property {Record<string, string>} [aliases] - 路径别名映射，key 为别名前缀，value 为实际路径前缀
 */

/**
 * Dart Sass 自定义 Importer，将 JSON 文件导入为 SCSS 变量
 *
 * 根据 `legacy` 选项返回不同格式的 importer：
 * - **Modern 模式**（默认）：返回符合 Dart Sass modern importer 协议的对象，
 *   适配 `sass.compile({ importers })` 及 Vite `api: 'modern-compiler'`
 * - **Legacy 模式**（`legacy: true`）：返回函数式 importer，
 *   适配 `sass.render({ importer })` 及旧版 Vite / HBuilderX
 *
 * @param {JsonImporterOptions} [options={}] - 配置选项
 * @returns {Object | Function} modern importer 对象或 legacy importer 函数
 *
 * @example
 * // Modern 模式（推荐）
 * import jsonImporter from 'dark-sass-json-importer';
 * sass.compile('style.scss', {
 *   importers: [jsonImporter({ asMap: true })]
 * });
 *
 * @example
 * // Legacy 模式
 * import jsonImporter from 'dark-sass-json-importer';
 * sass.render({
 *   file: 'style.scss',
 *   importer: jsonImporter({ legacy: true, asMap: true })
 * });
 */
export default function jsonImporter(options = {}) {
  if (options.legacy) {
    return createLegacyImporter(options);
  }
  return createImporter(options);
}

export { createImporter, createLegacyImporter };
export { convertObject, jsonToScss } from './converter.js';
