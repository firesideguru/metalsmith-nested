# metalsmith-nested

> A metalsmith plugin for nesting your layouts when using the handlebars engine.

This plugin extends `metalsmith-layouts` when using the `handlebars` layout engine
and recursively combines (nests) layouts in parent-child relationships.
Simple enough it might also work with other layout engines.

## Installation

```bash
$ npm install --save metalsmith-nested
```

## Example

Configuration in `metalsmith.json`:

```json
{
  "plugins": {
    "metalsmith-nested": {
      "directory": "nested",
      "generated": "layouts"
    },
    "metalsmith-layouts": {
      "engine": "handlebars"
    }
  }
}
```

Source Page `src/page.html`:

```html
---
layout: child.html
heading: Page Heading
title: Page Title
---
<p>Page contents</p>
```

Child Layout `nested/child.html`:

```html
---
layout: parent.html
---
<h1>{{heading}}</h1>
  {{{contents}}}
```

Parent Layout `nested/parent.html`:

```html
<!doctype html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  {{{contents}}}
</body>
</html>
```

Results in `layouts/child.html`:

```html
<!doctype html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <h1>{{heading}}</h1>
  {{{contents}}}
</body>
</html>
```

Results in `build/page.html`:

```html
<!doctype html>
<html>
<head>
  <title>Page Title</title>
</head>
<body>
  <h1>Page Heading</h1>
  <p>Page contents</p>
</body>
</html>
```

It is possible to combine (nest) multiple layouts.

## Example Site

Copy the `example` directory outside of the `metalsmith-nested` package

```bash
$ cp -rf example ../example
```

Navigate to the `example` directory

```bash
$ cd ../example
```

Install the dependencies

```bash
$ npm install
```

Build the site

```bash
$ node build
```

## Javascript Build Script

The following build script uses the default values for all packages
except that `handlebars` is specified as the layout engine.

[build.js]

```javascript
const
  Metalsmith  = require('metalsmith'),
  handlebars  = require('handlebars'),
  layouts     = require('metalsmith-layouts'),
  nested      = require('metalsmith-nested');

Metalsmith(__dirname)
  .source('src')
  .destination('build')
  
  .use(nested({
    directory: 'nested',
    generated: 'layouts'
  }))
  
  .use(layouts({
    engine: 'handlebars',
    directory: 'layouts'
  }))
  
  .build(function(err) {
    if (err) throw err;
  });
```

the above is the same as

[build.js]
```javascript
const
  Metalsmith  = require('metalsmith'),
  handlebars  = require('handlebars'),
  layouts     = require('metalsmith-layouts'),
  nested      = require('metalsmith-nested');

Metalsmith(__dirname)

  .use(nested())
  
  .use(layouts('handlebars'))
  
  .build(function(err) {
    if (err) throw err;
  });
```

The important thing to know is that the `directory` for metalsmith-nested
is the source directory of pre-nested layouts and the `generated` directory
is the output of combined (nested) layouts.

> The output of metalsmith-nested is the input of metalsmith-layouts

Other options are `pattern` and `default` which should behave the same as in metalsmith-layouts.
See [metalsmith-layouts](https://github.com/superwolff/metalsmith-layouts) and
[multimatch](https://github.com/sindresorhus/multimatch) for full documentation.

## All Available Options

```javascript
directory: 'nested',
generated: 'layouts',
pattern: '**/*',
default: ''
```

## License

MIT
