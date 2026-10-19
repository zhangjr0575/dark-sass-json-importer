export interface JsonImporterOptions {
  /** 是否将整个 JSON 作为一个 map 变量，默认 false */
  asMap?: boolean;
  /**
   * 路径别名映射，键为别名前缀，值为目标目录。
   * 例：`{ '@': '/abs/project-root' }` 会把 `@/theme.json` 解析为
   * `/abs/project-root/theme.json`。
   */
  aliases?: Record<string, string>;
  /**
   * 返回 legacy 函数式 importer，用于 sass.render({ importer })。
   * 默认 false，返回 modern importer 对象，用于 sass.compile({ importers }) /
   * vite `css.preprocessorOptions.scss.api: 'modern-compiler'`。
   *
   * 适用场景：Vite < 5.4、HBuilderX 内置 vite 5.2.x 等仍走 sass legacy JS API 的环境。
   */
  legacy?: boolean;
}

export interface ModernSassImporter {
  canonicalize(url: string, context?: { containingUrl?: URL }): URL | null;
  load(canonicalUrl: URL): {
    contents: string;
    syntax: 'scss' | 'sass' | 'css';
    sourceMapUrl?: URL;
  } | null;
}

/**
 * sass.render() 的 legacy 函数式 importer
 * 签名：(url: string, prev: string, done: (result: { contents: string; file?: string } | Error | null) => void) => void
 */
export type LegacySassImporter = (
  url: string,
  prev: string,
  done: (result: { contents: string; file?: string } | Error | null) => void
) => void;

/**
 * 创建 modern API JSON Importer 实例
 * 适配 sass.compile({ importers }) / vite `api: 'modern-compiler'`
 */
export declare function createImporter(options?: JsonImporterOptions): ModernSassImporter;

/**
 * 创建 legacy 函数式 JSON Importer
 * 适配 sass.render({ importer })，用于 Vite < 5.4 / HBuilderX 内置 vite 5.2.x
 */
export declare function createLegacyImporter(options?: JsonImporterOptions): LegacySassImporter;

/**
 * 创建 JSON Importer。
 * - `options.legacy === true` → 返回 legacy 函数式 importer
 * - 否则 → 返回 modern importer 对象
 */
export declare function jsonImporter(options?: JsonImporterOptions): ModernSassImporter | LegacySassImporter;

export default jsonImporter;
