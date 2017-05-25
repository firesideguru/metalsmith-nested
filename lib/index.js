
'use strict';

// dependencies are from 'metalsmith' package
// nested installs none of its own locally
const
  debug = require('debug')('metalsmith-nested'), // blah blah blah
  Metal = require('metalsmith'),
  match = require('multimatch'),
  path  = require('path'),
  fs    = require('fs');

module.exports = plugin;

function plugin (config) {
  
  if (config && (typeof(config) !== 'object' || config instanceof Array)) {
    throw new Error('metalsmith-nested error: options argument must be an object');
  }
  
  let opts = {
    directory: config.directory || 'nested',
    generated: config.generated || 'layouts',
    pattern:   config.pattern, // match to apply default template
    default:   config.default, // default layout template file
  };
  
  if (!fs.existsSync(opts.directory)) {
    throw new Error(`metalsmith-nested error: could not find source directory (${opts.directory}) at location (${path.resolve(opts.directory)})`);
  }
  
  // test if file has layout front-matter or matches pattern with default layout
  // https://github.com/superwolff/metalsmith-layouts/blob/master/lib/helpers/check.js
  function check(files, file, pattern, def) {
    let data = files[file];
    // * test that file is utf-8 (not binary) here
    if (pattern && !match(file, pattern)[0]) {
      return false;
    }
    // Only process files with a specified layout or default template.
    // Allow the default template to be cancelled by layout: false.
    return 'layout' in data ? data.layout : def;
  }

  // recursively look up specified layout in front-matter and pass its contents with previous results (temp) to 'injectContent' method
  function resolveTemplate (tfiles, tfile, resolved, temp = '') {
    if (resolved[tfile]) {
      // if parent layout was called by a page directly (vs. through a child layout) we use that resolved content instead
      return injectContent(resolved[tfile], temp);
    }
    else if (tfiles[tfile]) {
      let tdata = tfiles[tfile];
      temp = injectContent(tdata.contents.toString(), temp);
      // if this layout has a parent layout "lather, rinse, repeat"
      return tdata.layout ? resolveTemplate(tfiles, tdata.layout, resolved, temp) : temp;
    }
    else {
      return temp;
    }
  }
  
  function injectContent (parentContent, childContent) {
    return childContent ? parentContent.replace(/\{\{\{\s*contents\s*\}\}\}/gim, childContent) : parentContent;
  }
  
  let resolved = {};
  
  // process page files for layout front-matter or default layout
  return function (files, metalsmith, done) {
    
    // create build tree for layout files
    Metal(process.cwd())
    
    .source(opts.directory)
    
    .destination(opts.generated)
    
    // access layout files in source directory
    .use(function(tfiles, metal, next) {
      
      setImmediate(next);
      
      // process all page files (not layouts)
      Object.keys(files).forEach(file => {
        
        // test if we use a layout on this page file ???
        if (!check(files, file, opts.pattern, opts.default)) {
          return; // next page
        }
        
        let layout = files[file].layout || opts.default;
        
        // process combine layout files recursively for this page
        let combined = resolveTemplate(tfiles, layout, resolved);
        
        // write results to page-specified layout
        tfiles[layout].contents = new Buffer(combined);
        
        // store combined results for future pages using same layout
        resolved[layout] = tfiles[layout];
      });
      
    })
    .build(function(err) {
      if (err) throw err;
    });
    // must allow time to disc write combined layout files before processing 'layout' plugin
    setTimeout(done, 100);
  };
}

