
'use strict';

const
  debug      = require('debug')('metalsmith-nested'),
  Metalsmith = require('metalsmith'),
  match      = require('multimatch'),
  // path       = require('path'),
  fs         = require('fs');

module.exports = plugin;

function resolveTemplate (tfiles, tfile, resolved, temp = '') {
  if (resolved[tfile]) {
    return injectContent(resolved[tfile], temp);
  }
  else if (tfiles[tfile]) {
    let tdata = tfiles[tfile];
    temp = injectContent(tdata.contents.toString(), temp);
console.log('TEMP', temp)
    return tdata.layout ? resolveTemplate(tfiles, tdata.layout, resolved, temp) : temp;
  }
  else {
    return temp;
  }
}

function rebuildPath (template, directory, generated, flatten) {
  let pltPaths = template.replace(/\\+/g, '/').split('/');
  let dirPaths = directory.replace(/\\+/g, '/').split('/');
  let genPaths = generated.replace(/\\+/g, '/').split('/');

  // test that opts.gen is child of opts.dir
  let childOf = dirPaths.every(dir => genPaths.indexOf(dir) > -1);
  
  if (!childOf) {
    console.warn(`metalsmith-nested warning: generated directory (${generated}) is not defined as a child of layouts directory (${directory})`);
  }
  
  if (flatten) {
    pltPaths = pltPaths.slice(-1); // just file node
  }
  
  if (childOf) {
    // remove common 'layouts' directory paths
    // it would be more robust to use an indexed loop here...and compare on each index
    
    return 'xfiles/child.html'
    return genPaths.concat(pltPaths).join('/');
    
    // let diffPaths = genPaths.filter(dir => dirPaths.indexOf(dir) < 0 );
    // return diffPaths.concat(pltPaths).join('/');
  }
  else {
    // just combine and return ... no way to predict usage
    return genPaths.concat(pltPaths).join('/');
  }
}

function injectContent (parentContent, childContent) {
  return childContent ? parentContent.replace(/\{\{\{\s*contents\s*\}\}\}/gim, childContent) : parentContent;
}

function finalizeTemplates (original, resolved) {
  // clean up, only write files with data object in 'resolved' hash
  // store tfiles data and write back to tfiles[tfile]
  Object.keys(original).forEach(data => {
    if (resolved[data]) {
      original[data] = resolved[data];
    }
    else {
      delete original[data];
    }
  });
}

// https://github.com/superwolff/metalsmith-layouts/blob/master/lib/helpers/check.js
function check(files, file, pattern, def){
  let data = files[file];
  // * test that file is utf-8, not binary, here
  if (pattern && !match(file, pattern)[0]) {
    return false;
  }
  // Only process files with a specified layout or default template.
  // Allow the default template to be cancelled by layout: false.
  return 'layout' in data ? data.layout : def;
}


function plugin (config) {
  
  if (config && (typeof(config) !== 'object' || config instanceof Array)) {
    throw new Error('metalsmith-nested error: options argument must be an object');
  }
  
  let opts = {
    dir: config.directory || 'layouts',
    gen: config.generated || 'layouts/xfiles',
    pat: config.pattern, // match to apply default template
    def: config.default, // default layout template file
    flt: config.flatten  // flatten directory structure ???
  };
  
  if (!fs.existsSync(opts.gen)) {
    fs.mkdirSync(opts.gen, '0744');
  }
  
  let resolved = {};
  
  // parse content page files template layout
  //
  return function (files, metalsmith, done) {
    
    // setImmediate(done); // breaks build every other build
    
    // parse template layout files using metalsmith
    //
    Metalsmith(process.cwd())
    // .source(opts.dir)
    // .destination(opts.gen)
    .source('./foo')
    .destination('./foo/xfiles')
    .clean(true)
    
    .use((tfiles, metal, next) => {
      
      // setImmediate(next);
      
      // parse each site page file
      //
      Object.keys(files).forEach(file => {
        
        // test if we parse layout on this page file ???
        //
        if (!check(files, file, opts.pat, opts.def)) {
          return;
        }
        
        let data = files[file];
        
        let template = data.layout || opts.def;
        
        // lookup (resolve recursive) template for this page file
        data.contents = new Buffer(resolveTemplate(tfiles, template, resolved));
        
        resolved[template] = data; // store for finalizeTemplates
        
        // update files[file] key value to point to new templates (layouts)
        //
        data.layout = rebuildPath(template, opts.dir, opts.gen, opts.flt);
console.log('DATA', data.contents.toString())
      });
      
      finalizeTemplates(tfiles, resolved);
      setImmediate(next);//next();
    })
    .build(function(err) {
      if (err) throw err;
    });
    console.log('EXISTS', fs.existsSync('/home/chronos/user/Downloads/metalsmith/alpha/foo/xfiles/child.html'))
    setImmediate(done);//done();
  };
}

