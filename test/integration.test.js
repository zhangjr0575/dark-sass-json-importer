const path = require('path');
const fs = require('fs');
const sass = require('sass');
const jsonImporter = require('../dist/index.cjs');

const fixturesDir = path.join(__dirname, 'fixtures');

function compileScss(scssContent, options = {}) {
  // 写入临时 scss 文件
  const scssPath = path.join(fixturesDir, '_test_input.scss');
  fs.writeFileSync(scssPath, scssContent);
  try {
    const result = sass.compile(scssPath, {
      importers: [jsonImporter(options)]
    });
    return result.css;
  } finally {
    fs.unlinkSync(scssPath);
  }
}

describe('集成测试', () => {
  test('导入简单 JSON 并使用变量', () => {
    const scss = `
@use "./simple.json" as *;
.box {
  color: $primaryColor;
  font-size: $fontSize;
}
`;
    const css = compileScss(scss);
    expect(css).toContain('color: "#ff0000"');
    expect(css).toContain('font-size: 16');
  });

  test('导入嵌套 JSON 并使用 map-get', () => {
    const scss = `
@use "./nested.json" as *;
.box {
  color: map-get($colors, primary);
}
`;
    const css = compileScss(scss);
    expect(css).toContain('color: "#ff0000"');
  });

  test('导入数组 JSON 并使用 nth', () => {
    const scss = `
@use "./array.json" as *;
.box {
  width: nth($breakpoints, 1);
}
`;
    const css = compileScss(scss);
    expect(css).toContain('width: 320');
  });

  test('导入复杂 JSON', () => {
    const scss = `
@use "./complex.json" as *;
.box {
  color: map-get(map-get($theme, colors), primary);
}
`;
    const css = compileScss(scss);
    expect(css).toContain('color: "#ff0000"');
  });

  test('asMap 模式', () => {
    const scss = `
@use "./simple.json" as *;
.box {
  color: map-get($simple, primaryColor);
}
`;
    const css = compileScss(scss, { asMap: true });
    expect(css).toContain('color: "#ff0000"');
  });

  test('非 JSON 文件不被拦截', () => {
    const scssPath = path.join(fixturesDir, '_helper.scss');
    fs.writeFileSync(scssPath, '$helper: 42;');
    try {
      const scss = `
@use "./helper.scss" as *;
.box { width: $helper; }
`;
      const css = compileScss(scss);
      expect(css).toContain('width: 42');
    } finally {
      fs.unlinkSync(scssPath);
    }
  });

  test('布尔值和 null', () => {
    const scss = `
@use "./simple.json" as *;
.box {
  responsive: $isResponsive;
  fixed: $isFixed;
  empty: $emptyValue;
}
`;
    const css = compileScss(scss);
    expect(css).toContain('responsive: true');
    expect(css).toContain('fixed: false');
  });

  test('空 JSON 不报错', () => {
    const scss = `
@use "./empty.json" as *;
.box { color: red; }
`;
    const css = compileScss(scss);
    expect(css).toContain('color: red');
  });
});
