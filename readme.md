# Ghost Updater for Microsoft Azure

Required steps
- Backup data (manual step)
- Stop website
- Download new ghost
- Replace index.js, package.js
- Replace ./core
- Replace ./content/themes/casper
- Run website
- Run npm install --production

# Use KuduExec!

# Using REST API cmd interface
- cd /home
- mkdir temp
- cd ./temp
- download Ghost zip
- stream PUT Ghost zip
- unzip ghost zip
- move files
- npm install --production
- restart website


// Get file
var http = require('http');
var fs = require('fs');

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

// Put file
fs.createReadStream('file.json').pipe(request.put('http://mysite.com/obj.json'))