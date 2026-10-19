# dark-sass-json-importer 需求文档

## 项目概述

创建一个 Dart Sass 的自定义 Importer 插件，允许在 SCSS 文件中直接导入 JSON 文件，并将 JSON 中的键值对转换为 SCSS 变量。

**同时支持两种 Sass JS API：**

- **Modern API**（`sass.compile` + `importers`）—— 适配 Vite ≥5.4、Node 独立调用
- **Legacy JS API**（`sass.render` + `importer`）—— 适配 Vite <5.4、HBuilderX 内置 vite 5.2.x

## 核心需求

### 1. JSON 文件导入
- 支持通过 `@import` 或 `@use` 语句导入 `.json` 文件
- 自动识别 `.json` 扩展名
- 支持相对路径、绝对路径与别名解析

### 2. 数据类型转换（零处理，原样映射）
- **对象** → SCSS Map（嵌套保持嵌套，不展平）
- **数组** → SCSS List
- **字符串** → SCSS String（保留引号）
- **数字** → SCSS Number（无单位）
- **布尔值** → SCSS Boolean
- **null** → SCSS null
- **键名不做任何转换，原样保留**

### 3. 变量注入模式

默认模式：JSON 顶层键直接成为 SCSS 变量名
```scss
@use './variables.json' as *;
// JSON: { "primaryColor": "#ff0000" }
// → $primaryColor: "#ff0000";
.box { color: $primaryColor; }
```

asMap 模式：整体作为一个 `$<filename>` map
```scss
@use './variables.json' as *;
// → $variables: (primaryColor: "#ff0000");
.box { color: map-get($variables, primaryColor); }
```

### 4. 配置选项
```javascript
{
  asMap: false,       // 整体作为 $<filename> map
  legacy: false,      // 返回 legacy 函数式 importer，适配 sass.render
  aliases: { '@': '/abs/root' }  // 路径别名映射
}
```

### 5. 双 API 支持

| API | sass 方法 | 配置字段 | 调用方式 |
|-----|---------|---------|---------|
| Modern | `sass.compile` | `importers` | `importers: [jsonImporter()]` |
| Legacy | `sass.render` | `importer` | `importer: [jsonImporter({ legacy: true })]` |

- `legacy: true` 时返回函数式 importer，签名 `(url, prev, done) => void`
- 内部复用 modern importer 的 `canonicalize` / `load`，仅做适配包装

## 技术规范

- Node.js >= 14.0.0
- Dart Sass >= 1.45.0
- **不支持已废弃的 `node-sass`**
- 源码仅 ESM，构建产物同时输出 ESM 与 CommonJS
- 文档：中英文双语，默认中文

## 项目结构

```
dark-sass-json-importer/
├── src/                      # 仅 ESM 源码
│   ├── index.js              # 入口（jsonImporter + legacy 分发）
│   ├── importer.js           # Importer 核心（modern + legacy）
│   └── converter.js          # JSON → SCSS 转换
├── dist/                     # 构建产物（提交到 npm）
│   ├── index.cjs             # CommonJS 产物
│   ├── index.mjs             # ESM 产物
│   └── converter.cjs         # converter 独立 CJS 产物（供单测）
├── test/
│   ├── fixtures/             # 测试 JSON/SCSS
│   ├── converter.test.js
│   ├── importer.test.js
│   ├── integration.test.js   # modern API 集成
│   └── legacy.test.js        # legacy API 集成
├── scripts/build.js          # esbuild 打包脚本（ESM → ESM + CJS）
├── README.md / README.en.md
├── REQUIREMENTS.md
├── types.d.ts
└── package.json
```

## 示例

### Modern API
```javascript
const result = sass.compile('input.scss', {
  importers: [jsonImporter()]
});
```

### Legacy API
```javascript
sass.render({
  file: 'input.scss',
  importer: [jsonImporter({ legacy: true })]
}, (err, result) => { /* ... */ });
```

## 边界情况

1. **空 JSON 文件**：生成空内容
2. **无效 JSON**：抛出明确错误
3. **文件不存在**：返回 null 让 Sass 继续查找其他 importer
4. **特殊字符键名**：原样保留，由用户保证合法性
5. **legacy `prev` 为 "stdin"**：不当作路径，降级走 cwd
