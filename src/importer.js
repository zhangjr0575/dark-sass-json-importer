/**
 * @fileoverview Sass JSON Importer - 允许在 SCSS/Sass 中直接导入 JSON 文件
 * 
 * 该模块提供了两个主要的导入器工厂函数：
 * - createImporter: 用于新版 Sass API (Dart Sass 1.45.0+)
 * - createLegacyImporter: 用于旧版 Sass API (兼容 node-sass 和旧版 Dart Sass)
 * 
 * 导入器会将 JSON 文件自动转换为 SCSS 变量或 Map，使得 JSON 数据可以在样式表中使用。
 * 
 * @example
 * // 使用新版 API
 * const sass = require('sass');
 * const { createImporter } = require('./importer');
 * 
 * sass.compile('style.scss', {
 *   importers: [createImporter({ asMap: true, aliases: { '@': './data' } })]
 * });
 * 
 * @example
 * // 使用旧版 API
 * const sass = require('node-sass');
 * const { createLegacyImporter } = require('./importer');
 * 
 * sass.render({
 *   file: 'style.scss',
 *   importer: createLegacyImporter({ asMap: false })
 * });
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { jsonToScss } from './converter.js';

/**
 * 创建新版 Sass 导入器（符合 Dart Sass 1.45.0+ Importer API）
 * 
 * @param {Object} options - 配置选项
 * @param {boolean} [options.asMap=false] - 是否将 JSON 对象转换为 SCSS Map（默认为变量）
 * @param {Object<string, string>} [options.aliases={}] - 路径别名映射表
 *   键为别名前缀，值为实际路径。例如：{ '@': './src/data', '~': './assets' }
 * @returns {Object} 符合 Sass Importer 接口的对象，包含 canonicalize 和 load 方法
 */
function createImporter(options = {}) {
  return {
    /**
     * 规范化导入路径 - 将相对路径、别名路径解析为绝对文件 URL
     * 
     * Sass 在遇到 @import 或 @use 语句时会调用此方法。
     * 返回 null 表示该导入器不处理此 URL，Sass 会尝试其他导入器。
     * 
     * @param {string} url - 导入语句中的原始 URL（如 './config.json' 或 '@/theme.json'）
     * @param {Object} context - 导入上下文
     * @param {string} context.containingUrl - 包含此导入语句的文件的 URL
     * @returns {URL|null} 解析后的文件 URL，如果不处理此 URL 则返回 null
     */
    canonicalize(url, context) {
      // 只处理 .json 文件，其他文件交给其他导入器处理
      if (!url.endsWith('.json')) return null;

      let resolvedUrl = url;

      // 应用路径别名（按前缀长度降序匹配，优先匹配更精确的别名）
      // 例如：别名 '@config' 应该优先于 '@' 匹配
      if (options.aliases) {
        const entries = Object.entries(options.aliases)
          .sort((a, b) => b[0].length - a[0].length);
        for (const [alias, target] of entries) {
          // 检查是否完全匹配别名，或者是别名的子路径
          // 同时支持 Unix (/) 和 Windows (\) 路径分隔符
          if (resolvedUrl === alias || resolvedUrl.startsWith(alias + '/') || resolvedUrl.startsWith(alias + '\\')) {
            resolvedUrl = target + resolvedUrl.slice(alias.length);
            break;
          }
        }
      }

      let resolvedPath;
      if (path.isAbsolute(resolvedUrl)) {
        // 绝对路径直接使用
        resolvedPath = resolvedUrl;
      } else if (context && context.containingUrl) {
        // 相对路径：相对于包含此导入语句的文件所在目录解析
        let containingDir;
        try {
          containingDir = path.dirname(fileURLToPath(context.containingUrl));
        } catch {
          // containingUrl 解析失败（可能是非标准 URL 格式），降级到当前工作目录
          containingDir = process.cwd();
        }
        resolvedPath = path.resolve(containingDir, resolvedUrl);
      } else {
        // 没有上下文信息（如从 stdin 导入），相对于当前工作目录解析
        resolvedPath = path.resolve(process.cwd(), resolvedUrl);
      }

      // 文件不存在时返回 null，让 Sass 尝试其他导入器或报错
      if (!fs.existsSync(resolvedPath)) return null;
      return pathToFileURL(resolvedPath);
    },

    /**
     * 加载并转换 JSON 文件 - 读取 JSON 并转换为 SCSS 语法
     * 
     * 在 canonicalize 返回非 null 值后，Sass 会调用此方法获取文件内容。
     * 
     * @param {URL} canonicalUrl - canonicalize 方法返回的规范化文件 URL
     * @returns {Object|null} 包含 SCSS 内容的对象，格式为：
     *   {
     *     contents: string,      // 转换后的 SCSS 代码
     *     syntax: 'scss',        // 语法类型
     *     sourceMapUrl: URL      // 用于源码映射的原始 URL
     *   }
     *   如果无法加载则返回 null
     * @throws {Error} 当文件读取失败或 JSON 解析失败时抛出错误
     */
    load(canonicalUrl) {
      // 将 URL 转换回文件系统路径
      let filePath;
      try {
        filePath = fileURLToPath(canonicalUrl);
      } catch {
        // URL 格式无效，返回 null 让 Sass 处理错误
        return null;
      }

      // 读取 JSON 文件内容
      let rawContent;
      try {
        rawContent = fs.readFileSync(filePath, 'utf-8');
      } catch (err) {
        throw new Error(`无法读取 JSON 文件: ${filePath}\n${err.message}`);
      }

      // 解析 JSON 数据
      let jsonData;
      try {
        jsonData = JSON.parse(rawContent);
      } catch (err) {
        throw new Error(`无效的 JSON 文件: ${filePath}\n${err.message}`);
      }

      // 将 JSON 转换为 SCSS 语法（变量或 Map）
      const basename = path.basename(filePath, '.json');
      const scssContent = jsonToScss(jsonData, {
        asMap: options.asMap,
        filename: basename
      });

      return {
        contents: scssContent,
        syntax: 'scss',
        sourceMapUrl: canonicalUrl
      };
    }
  };
}

