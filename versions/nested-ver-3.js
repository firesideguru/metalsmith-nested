
'use strict';

const
  debug = require('debug')('metalsmith-nested'),
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
    directory: config.directory || 'origins',
    generated: config.generated || 'layouts',
    pattern:   config.pattern, // match to apply default template
    default:   config.default, // default layout template file
  };
  
  function exists(path) {
    return fs.existsSync(path);
  }
  
  if (!exists(opts.directory)) {
    throw new Error(`metalsmith-nested error: could not find source directory (${opts.directory}) at location (${path.resolve(opts.directory)})`);
  }
  
  // metalsmith does this automatically but does not give good error message for permissions
  if (!exists(opts.generated)) {
    // alternate: https://stackoverflow.com/questions/31645738/how-to-create-full-path-with-nodes-fs-mkdirsync
    fs.mkdirSync(opts.generated, '0744');
    if (!exists(opts.generated)) {
      throw new Error(`metalsmith-nested error: unable to make directory ${opts.generated}. Check parent directory permissions`);
    }
  }
  else {
    // https://nodejs.org/api/fs.html#fs_fs_access_path_mode_callback
    fs.access(opts.generated, fs.constants.W_OK, (error) => {
      if (error) {
        throw new Error(`metalsmith-nested error: unable to write to directory ${opts.generated}. Check directory permissions`);
      }
    });
  }
  
  // recursively looks up specified layout in front-matter and passes its content with previous results (temp) to 'injectContent' method
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
  
  // function finalizeTemplates (original, resolved) {
  //   // no return value, updates original by reference => NOW updating in-place in main loop
  //   Object.keys(original).forEach(key => {
  //     if (resolved[key]) {
  //       original[key] = resolved[key];
  //     }
  //   });
  // }
  
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

  let resolved = {};
  
  // process page files for layout front-matter or default layout
  return function (files, metalsmith, done) {

    // setImmediate(done); // does NOT allow time to write files before next module kicks in
    
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
        
        // write results to page-specified layout contents
        tfiles[layout].contents = new Buffer(combined);
        
        // store combined layout file for future pages using same template             // write back with finalizeTemplates
        resolved[layout] = tfiles[layout];
      });
      
      // finalizeTemplates(tfiles, resolved);
    })
    .build(function(err) {
      if (err) throw err;
    });
    // must allow time to disc write combined layout files before processing 'layout' plugin
    setTimeout(done, 100);
  };
}

