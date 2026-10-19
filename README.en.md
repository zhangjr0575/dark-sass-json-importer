# dark-sass-json-importer

A custom Dart Sass Importer that allows you to import JSON files directly into SCSS and use them as variables.

## Installation

```bash
npm install dark-sass-json-importer sass
```

## Features

- Import `.json` files directly into SCSS.
- JSON keys and values are automatically converted to SCSS variables.
- Supports nested objects (preserved as SCSS Maps).
- Supports arrays (converted to SCSS Lists).
- Zero-transformation: keys and values are kept exactly as they are in the JSON.
- Supports both `@import` and `@use` syntax.
- Provides both ESM and CommonJS modules.

## Quick Start

### 1. Configure the Sass Compiler

```javascript
const sass = require('sass');
const jsonImporter = require('dark-sass-json-importer');

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

**Compiled CSS:**
```css
.container {
  color: "#ff0000";
  font-size: 16;
  width: 100%;
  padding: 8;
}
```

## Data Type Mapping

| JSON Type | SCSS Type | Example |
|-----------|-----------|---------|
| Object    | Map       | `{ "a": 1 }` → `$var: (a: 1);` |
| Array     | List      | `[1, 2, 3]` → `$var: (1, 2, 3);` |
| String    | String    | `"hello"` → `$var: "hello";` |
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
@use "./variables.json" as *;
.box {
  color: map-get($variables, color);  // #fff
  size: map-get($variables, size);    // 16
}
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
@use "./theme.json" as *;

.button {
  background: map-get($colors, primary);
  font-family: nth($fonts, 1);
}
```

### Arrays

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

## API

### jsonImporter(options?)

Creates a Dart Sass Importer instance.

**Parameters:**
- `options` (optional): Configuration object
  - `asMap` (boolean, default false): Whether to import the entire JSON as a single map variable.

**Returns:** A Dart Sass Importer object.

### CommonJS

```javascript
const jsonImporter = require('dark-sass-json-importer');
const importer = jsonImporter({ asMap: false });
```

### ES Modules

```javascript
import jsonImporter from 'dark-sass-json-importer';
const importer = jsonImporter({ asMap: false });
```

## Important Notes

1. **Zero-transformation**: JSON keys are kept exactly as they are. Ensure your JSON keys are valid SCSS variable names.
2. **Nested objects stay nested**: Nested objects are converted to SCSS Maps, not flattened.
3. **Numbers have no units**: JSON numbers are converted to unitless SCSS Numbers.
4. **Strings keep quotes**: JSON strings are converted to quoted SCSS Strings.
5. **Dart Sass only**: The deprecated `node-sass` is not supported.

## Compatibility

- Node.js >= 14.0.0
- Dart Sass >= 1.45.0

## License

MIT
