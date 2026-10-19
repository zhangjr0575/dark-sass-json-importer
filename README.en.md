**English | [中文](README.md)**

# dark-sass-json-importer

A custom Dart Sass Importer that allows you to import JSON files directly into SCSS and use them as variables.

Supports both **modern API** (`sass.compile` + `importers`) and **legacy JS API** (`sass.render` + `importer`).

## Installation

```bash
npm install @zhangjr0575/dark-sass-json-importer sass
```

## Features

- Import `.json` files directly into SCSS.
- JSON keys and values are automatically converted to SCSS variables.
- Supports nested objects (preserved as SCSS Maps).
- Supports arrays (converted to SCSS Lists).
- Zero-transformation: keys and values are kept exactly as they are in the JSON.
- Supports both `@import` and `@use` syntax.
- **Dual-mode**: modern (`sass.compile`) and legacy (`sass.render`) API support.
- Path aliases support (e.g., `@/` → project root).
- Provides both ESM and CommonJS modules.

## Quick Start

### 1. Configure the Sass Compiler

```javascript
const sass = require('sass');
const jsonImporter = require('@zhangjr0575/dark-sass-json-importer');

const result = sass.compile('input.scss', {
  importers: [jsonImporter()]
});
```

### 2. Create a JSON File

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

### 3. Use in SCSS

**input.scss:**
```scss
@use "sass:map";
@use "./variables.json" as *;

.container {
  color: $primaryColor;
  font-size: $fontSize;
  
  @if $isResponsive {
    width: 100%;
  }
  
  padding: map.get($spacing, small);
}
```

**Compiled CSS:**
```css
.container {
  color: #ff0000;
  font-size: 16;
  width: 100%;
  padding: 8;
}
```

> **Tip**: JSON strings are converted to SCSS values as-is, without automatic quoting.

## Configuring the Sass Compiler

### Modern API (Recommended, Dart Sass 1.45+ / Vite ≥5.4)

```javascript
const sass = require('sass');
const jsonImporter = require('@zhangjr0575/dark-sass-json-importer');

const result = sass.compile('input.scss', {
  importers: [jsonImporter()]
});
```

**Vite configuration** (`vite.config.js`, requires Vite ≥5.4):

```javascript
import { defineConfig } from 'vite';
import jsonImporter from '@zhangjr0575/dark-sass-json-importer';

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

### Legacy API (Vite <5.4, HBuilderX built-in vite 5.2.x)

The `importer` field in `sass.render()` expects a **function-style** importer, not the modern API object. Set `legacy: true` and this package will automatically return a function-style importer compatible with the legacy API:

```javascript
const sass = require('sass');
const jsonImporter = require('@zhangjr0575/dark-sass-json-importer');

sass.render({
  file: 'input.scss',
  importer: [jsonImporter({ legacy: true })]
}, (err, result) => {
  // result.css
});
```

**Vite configuration** (`vite.config.js`, Vite <5.4 / HBuilderX):

```javascript
import { defineConfig } from 'vite';
import jsonImporter from '@zhangjr0575/dark-sass-json-importer';
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

## Data Type Mapping

| JSON Type | SCSS Type | Example |
|-----------|-----------|---------|
| Object    | Map       | `{ "a": 1 }` → `$var: (a: 1);` |
| Array     | List      | `[1, 2, 3]` → `$var: (1, 2, 3);` |
| String    | String    | `"hello"` → `$var: hello;` |
| Number    | Number    | `42` → `$var: 42;` |
| Boolean   | Boolean   | `true` → `$var: true;` |
| null      | null      | `null` → `$var: null;` |

## Configuration Options

### asMap (default: false)

**Default mode**: Each top-level key in the JSON generates an independent SCSS variable.

```javascript
// variables.json: { "color": "#fff", "size": 16 }
importers: [jsonImporter()]
```

```scss
@use "./variables.json" as *;
.box {
  color: $color;        // #fff
  size: $size;          // 16
}
```

**asMap mode**: The entire JSON is imported as a single map variable, named after the JSON file (without extension).

```javascript
importers: [jsonImporter({ asMap: true })]
```

```scss
@use "sass:map";
@use "./variables.json" as *;
.box {
  color: map.get($variables, color);  // #fff
  size: map.get($variables, size);    // 16
}
```

### legacy (default: false)

Set to `true` to return a legacy function-style importer, compatible with `sass.render({ importer })`. See the Legacy API section above for details.

