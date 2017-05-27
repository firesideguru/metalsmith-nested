
'use strict';

/**
 * Dependencies
 *
 * Dependencies are from `metalsmith` package
 * `nested` installs none of its own
 */

const
  // debug = require('debug')('metalsmith-nested'), // blah blah blah verbosity
  Metal = require('metalsmith'),
  match = require('multimatch'),
  utf8  = require('is-utf8'),
  path  = require('path'),
  fs    = require('fs');

/**
 * Expose `plugin`.
 */
 
module.exports = plugin;

/**
 * Metalsmith plugin to extend `metalsmith-layouts` to
 * allow nested layouts using the `handlebars` engine
 *
 * @param {Object} options (optional)
 *   @property {String} directory (optional)
 *   @property {String} generated (optional)
 *   @property {String} pattern (optional)
 *   @property {String} default (optional)
 * @return {Function}
 */

function plugin (config) {
  
  /**
   * Init
   */
   
  // Throw an error if non-object supplied as `options`
  if (config && (typeof(config) !== 'object' || config instanceof Array)) {
    throw new Error('metalsmith-nested error: options argument must be an object');
  }
  
  // Set options or defaults
  let opts = {
    directory: config.directory || 'nested',
    generated: config.generated || 'layouts',
    pattern:   config.pattern, // match to apply default layout
    default:   config.default, // default layout
  };
  
  // Throw an error if `nested` directory cannot be found
  if (!fs.existsSync(opts.directory)) {
    throw new Error(`metalsmith-nested error: could not find source directory (${opts.directory}) at location (${path.resolve(opts.directory)})`);
  }
  
  /**
   * Test if file has layout front-matter or matches pattern with default layout
   *
   * Code source:
   * https://github.com/superwolff/metalsmith-layouts/blob/master/lib/helpers/check.js
   *
   * @param {Object} files
   * @param {String} file
   * @param {String} pattern
   * @param {String} default
   * @return {Boolean}
   */
  
  function check(files, file, pattern, def) {
    let data = files[file];
    
    // Only process utf8 encoded files (so no binary)
    if (!utf8(data.contents)) {
      return false;
    }
    
    // Only process files that match the pattern (if there is a pattern)
    if (pattern && !match(file, pattern)[0]) {
      return false;
    }
    
    // Only process files with a specified layout or default template.
    // Allow the default template to be cancelled by layout: false.
    return 'layout' in data ? data.layout : def;
  }
  
  /**
   * Recursively look up specified `layout` in front-matter and combine
   * contents with previous results on `temp` via `injectContent` method
   *
   * @param {Object} tfiles
   * @param {String} tfile
   * @param {Object} resolved
   * @param {String} temp
   * @return {String}
   */
   
  function resolveTemplate (tfiles, tfile, resolved, temp = '') {
    
    // If parent layout was called by a page directly (vs. through a child layout)
    // inject already resolved content with child `temp`
    if (resolved[tfile]) {
      return injectContent(resolved[tfile], temp);
    }
    
    // Process layout as prescribed
    else if (tfiles[tfile]) {
      
      // Lookup layout in tfiles tree
      let tdata = tfiles[tfile];
      
      // Combine parent-child on `temp` via `injectContent`
      temp = injectContent(tdata.contents.toString(), temp);
      
      // If this layout has a parent `layout` in front-matter, "lather, rinse, repeat"
      return tdata.layout ? resolveTemplate(tfiles, tdata.layout, resolved, temp) : temp;
    }
    else {
      return temp;
    }
  }
  
  /**
   * Combine parent-child content on `{{{contents}}}` expression
   * This could be set as an options @property for `plugin` if wanted
   *
   * @param {String} parentContent
   * @param {String} childContent
   * @return {String}
   */
   
  function injectContent (parentContent, childContent) {
    // If no `childContent` return `parentContent` as-is
    return childContent ? parentContent.replace(/\{\{\{\s*contents\s*\}\}\}/gim, childContent) : parentContent;
  }
  
  // Storage for resolved layouts
  let resolved = {};
  
  /**
   * Main plugin function
   */
  
  return function (files, metalsmith, done) {
    
    /**
     * Create build tree for layout files
     */
     
    Metal(process.cwd())
    
    .source(opts.directory)
    
    .destination(opts.generated)
    
    // Access layout build tree `tfiles` from `nested` directory
    .use(function(tfiles, metal, next) {
      
      setImmediate(next);
      
      // Process each page file (not layout) for `layout` front-matter or default layout
      Object.keys(files).forEach(file => {
        
        // Test if we use a layout on this page file or skip
        if (!check(files, file, opts.pattern, opts.default)) {
          return; // next page
        }
        
        let layout = files[file].layout || opts.default,
            combined;
        
        // Check if already resolved layout before processing
        if (resolved[layout]) {
          combined = resolved[layout];
        }
        else {
          // Process-combine layout files recursively for this page
          combined = resolveTemplate(tfiles, layout, resolved);
          
          // Store combined results for future pages using same layout
          resolved[layout] = combined;
        }
        
        // Write combined layouts result to layout build tree
        // *** It's worth noting that until now we are always passing {String} values
        // converted from layout `tfile.contents` and not a file {Object} or {Buffer}
        tfiles[layout].contents = new Buffer(combined);
        
      });
    })
    
    // Write layout build tree to `generated` directory
    .build(function(err) {
      if (err) throw err;
    });
    
    // We must allow time to disc write combined layout files
    // before processing `metalsmith-layout` plugin
    setTimeout(done, 100);
  };
}

