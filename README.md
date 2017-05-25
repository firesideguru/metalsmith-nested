# metalsmith-nested

> A metalsmith plugin that extends `metalsmith-layouts`
  using the `handlebars` layout engine for nesting layouts.
  Simple enough it also might work with other layout engines.

## Example site

Copy the `example` directory outside of the `metalsmith-nested` package

Navigate to the `example` directory

```bash
npm install
```

```bash
node build
```

## Javascript build script

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
  
  .use(layouts('handlebars')
  
  .build(function(err) {
    if (err) throw err;
  });

```

The important thing to know is that the `directory` for metalsmith-nested
is the source directory of pre-nested layouts and the `generated` directory
is the output of combined (nested) layouts.

The output of metalsmith-nested is the input of metalsmith-layouts

Other options are `pattern` and `default` which should behave the same as
in metalsmith-layouts. See metalsmith-layouts and multimatch for full
documentation.

All available options

```javascript

directory: 'nested',
generated: 'layouts',
pattern: '**/*',
default: ''

```

### MIT License
