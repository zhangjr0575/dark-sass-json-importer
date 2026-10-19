const path = require('path');
const { pathToFileURL } = require('url');
const { createImporter, createLegacyImporter } = require('../dist/index.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');

describe('createImporter', () => {
  test('返回包含 canonicalize 和 load 的对象', () => {
    const importer = createImporter();
    expect(typeof importer.canonicalize).toBe('function');
    expect(typeof importer.load).toBe('function');
  });
});

describe('canonicalize', () => {
  const importer = createImporter();
  const containingUrl = pathToFileURL(path.join(fixturesDir, 'test.scss'));

  test('非 .json 文件返回 null', () => {
    expect(importer.canonicalize('style.scss', { containingUrl })).toBeNull();
    expect(importer.canonicalize('style.css', { containingUrl })).toBeNull();
    expect(importer.canonicalize('style.sass', { containingUrl })).toBeNull();
  });

  test('存在的 .json 文件返回 URL', () => {
    const result = importer.canonicalize('./simple.json', { containingUrl });
    expect(result).toBeInstanceOf(URL);
    expect(result.pathname).toContain('simple.json');
  });

  test('不存在的 .json 文件返回 null', () => {
    const result = importer.canonicalize('./nonexistent.json', { containingUrl });
    expect(result).toBeNull();
  });

  test('绝对路径', () => {
    const absPath = path.join(fixturesDir, 'simple.json');
    const result = importer.canonicalize(absPath, { containingUrl });
    expect(result).toBeInstanceOf(URL);
  });

  test('无上下文使用 cwd', () => {
    const result = importer.canonicalize('./nonexistent.json', {});
    expect(result).toBeNull();
  });
});

describe('load', () => {
  test('加载并转换简单 JSON', () => {
    const importer = createImporter();
    const url = pathToFileURL(path.join(fixturesDir, 'simple.json'));
    const result = importer.load(url);
    expect(result).not.toBeNull();
    expect(result.syntax).toBe('scss');
    expect(result.contents).toContain('$primaryColor: "#ff0000";');
    expect(result.contents).toContain('$fontSize: 16;');
    expect(result.contents).toContain('$isResponsive: true;');
    expect(result.contents).toContain('$emptyValue: null;');
    expect(result.sourceMapUrl).toBe(url);
  });

  test('加载嵌套 JSON', () => {
    const importer = createImporter();
    const url = pathToFileURL(path.join(fixturesDir, 'nested.json'));
    const result = importer.load(url);
    expect(result.contents).toContain('$colors:');
    expect(result.contents).toContain('primary: "#ff0000"');
    expect(result.contents).toContain('tertiary:');
    // 嵌套保持
    expect(result.contents).toContain('light: "#ffffff"');
    expect(result.contents).toContain('dark: "#000000"');
  });

  test('加载空 JSON', () => {
    const importer = createImporter();
    const url = pathToFileURL(path.join(fixturesDir, 'empty.json'));
    const result = importer.load(url);
    expect(result.contents).toBe('');
  });

  test('asMap 模式', () => {
    const importer = createImporter({ asMap: true });
    const url = pathToFileURL(path.join(fixturesDir, 'simple.json'));
    const result = importer.load(url);
    expect(result.contents).toMatch(/^\$simple: \(/);
  });

  test('无效 JSON 抛出错误', () => {
    // 创建一个临时无效 JSON 文件
    const fs = require('fs');
    const invalidPath = path.join(fixturesDir, '_invalid_temp.json');
    fs.writeFileSync(invalidPath, '{ invalid json }');
    try {
      const importer = createImporter();
      const url = pathToFileURL(invalidPath);
      expect(() => importer.load(url)).toThrow('无效的 JSON');
    } finally {
      fs.unlinkSync(invalidPath);
    }
  });
});
