/**
 * index.js 单元测试
 */
const jsonImporter = require('../dist/index.cjs').default;
const { createImporter, createLegacyImporter } = require('../dist/index.cjs');

describe('jsonImporter (default export)', () => {
  test('默认返回 modern importer 对象', () => {
    const importer = jsonImporter();
    expect(typeof importer).toBe('object');
    expect(typeof importer.canonicalize).toBe('function');
    expect(typeof importer.load).toBe('function');
  });

  test('legacy: true 返回函数式 importer', () => {
    const importer = jsonImporter({ legacy: true });
    expect(typeof importer).toBe('function');
  });

  test('传递 asMap 选项', () => {
    const importer = jsonImporter({ asMap: true });
    expect(typeof importer).toBe('object');
    expect(typeof importer.canonicalize).toBe('function');
  });

  test('传递 aliases 选项', () => {
    const importer = jsonImporter({ aliases: { '@': '/some/path' } });
    expect(typeof importer).toBe('object');
  });

  test('同时传递多个选项', () => {
    const importer = jsonImporter({
      asMap: true,
      aliases: { '@': '/path' },
      legacy: false
    });
    expect(typeof importer).toBe('object');
  });
});

describe('named exports', () => {
  test('导出 createImporter', () => {
    expect(typeof createImporter).toBe('function');
  });

  test('导出 createLegacyImporter', () => {
    expect(typeof createLegacyImporter).toBe('function');
  });

  test('createImporter 返回正确的 importer 对象', () => {
    const importer = createImporter();
    expect(typeof importer.canonicalize).toBe('function');
    expect(typeof importer.load).toBe('function');
  });

  test('createLegacyImporter 返回函数', () => {
    const importer = createLegacyImporter();
    expect(typeof importer).toBe('function');
  });
});
