const { convertValue, convertArray, convertObject, jsonToScss } = require('../dist/converter.cjs');

describe('convertValue', () => {
  test('null → "null"', () => {
    expect(convertValue(null)).toBe('null');
  });

  test('undefined → "null"', () => {
    expect(convertValue(undefined)).toBe('null');
  });

  test('true → "true"', () => {
    expect(convertValue(true)).toBe('true');
  });

  test('false → "false"', () => {
    expect(convertValue(false)).toBe('false');
  });

  test('整数', () => {
    expect(convertValue(42)).toBe('42');
  });

  test('浮点数', () => {
    expect(convertValue(1.5)).toBe('1.5');
  });

  test('负数', () => {
    expect(convertValue(-10)).toBe('-10');
  });

  test('零', () => {
    expect(convertValue(0)).toBe('0');
  });

  test('普通字符串加引号', () => {
    expect(convertValue('hello')).toBe('"hello"');
  });

  test('颜色字符串加引号', () => {
    expect(convertValue('#ff0000')).toBe('"#ff0000"');
  });

  test('空字符串', () => {
    expect(convertValue('')).toBe('""');
  });

  test('字符串转义双引号', () => {
    expect(convertValue('say "hi"')).toBe('"say \\"hi\\""');
  });

  test('字符串转义反斜杠', () => {
    expect(convertValue('a\\b')).toBe('"a\\\\b"');
  });

  test('空数组', () => {
    expect(convertValue([])).toBe('()');
  });

  test('数字数组', () => {
    expect(convertValue([1, 2, 3])).toBe('(1, 2, 3)');
  });

  test('空对象', () => {
    expect(convertValue({})).toBe('()');
  });

  test('简单对象', () => {
    expect(convertValue({ a: 1 })).toBe('(a: 1)');
  });
});

describe('convertArray', () => {
  test('空数组', () => {
    expect(convertArray([])).toBe('()');
  });

  test('字符串数组', () => {
    expect(convertArray(['a', 'b'])).toBe('("a", "b")');
  });

  test('混合类型数组', () => {
    expect(convertArray([1, 'x', true, null])).toBe('(1, "x", true, null)');
  });

  test('嵌套数组', () => {
    expect(convertArray([[1, 2], [3, 4]])).toBe('((1, 2), (3, 4))');
  });
});

describe('convertObject', () => {
  test('空对象', () => {
    expect(convertObject({})).toBe('()');
  });

  test('单属性', () => {
    expect(convertObject({ key: 'val' })).toBe('(key: "val")');
  });

  test('嵌套对象保持嵌套', () => {
    const input = { outer: { inner: 42 } };
    expect(convertObject(input)).toBe('(outer: (inner: 42))');
  });

  test('深层嵌套', () => {
    const input = { a: { b: { c: 'deep' } } };
    expect(convertObject(input)).toBe('(a: (b: (c: "deep")))');
  });
});

describe('jsonToScss', () => {
  test('默认模式：顶层键生成独立变量', () => {
    const json = { color: '#fff', size: 16 };
    const result = jsonToScss(json);
    expect(result).toBe('$color: "#fff";\n$size: 16;\n');
  });

  test('asMap 模式：整个 JSON 作为一个 map 变量', () => {
    const json = { color: '#fff', size: 16 };
    const result = jsonToScss(json, { asMap: true, filename: 'theme' });
    expect(result).toBe('$theme: (color: "#fff", size: 16);\n');
  });

  test('空 JSON 返回空字符串', () => {
    expect(jsonToScss({})).toBe('');
  });

  test('asMap 模式空 JSON', () => {
    const result = jsonToScss({}, { asMap: true, filename: 'empty' });
    expect(result).toBe('$empty: ();\n');
  });

  test('非对象抛出错误', () => {
    expect(() => jsonToScss([1, 2])).toThrow('顶层必须是对象');
    expect(() => jsonToScss(null)).toThrow('顶层必须是对象');
    expect(() => jsonToScss('str')).toThrow('顶层必须是对象');
  });

  test('嵌套对象作为 map 值', () => {
    const json = { colors: { a: '#fff', b: '#000' } };
    const result = jsonToScss(json);
    expect(result).toBe('$colors: (a: "#fff", b: "#000");\n');
  });

  test('数组作为 list 值', () => {
    const json = { sizes: [1, 2, 3] };
    const result = jsonToScss(json);
    expect(result).toBe('$sizes: (1, 2, 3);\n');
  });

  test('多种类型混合', () => {
    const json = { a: 1, b: 'x', c: true, d: null };
    const result = jsonToScss(json);
    const lines = result.trim().split('\n');
    expect(lines).toEqual([
      '$a: 1;',
      '$b: "x";',
      '$c: true;',
      '$d: null;'
    ]);
  });
});