### aliases

Path alias mapping, where keys are alias prefixes and values are target directories:

```javascript
importers: [jsonImporter({
  aliases: { '@': '/abs/project-root' }
})]
```

```scss
// Resolves to /abs/project-root/theme.json
@use "@/theme.json" as *;
```

## Examples

### Nested Objects

**theme.json:**
```json
{
  "colors": {
    "primary": "#ff0000",
    "secondary": "#00ff00"
  },
  "fonts": ["Arial", "Helvetica"]
}
```

```scss
@use "sass:map";
@use "./theme.json" as *;

.button {
  background: map.get($colors, primary);
  font-family: nth($fonts, 1);
}
```

### Breakpoints

**breakpoints.json:**
```json
{
  "mobile": 768,
  "tablet": 1024,
  "desktop": 1200
}
```

```scss
@use "./breakpoints.json" as *;

@media (min-width: $mobile) {
  .container { width: 100%; }
}

@media (min-width: $tablet) {
  .container { width: 960px; }
}
```

### Complex Configuration

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
@use "sass:map";
@use "./config.json" as *;

@if not $debug {
  .app {
    color: map.get(map.get($theme, colors), primary);
    font-family: nth(map.get($theme, fonts), 1);
  }
}
```

## API

### jsonImporter(options?)

Creates a JSON Importer instance.

- `options.legacy === true` → returns a legacy function-style importer
- Otherwise → returns a modern importer object

### createImporter(options?)

Explicitly creates a modern API importer object (`{ canonicalize, load }`).

### createLegacyImporter(options?)

Explicitly creates a legacy function-style importer with signature:
`(url: string, prev: string, done: (result) => void) => void`

### CommonJS

```javascript
const jsonImporter = require('@zhangjr0575/dark-sass-json-importer');
const importer = jsonImporter({ asMap: false });
```

### ES Modules

```javascript
import jsonImporter from '@zhangjr0575/dark-sass-json-importer';
const importer = jsonImporter({ asMap: false });
```

## Important Notes

1. **Zero-transformation**: JSON keys are kept exactly as they are. Ensure your JSON keys are valid SCSS variable names.
2. **Nested objects stay nested**: Nested objects are converted to SCSS Maps, not flattened.
3. **Numbers have no units**: JSON numbers are converted to unitless SCSS Numbers.
4. **Strings pass through as-is**: JSON strings are converted to SCSS values without automatic quoting.
5. **null values preserved**: JSON null values are converted to SCSS `null`, not filtered out.
6. **Dart Sass only**: The deprecated `node-sass` is not supported.
7. **`@use ... as theme` namespace**: In default mode, top-level JSON keys must be accessed via `theme.$key` under a namespace, not `map.get(theme, key)` (`theme` is a namespace, not a map).

## Compatibility

- Node.js >= 14.0.0
- Dart Sass >= 1.45.0 (Modern API introduction version)
- Vite >= 6.0 (Modern API enabled by default)
- Vite 5.4 - 5.x (requires explicit `api: 'modern-compiler'` setting)
- Vite < 5.4 (use `legacy: true` option)
- HBuilderX built-in vite 5.2.x (use `legacy: true` option)

### Sass Version Requirements

| API Mode | Minimum Sass Version | Description |
|----------|---------------------|-------------|
| Modern API (default) | >= 1.45.0 | 1.45.0 introduced Modern Importer API (`canonicalize` + `load`) |
| Legacy API (`legacy: true`) | >= 1.0.0 | Function-style importer supported since Dart Sass 1.0.0 |

> **Note**: The project's `peerDependencies` is set to `sass >= 1.45.0` to encourage Modern API usage. To support lower versions, manually change it to `>= 1.0.0`, but only use `legacy: true` mode.

### Modern API Support Details

| Tool | Version Requirement | Configuration |
|------|-------------------|---------------|
| Dart Sass | >= 1.45.0 | Native support, no configuration needed |
| Vite | >= 6.0 | Enabled by default, no configuration needed |
| Vite | 5.4 - 5.x | Set `api: 'modern-compiler'` |
| Vite | < 5.4 | Use `legacy: true` option |
| HBuilderX | built-in vite 5.2.x | Use `legacy: true` option |

> **Note**: Dart Sass's Legacy API (`render()`, `renderSync()`) is deprecated and will be removed in Dart Sass 2.0.0. New projects are recommended to use the Modern API.

## License

MIT
