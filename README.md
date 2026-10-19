# dark-sass-json-importer

Dart Sass 自定义 Importer，让你直接在 SCSS 中导入 JSON 文件并作为变量使用。

同时支持 **modern API**（`sass.compile` + `importers`）和 **legacy JS API**（`sass.render` + `importer`）。

## 安装

```bash
npm install dark-sass-json-importer sass
```

## 特性

- 直接导入 `.json` 文件到 SCSS
- JSON 键值自动转换为 SCSS 变量
- 支持嵌套对象（保持嵌套结构，转为 SCSS Map）
- 支持数组（转为 SCSS List）
- 键名原样保留，不做任何转换
- 支持 `@import` 和 `@use` 语法
- **双模式**：modern（`sass.compile`）与 legacy（`sass.render`）API
- 路径别名支持（如 `@/` → 项目根目录）
- 同时提供 ESM 和 CommonJS 模块

## 快速开始

### 1. 创建 JSON 文件

**variables.json:**
```json
{
  "primaryColor": "#ff0000",
  "fontSize": 16,
  "isResponsive": true,
  "spacing": {
    "small": 8,
    "large": 24
  }
}
```

### 2. 在 SCSS 中使用

```scss
@use "./variables.json" as *;

.container {
  color: $primaryColor;
  font-size: $fontSize;

  @if $isResponsive {
    width: 100%;
  }

  padding: map-get($spacing, small);
}
```

**编译结果:**
```css
.container {
  color: "#ff0000";
  font-size: 16;
  width: 100%;
  padding: 8;
}
```

## 配置 Sass 编译器

### Modern API（推荐，Dart Sass 1.45+ / Vite ≥5.4）

```javascript
const sass = require('sass');
const jsonImporter = require('dark-sass-json-importer');

const result = sass.compile('input.scss', {
  importers: [jsonImporter()]
});
```

**Vite 配置**（`vite.config.js`，需要 Vite ≥5.4）：

```javascript
import { defineConfig } from 'vite';
import jsonImporter from 'dark-sass-json-importer';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        importers: [jsonImporter()]
      }
    }
  }
});
```

### Legacy API（Vite <5.4、HBuilderX 内置 vite 5.2.x）

`sass.render()` 的 `importer` 字段期望的是**函数式** importer，而非 modern API 的对象式。开启 `legacy: true` 选项，本包会自动返回适配 legacy 的函数式 importer：

```javascript
const sass = require('sass');
const jsonImporter = require('dark-sass-json-importer');

sass.render({
  file: 'input.scss',
  importer: [jsonImporter({ legacy: true })]
}, (err, result) => {
  // result.css
});
```

**Vite 配置**（`vite.config.js`，Vite <5.4 / HBuilderX）：

```javascript
import { defineConfig } from 'vite';
import jsonImporter from 'dark-sass-json-importer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        importer: jsonImporter({
          legacy: true,
          aliases: { '@': path.resolve(__dirname, '.') }
        })
      }
    }
  }
});
```

## 数据类型映射

| JSON 类型 | SCSS 类型 | 示例 |
|----------|----------|------|
| 对象 | Map | `{ "a": 1 }` → `$var: (a: 1);` |
| 数组 | List | `[1, 2, 3]` → `$var: (1, 2, 3);` |
| 字符串 | String | `"hello"` → `$var: "hello";` |
| 数字 | Number | `42` → `$var: 42;` |
| 布尔值 | Boolean | `true` → `$var: true;` |
| null | null | `null` → `$var: null;` |

## 配置选项

### `asMap`（默认：false）

**默认模式**：JSON 顶层每个键生成独立变量

```javascript
importers: [jsonImporter()]
```

```scss
@use "./variables.json" as *;
.box {
  color: $primaryColor;
  font-size: $fontSize;
}
```

**asMap 模式**：整个 JSON 作为一个 map 变量，变量名为文件名

```javascript
importers: [jsonImporter({ asMap: true })]
```

```scss
@use "./variables.json" as *;
.box {
  color: map-get($variables, primaryColor);
}
```

### `legacy`（默认：false）

设为 `true` 时返回 legacy 函数式 importer，适配 `sass.render({ importer })`。详见上文 Legacy API 段落。

### `aliases`

路径别名映射，键为别名前缀，值为目标目录：

```javascript
importers: [jsonImporter({
  aliases: { '@': '/abs/project-root' }
})]
```

```scss
// 会解析为 /abs/project-root/theme.json
@use "@/theme.json" as *;
```

## 使用示例

### 嵌套对象

```json
{
  "colors": { "primary": "#ff0000", "secondary": "#00ff00" },
  "fonts": ["Arial", "Helvetica"]
}
```

```scss
@use "./theme.json" as *;

.button {
  background: map-get($colors, primary);
  font-family: nth($fonts, 1);
}
```

### 复杂配置

```json
{
  "theme": {
    "colors": { "primary": "#ff0000" },
    "fonts": ["Arial", "sans-serif"]
  },
  "debug": false
}
```

```scss
@use "./config.json" as *;

@if not $debug {
  .app {
    color: map-get(map-get($theme, colors), primary);
    font-family: nth(map-get($theme, fonts), 1);
  }
}
```

## API

### `jsonImporter(options?)`

创建 JSON Importer 实例。

- `options.legacy` 为 `true` → 返回 legacy 函数式 importer
- 否则 → 返回 modern importer 对象

### `createImporter(options?)`

显式创建 modern API importer 对象（`{ canonicalize, load }`）。

### `createLegacyImporter(options?)`

显式创建 legacy 函数式 importer，签名：
`(url: string, prev: string, done: (result) => void) => void`

## 注意事项

1. **键名原样保留**：JSON 中的键名不会做任何转换，请在 JSON 中使用合法的 SCSS 变量名
2. **嵌套保持嵌套**：嵌套对象会转为 SCSS Map，不会展平
3. **数字无单位**：JSON 中的数字转为 SCSS Number，不带 CSS 单位
4. **字符串保留引号**：JSON 字符串会转为带引号的 SCSS String
5. **仅支持 Dart Sass**：不支持已废弃的 `node-sass`
6. **`@use ... as theme` 命名空间**：默认模式下，JSON 顶层键在命名空间下需通过 `theme.$key` 访问，不能用 `map-get(theme, key)`（`theme` 是命名空间而非 map）

## 兼容性

- Node.js >= 14.0.0
- Dart Sass >= 1.45.0
- Vite（modern API 需 ≥5.4，legacy API 适用于任意版本）
- HBuilderX 内置 vite 5.2.x（使用 `legacy: true`）

## 许可证

MIT
