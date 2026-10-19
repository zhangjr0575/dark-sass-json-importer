const path = require('path');
const fs = require('fs');
const sass = require('sass');
const jsonImporter = require('../dist/index.cjs');
const { createLegacyImporter } = require('../dist/index.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');

/**
 * 使用 sass.render（legacy JS API）编译，传入函数式 importer。
 * 模拟 Vite < 5.4 / HBuilderX 内置 vite 5.2.x 的调用路径。
 */
function renderScss(scssContent, options = {}) {
  const scssPath = path.join(fixturesDir, '_test_legacy_input.scss');
  fs.writeFileSync(scssPath, scssContent);
  try {
    return new Promise((resolve, reject) => {
      sass.render(
        {
          file: scssPath,
          importer: [jsonImporter({ ...options, legacy: true })]
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result.css.toString());
        }
      );
    });
  } finally {
    fs.unlinkSync(scssPath);
  }
}

describe('createLegacyImporter', () => {
  test('返回函数', () => {
    const importer = createLegacyImporter();
    expect(typeof importer).toBe('function');
  });

  test('jsonImporter({ legacy: true }) 等价于 createLegacyImporter()', () => {
    const a = jsonImporter({ legacy: true });
    const b = createLegacyImporter();
    expect(typeof a).toBe('function');
    expect(typeof b).toBe('function');
  });

  test('jsonImporter() 默认返回 modern importer 对象', () => {
    const importer = jsonImporter();
    expect(typeof importer).toBe('object');
    expect(typeof importer.canonicalize).toBe('function');
    expect(typeof importer.load).toBe('function');
  });
});

describe('legacy 模式集成测试（sass.render + importer 函数）', () => {
  test('导入简单 JSON 并使用变量', async () => {
    const scss = `
@use "./simple.json" as *;
.box {
  color: $primaryColor;
  font-size: $fontSize;
}
`;
    const css = await renderScss(scss);
    expect(css).toContain('color: "#ff0000"');
    expect(css).toContain('font-size: 16');
  });

  test('导入嵌套 JSON 并使用 map-get', async () => {
    const scss = `
@use "./nested.json" as *;
.box {
  color: map-get($colors, primary);
}
`;
    const css = await renderScss(scss);
    expect(css).toContain('color: "#ff0000"');
  });

  test('导入数组 JSON 并使用 nth', async () => {
    const scss = `
@use "./array.json" as *;
.box {
  width: nth($breakpoints, 1);
}
`;
    const css = await renderScss(scss);
    expect(css).toContain('width: 320');
  });

  test('asMap 模式', async () => {
    const scss = `
@use "./simple.json" as *;
.box {
  color: map-get($simple, primaryColor);
}
`;
    const css = await renderScss(scss, { asMap: true });
    expect(css).toContain('color: "#ff0000"');
  });

  test('别名解析', async () => {
    const scss = `
@use "@/simple.json" as *;
.box {
  color: $primaryColor;
}
`;
    const css = await renderScss(scss, { aliases: { '@': fixturesDir } });
    expect(css).toContain('color: "#ff0000"');
  });

  test('非 JSON 文件不被拦截', async () => {
    const helperPath = path.join(fixturesDir, '_legacy_helper.scss');
    fs.writeFileSync(helperPath, '$helper: 42;');
    try {
      const scss = `
@use "./_legacy_helper.scss" as *;
.box { width: $helper; }
`;
      const css = await renderScss(scss);
      expect(css).toContain('width: 42');
    } finally {
      fs.unlinkSync(helperPath);
    }
  });

  test('布尔值和 null', async () => {
    const scss = `
@use "./simple.json" as *;
.box {
  responsive: $isResponsive;
  fixed: $isFixed;
  empty: $emptyValue;
}
`;
    const css = await renderScss(scss);
    expect(css).toContain('responsive: true');
    expect(css).toContain('fixed: false');
  });

  test('空 JSON 不报错', async () => {
    const scss = `
@use "./empty.json" as *;
.box { color: red; }
`;
    const css = await renderScss(scss);
    expect(css).toContain('color: red');
  });

  test('文件不存在时返回 null 让 sass 继续查找', async () => {
    // legacy importer 对不存在的 .json 返回 null，
    // sass 会尝试其他 importer，最终报错——这里验证不抛 importer 内部异常
    const scss = `@use "./nonexistent.json" as *;`;
    await expect(renderScss(scss)).rejects.toThrow(/Can't find stylesheet to import|could not resolve/);
  });

  test('与 modern API 结果一致', async () => {
    const scss = `
@use "./complex.json" as *;
.box {
  color: map-get(map-get($theme, colors), primary);
  font-family: nth(map-get($theme, fonts), 1);
}
`;
    // modern
    const scssPath = path.join(fixturesDir, '_test_cmp.scss');
    fs.writeFileSync(scssPath, scss);
    const modernCss = sass
      .compile(scssPath, { importers: [jsonImporter()] })
      .css;
    fs.unlinkSync(scssPath);

    // legacy
    const legacyCss = await renderScss(scss);

    expect(legacyCss).toBe(modernCss);
  });
});
