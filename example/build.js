

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
