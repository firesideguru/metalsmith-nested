
'use strict';

const
  debug = require('debug')('metalsmith-nested'),
  matter = require('gray-matter'),
  path = require('path'),
  fs = require('fs');

module.exports = plugin;

function plugin (config) {
  
  let opts = {
    directory: 'layouts',
    pattern: undefined,
    default: undefined
  };
  let diff = {};
  
  if (typeof(config) === 'object' && !(config instanceof Array)) {
    Object.keys(config).forEach(key => {
      if (opts[key] === undefined) {
        diff[key] = config[key];
      }
      else {
        opts[key] = config[key];
      }
    });
  }
  else if (config !== undefined) {
    throw new Error('metalsmith-nested error: options argument must be an object');
  }
  
  return function (files, metalsmith, done) {
    setImmediate(done);
    
    Object.keys(files).forEach(file => {
      let fileContent = files[file].contents.toString();
      let parsed = matter(fileContent);
      if (parsed.data && parsed.data.layout) {
        let parentPath = path.resolve(opts.directory, parsed.data.layout);
        let childContent = parsed.content;
        if (!fs.existsSync(parentPath)) {
            throw new Error(`metalsmith-nested error: layout file not found at path "${parentPath}"`);
        }
        let parentContent = fs.readFileSync(parentPath).toString();
        let tempContent = parentContent.replace(/\{\{\{\s*contents\s*\}\}\}/gim, childContent);
        files[file].contents = new Buffer(tempContent);
        // append additional config properties to file metadata -- on the other hand WHY?
        // Object.keys(diff).forEach(key => {
        //   files[file][key] = diff[key];
        // })
      }
    });
  };
}