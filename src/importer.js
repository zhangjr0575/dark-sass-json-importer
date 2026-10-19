import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { jsonToScss } from './converter.js';

function createImporter(options = {}) {
  return {
    canonicalize(url, context) {
      if (!url.endsWith('.json')) return null;

      let resolvedUrl = url;
      if (options.aliases) {
        const entries = Object.entries(options.aliases)
          .sort((a, b) => b[0].length - a[0].length);
        for (const [alias, target] of entries) {
          if (resolvedUrl === alias || resolvedUrl.startsWith(alias + '/') || resolvedUrl.startsWith(alias + '\\')) {
            resolvedUrl = target + resolvedUrl.slice(alias.length);
            break;
          }
        }
      }

      let resolvedPath;
      if (path.isAbsolute(resolvedUrl)) {
        resolvedPath = resolvedUrl;
      } else if (context && context.containingUrl) {
        let containingDir;
        try {
          containingDir = path.dirname(fileURLToPath(context.containingUrl));
        } catch {
          containingDir = process.cwd();
        }
        resolvedPath = path.resolve(containingDir, resolvedUrl);
      } else {
        resolvedPath = path.resolve(process.cwd(), resolvedUrl);
      }

      if (!fs.existsSync(resolvedPath)) return null;
      return pathToFileURL(resolvedPath);
    },

    load(canonicalUrl) {
      let filePath;
      try {
        filePath = fileURLToPath(canonicalUrl);
      } catch {
        return null;
      }

      let rawContent;
      try {
        rawContent = fs.readFileSync(filePath, 'utf-8');
      } catch (err) {
        throw new Error(`无法读取 JSON 文件: ${filePath}\n${err.message}`);
      }

      let jsonData;
      try {
        jsonData = JSON.parse(rawContent);
      } catch (err) {
        throw new Error(`无效的 JSON 文件: ${filePath}\n${err.message}`);
      }

      const basename = path.basename(filePath, '.json');
      const scssContent = jsonToScss(jsonData, {
        asMap: options.asMap || false,
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
 * 创建 Legacy 函数式 Importer
 *
 * 适配 sass.render() 的 `importer` 字段（函数式，回调签名
 * `(url, prev, done) => void`）。内部复用 modern importer 的
 * canonicalize / load，把结果转成 legacy 回调期望的 `{ contents }`。
 *
 * 适用场景：Vite < 5.4、HBuilderX 内置 vite 5.2.x 等
 * 仍走 sass legacy JS API 的环境。
 */
function createLegacyImporter(options = {}) {
  const modern = createImporter(options);

  return function legacyImporter(url, prev, done) {
    let context;
    if (prev && prev !== 'stdin') {
      try {
        context = { containingUrl: pathToFileURL(prev) };
      } catch (e) {
        // prev 非合法路径，降级走 cwd
      }
    }

    let canonical;
    try {
      canonical = modern.canonicalize(url, context);
    } catch (e) {
      done(e);
      return;
    }

    if (!canonical) {
      done(null);
      return;
    }

    try {
      const loaded = modern.load(canonical);
      done({ contents: loaded.contents, file: fileURLToPath(canonical) });
    } catch (e) {
      done(e);
    }
  };
}

export { createImporter, createLegacyImporter };