/**
 * 创建旧版 Sass 导入器（兼容 node-sass 和 Dart Sass 1.44.0 及更早版本）
 * 
 * 旧版导入器使用回调函数模式，签名为 (url, prev, done)。
 * 该函数内部封装了新版导入器，将其适配为旧版 API。
 * 
 * @param {Object} options - 配置选项（与 createImporter 相同）
 * @param {boolean} [options.asMap=false] - 是否将 JSON 对象转换为 SCSS Map
 * @param {Object<string, string>} [options.aliases={}] - 路径别名映射表
 * @returns {Function} 旧版导入器函数，签名为 (url, prev, done) => void
 * 
 * @example
 * const importer = createLegacyImporter({ asMap: true });
 * sass.render({
 *   file: 'style.scss',
 *   importer: importer
 * }, (err, result) => { ... });
 */
function createLegacyImporter(options = {}) {
  // 创建新版导入器实例，用于复用核心逻辑
  const modern = createImporter(options);

  /**
   * 旧版导入器回调函数
   * 
   * @param {string} url - 导入语句中的路径
   * @param {string} prev - 包含此导入语句的文件路径（'stdin' 表示标准输入）
   * @param {Function} done - 完成回调，调用时传入结果或错误
   */
  return function legacyImporter(url, prev, done) {
    // 构建新版 API 所需的上下文对象
    let context;
    if (prev && prev !== 'stdin') {
      try {
        // 将文件路径转换为 file:// URL 格式
        context = { containingUrl: pathToFileURL(prev) };
      } catch (e) {
        // prev 非合法路径（可能是特殊值），降级走 cwd，不设置 context
      }
    }

    // 调用新版导入器的 canonicalize 方法解析路径
    let canonical;
    try {
      canonical = modern.canonicalize(url, context);
    } catch (e) {
      // 解析失败，通过回调传递错误
      done(e);
      return;
    }

    // canonicalize 返回 null 表示不处理此 URL
    if (!canonical) {
      done(null);
      return;
    }

    // 调用新版导入器的 load 方法加载并转换文件
    try {
      const loaded = modern.load(canonical);
      // 旧版 API 要求返回 { contents, file } 格式
      done({ contents: loaded.contents, file: fileURLToPath(canonical) });
    } catch (e) {
      done(e);
    }
  };
}

export { createImporter, createLegacyImporter };
