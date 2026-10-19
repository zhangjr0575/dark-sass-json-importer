/**
 * converter.js 单元测试
 */
const { convertObject, jsonToScss } = require('../dist/index.cjs');

describe('convertObject', () => {
  test('空对象返回 ()', () => {
    expect(convertObject({})).toBe('()');
  });

  test('简单键值对转换为 SCSS map', () => {
    expect(convertObject({ color: 'red', size: 16 })).toBe('(color: red, size: 16)');
  });

  test('嵌套对象递归转换', () => {
    const obj = { a: { b: 1 } };
    expect(convertObject(obj)).toBe('(a: (b: 1))');
  });

  test('数组值转换为 SCSS list', () => {
    const obj = { items: [1, 2, 3] };
    expect(convertObject(obj)).toBe('(items: (1, 2, 3))');
  });

  test('null 值保留为 null', () => {
    const obj = { key: null };
    expect(convertObject(obj)).toBe('(key: null)');
  });

  test('undefined 值保留为 undefined', () => {
    const obj = { key: undefined };
    expect(convertObject(obj)).toBe('(key: undefined)');
  });

  test('布尔值原样输出', () => {
    const obj = { enabled: true, disabled: false };
    expect(convertObject(obj)).toBe('(enabled: true, disabled: false)');
  });

  test('null 参数返回 null', () => {
    expect(convertObject(null)).toBeNull();
  });

  test('undefined 参数返回 undefined', () => {
    expect(convertObject(undefined)).toBeUndefined();
  });
});

describe('jsonToScss', () => {
  describe('独立变量模式（默认）', () => {
    test('每个顶层 key 生成独立变量', () => {
      const json = { color: 'red', size: 16 };
      const result = jsonToScss(json);
      expect(result).toBe('$color: red;\n$size: 16;\n');
    });

    test('空对象返回空字符串', () => {
      expect(jsonToScss({})).toBe('');
    });

    test('嵌套对象生成 SCSS map 变量', () => {
      const json = { theme: { primary: '#007bff' } };
      const result = jsonToScss(json);
      expect(result).toBe('$theme: (primary: #007bff);\n');
    });

    test('数组值生成 SCSS list 变量', () => {
      const json = { spacing: [4, 8, 16] };
      const result = jsonToScss(json);
      expect(result).toBe('$spacing: (4, 8, 16);\n');
    });

    test('null 值生成 $key: null;', () => {
      const json = { opacity: null };
      const result = jsonToScss(json);
      expect(result).toBe('$opacity: null;\n');
    });

    test('布尔值原样输出', () => {
      const json = { enabled: true };
      const result = jsonToScss(json);
      expect(result).toBe('$enabled: true;\n');
    });
  });

  describe('Map 模式（asMap: true）', () => {
    test('整个 JSON 作为一个 SCSS map 变量', () => {
      const json = { color: 'red', size: 16 };
      const result = jsonToScss(json, { asMap: true, filename: 'config' });
      expect(result).toBe('$config: (color: red, size: 16);\n');
    });

    test('默认 filename 为 data', () => {
      const json = { key: 'value' };
      const result = jsonToScss(json, { asMap: true });
      expect(result).toBe('$data: (key: value);\n');
    });

    test('空对象生成空 map', () => {
      const json = {};
      const result = jsonToScss(json, { asMap: true });
      expect(result).toBe('$data: ();\n');
    });

    test('嵌套结构完整转换', () => {
      const json = {
        theme: 'dark',
        colors: { primary: '#007bff' },
        spacing: [4, 8]
      };
      const result = jsonToScss(json, { asMap: true, filename: 'theme' });
      expect(result).toBe('$theme: (theme: dark, colors: (primary: #007bff), spacing: (4, 8));\n');
    });
  });

  describe('错误处理', () => {
    test('非对象输入抛出错误', () => {
      expect(() => jsonToScss('string')).toThrow('JSON 文件的顶层必须是对象（Object）');
    });

    test('null 输入抛出错误', () => {
      expect(() => jsonToScss(null)).toThrow('JSON 文件的顶层必须是对象（Object）');
    });

    test('数组输入抛出错误', () => {
      expect(() => jsonToScss([1, 2, 3])).toThrow('JSON 文件的顶层必须是对象（Object）');
    });

    test('数字输入抛出错误', () => {
      expect(() => jsonToScss(42)).toThrow('JSON 文件的顶层必须是对象（Object）');
    });

    test('undefined 输入抛出错误', () => {
      expect(() => jsonToScss(undefined)).toThrow('JSON 文件的顶层必须是对象（Object）');
    });
  });
});
