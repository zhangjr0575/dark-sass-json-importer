/**
 * JSON → SCSS 转换器（ESM 版本）
 * 将 JSON 数据类型原样映射为 SCSS 语法
 */

function convertValue(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  if (Array.isArray(value)) return convertArray(value);
  if (typeof value === 'object') return convertObject(value);
  return 'null';
}

function convertArray(arr) {
  if (arr.length === 0) return '()';
  return `(${arr.map(convertValue).join(', ')})`;
}

function convertObject(obj) {
  const keys = Object.keys(obj);
  if (keys.length === 0) return '()';
  const entries = keys.map(key => `${key}: ${convertValue(obj[key])}`);
  return `(${entries.join(', ')})`;
}

function jsonToScss(json, options = {}) {
  const { asMap = false, filename = 'data' } = options;
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new Error('JSON 文件的顶层必须是对象（Object）');
  }
  if (asMap) {
    return `$${filename}: ${convertObject(json)};\n`;
  }
  const keys = Object.keys(json);
  if (keys.length === 0) return '';
  return keys.map(key => `$${key}: ${convertValue(json[key])};`).join('\n') + '\n';
}

export { convertValue, convertArray, convertObject, jsonToScss };
