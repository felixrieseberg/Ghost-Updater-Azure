var config      = require('../config'),
    debug       = require('debug')('Filesfolders'),
    request     = require('request'),
    Promise     = require('bluebird'),
    fs          = require('fs');

Promise.promisifyAll(request);
Promise.promisifyAll(fs);

var auth = {
    'user': config.user,
    'pass': config.password
};

var filesfolders = {
    mkDir: function (dir) {
        return this.mk(dir, true);
    },

    mkFile: function (file) {
        return this.mk(file, false);
    },

    rmDir: function (dir) {
        return this.rm(dir, true);
    },

    rmFile: function (file) {
        return this.rm(file, false);
    },

    mk: function (target, isDir) {
        target = (isDir) ? target + '/' : target;

        return request.putAsync(config.website + '/api/vfs/' + target, {
            'auth': auth,
        }).then(function(response) {
            if (response.statusCode === '409') {
                // Directory already exists
            }
            return response;
        }).catch(console.log);
    },

    rm: function (target, isDir) {
        target = (isDir) ? target + '/?recursive=true' : target;

        return request.delAsync(config.website + '/api/vfs/' + target, {
            'auth': config.auth()
        }).then(function(response) {
            debug('Delete: ', response);
            return response;
        }).catch(console.log);    
    },

    list: function (target) {
        var targetUrl = config.website + '/api/vfs/' + target + '/';

        debug('Listing dir for ' + targetUrl);
        return request.getAsync(targetUrl, {'auth': config.auth()});
    },

    upload: function (source, target) {
        return new Promise(function (resolve, reject) {
            var targetUrl = config.website + '/api/vfs/' + target,
                sourceStream;

            if (!fs.existsSync(source)) {
                return reject('The file ' + source + ' does not exist or cannot be read.');
            }

            sourceStream = fs.createReadStream(source);

            debug('Uploading ' + source + ' to ' + target);

            sourceStream.pipe(request.put(targetUrl, {'auth': config.auth()}, 
                function(error, result) {
                    if (error) {
                        debug('Upload Error: ', error);
                        return reject(error);
                    }
                    return resolve(result);
                })
            );
        });
    },

    uploadWebjob: function (source, name) {
        return new Promise(function (resolve, reject) {
            var targetUrl = config.website + '/api/triggeredwebjobs/' + name,
                sourceStream = fs.createReadStream(source);

            debug('Uploading Webjob ' + source + ' as ' + name);

            request.delAsync(targetUrl, {'auth': config.auth()})
            .then(function () {
                sourceStream.pipe(request.put(targetUrl, {
                    'auth': config.auth(),
                    'headers': {
                        'Content-Disposition': 'attachement; filename=' + name
                    }
                }, 
                    function(error, response, body) {
                        if (error) {
                            debug('Upload Webjob Error: ', error);
                            reject(error);
                        }
                        debug('Upload Webjob Response: ', response);
                        debug('Upload Webjob Body: ', body);
                        resolve(response);
                    })
                );
            });
        });
    },

    getWebjobInfo: function (name) {
        return new Promise(function (resolve, reject) {
            var targetUrl = config.website + '/api/triggeredwebjobs/' + name;

            request.get(targetUrl, {'auth': config.auth()},
                function (error, response, body) {
                    if (error) {
                        debug('Get Webjob Info Error: ', error);
                        reject(error);
                    }

                    debug('Get Webjob Info Response: ', response);
                    debug('Get Webjob Info Body: ', body);
                    resolve(response);
                }
            );
        });
    },

    getWebjobLog: function (targetUrl) {
        return new Promise(function (resolve, reject) {
            request.get(targetUrl, {'auth': config.auth()},
                function (error, response, body) {
                    if (error) {
                        debug('Get Webjob Log Error: ', error);
                        reject(error);
                    }

                    debug('Get Webjob Log Response: ', response);
                    debug('Get Webjob Log Body: ', body);
                    resolve(body);
                }
            );
        });
    }, 

    triggerWebjob: function (name) {
        return new Promise(function (resolve, reject) {
            var targetUrl = config.website + '/api/triggeredwebjobs/' + name + '/run';

            debug('Triggering Webjob ' + name);

            request.post(targetUrl, {'auth': config.auth()}, 
                function (error, response, body) {
                    if (error) {
                        debug('Trigger Error: ', error);
                        reject(error);
                    }
                    debug('Trigger Response: ', response);
                    debug('Trigger Body: ', body);
                    resolve(response);
                }
            );
        });
    },
    
    simpleUID: function() {
        return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
    }
};

module.exports = filesfolders;