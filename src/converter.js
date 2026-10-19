/**
 * JSON → SCSS 转换器（ESM 版本）
 * 将 JSON 数据类型原样映射为 SCSS 语法
 */

/**
 * 将 JSON 值转换为 SCSS 语法表示
 *
 * 类型映射规则：
 * - `Array` → SCSS list `(item1, item2, ...)`
 * - `Object` → SCSS map `(key1: value1, key2: value2, ...)`
 * - 其他类型原样输出
 *
 * @param {any} value - 要转换的 JSON 值
 * @returns {any} SCSS 语法表示的值，原样返回
 */
function convertValue(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `(${value.map(convertValue).join(', ')})`;
  if (typeof value === 'object') return convertObject(value);

  return value;
}

/**
 * 将 JSON 对象转换为 SCSS map
 * 值为 null 的属性会保留为 `$key: null;`
 *
 * @param {Object} obj - 要转换的对象
 * @returns {string} SCSS map 格式，如 `(color: red, size: 16)` 或 `()`（空对象）
 */
function convertObject(obj) {
  if (obj == null) return obj;

  const entries = Object.keys(obj).map(key => `${key}: ${convertValue(obj[key])}`);

  return entries.length ? `(${entries.join(', ')})` : '()';
}

/**
 * 将 JSON 对象转换为 SCSS 变量声明
 *
 * 两种输出模式：
 * 1. **独立变量模式**（默认）：每个顶层 key 生成一个独立的 SCSS 变量
 *    ```scss
 *    $color: red;
 *    $size: 16;
 *    ```
 *
 * 2. **Map 模式**（asMap: true）：整个 JSON 作为一个 SCSS map 变量
 *    ```scss
 *    $filename: (color: red, size: 16);
 *    ```
 *
 *
 * @param {Object} json - 要转换的 JSON 对象（顶层必须是对象）
 * @param {JsonToScssOptions} [options={}] - 配置选项
 * @returns {string} SCSS 变量声明代码
 * @throws {Error} 当 json 不是对象时抛出错误
 */
function jsonToScss(json, options = {}) {
  const { asMap = false, filename = 'data' } = options;

  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new Error('JSON 文件的顶层必须是对象（Object）');
  }
  if (asMap) return `$${filename}: ${convertObject(json)};\n`;

  const lines = Object.keys(json).map(key => `$${key}: ${convertValue(json[key])};`);

  return lines.length ? (lines.join('\n') + '\n') : '';
}

export { convertObject, jsonToScss };
