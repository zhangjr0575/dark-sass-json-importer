# 示例项目

两个最简 Vite 项目，分别验证 dark-sass-json-importer 的两种 Sass API 模式。

## 目录

| 示例 | Vite 版本 | Sass API | 配置字段 |
|------|-----------|----------|----------|
| `modern/` | `^5.4.0`（实测 5.4.21） | Modern JS API | `api: 'modern-compiler'` + `importers` |
| `legacy/`  | `5.2.8`（HBuilderX 内置版本） | Legacy JS API | `importer` + `legacy: true` |

## 快速验证

每个示例目录下执行：

```bash
npm install
npm run build   # vite 构建
npm run verify   # 检查 CSS 产物是否包含 JSON 注入的变量值
```

## 关键差异

### Modern（`examples/modern/vite.config.js`）

```javascript
css: {
  preprocessorOptions: {
    scss: {
      api: 'modern-compiler',                              // 需要 Vite ≥ 5.4
      importers: [jsonImporter({ aliases: { '@': src } })]  // 对象式 importer
    }
  }
}
```

- Sass 调用 `sass.compile()`（modern JS API）
- importer 为对象 `{ canonicalize, load }`
- 无 legacy-js-api deprecation 警告

### Legacy（`examples/legacy/vite.config.js`）

```javascript
css: {
  preprocessorOptions: {
    scss: {
      importer: jsonImporter({ legacy: true, aliases: { '@': src } })  // 函数式 importer
    }
  }
}
```

- Sass 调用 `sass.render()`（legacy JS API）
- importer 为函数 `(url, prev, done) => done({ contents })`
- 适用于 Vite < 5.4 / HBuilderX 内置 vite 5.2.x
- 会有 `DEPRECATION WARNING [legacy-js-api]`，属正常现象

## SCSS 写法（两种模式通用）

```scss
@use "@/theme.json" as theme;

.primary {
  color: theme.$primaryColor;
  font-size: theme.$fontSize * 1px;
}
```

`@/theme.json` 通过 `aliases` 配置解析到 `src/theme.json`，JSON 顶层键在 `theme` 命名空间下以 `theme.$key` 访问。
