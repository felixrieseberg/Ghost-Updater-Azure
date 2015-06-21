var config      = require('../config'),
    debug       = require('debug')('gu-filesfolders'),
    request     = require('request'),
    Promise     = require('bluebird'),
    fs          = require('fs');

Promise.promisifyAll(request);
Promise.promisifyAll(fs);

/**
 * The 'filesfolders' module contains helper methods allowing the interaction
 * with Kudu's VFS API - enabling basic file operations on the website
 * @type {Object}
 */
var filesfolders = {
    /**
     * Creates a directory
     * @param  {string} dir - Name of the directory
     * @return {promise} - Resolving to the VFS API's response
     */
    mkDir: function (dir) {
        return this.mk(dir, true);
    },

    /**
     * Creates a file
     * @param  {string} dir - Name of the file
     * @return {promise} - Resolving to the VFS API's response
     */
    mkFile: function (file) {
        return this.mk(file, false);
    },

    /**
     * Removes a directory
     * @param  {string} dir - Name of the directory
     * @return {promise} - Resolving to the VFS API's response
     */
    rmDir: function (dir) {
        return this.rm(dir, true);
    },

    /**
     * Creates a file
     * @param  {string} dir - Name of the file
     * @return {promise} - Resolving to the VFS API's response
     */
    rmFile: function (file) {
        return this.rm(file, false);
    },

    /**
     * Creates an element
     * @param  {string}  target - Name of the element
     * @param  {Boolean} isDir  - Are we creating a directory?
     * @return {promise} - Resolving to the VFS API's response
     */
    mk: function (target, isDir) {
        target = (isDir) ? target + '/' : target;

        return request.putAsync(config.website + '/api/vfs/' + target, {
            'auth': config.auth(),
        }).then(function(response) {
            return response;
        }).catch(console.log);
    },

    /**
     * Removes an element
     * @param  {string}  target - Name of the element
     * @param  {Boolean} isDir  - Are we removing a directory?
     * @return {promise} - Resolving to the VFS API's response
     */
    rm: function (target, isDir) {
        target = (isDir) ? target + '/?recursive=true' : target;

        return request.delAsync(config.website + '/api/vfs/' + target, {
            'auth': config.auth()
        }).then(function(response) {
            debug('Delete: ', response);
            return response;
        }).catch(console.log);    
    },

    /**
     * Lists a directory's content
     * @param  {string} target - Name of the direcotry
     * @return {promise} - Resolving to the VFS API's response
     */
    list: function (target) {
        return new Promise(function (resolve, reject) {
            var targetUrl = config.website + '/api/vfs/' + target + '/',
                errorCheck;

            debug('Listing dir for ' + targetUrl);
            request.getAsync(targetUrl, {'auth': config.auth()})
            .then(function (response) {
                errorCheck = filesfolders.checkForError(response);
                if (errorCheck) {
                    return reject(errorCheck);
                } 

                resolve(response);
            }).catch(function (error) {
                debug('List: Request failed', error);
                reject(error);
            });
        });
    },

    /**
     * Uploads a file to the Azure Web App
     * @param  {string} source - Path to local file
     * @param  {string} target - Path and name of the remote location
     * @return {promise} - Resolving to the VFS API's response
     */
    upload: function (source, target) {
        return new Promise(function (resolve, reject) {
            var targetUrl = config.website + '/api/vfs/' + target,
                sourceStream, errorCheck;

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

    /**
     * Uploads a webjob to the Azure Web App's Kudu service
     * @param  {string} source - Path to local script
     * @param  {string} name - Name of the webjob
     * @return {promise} - Resolving to the VFS API's response
     */
    uploadWebjob: function (source, name) {
        return new Promise(function (resolve, reject) {
            var targetUrl = config.website + '/api/triggeredwebjobs/' + name,
                sourceStream = fs.createReadStream(source),
                errorCheck;

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

                        errorCheck = filesfolders.checkForError(response);
                        if (errorCheck) {
                            return reject(errorCheck);
                        } 

                        resolve(response);
                    })
                );
            }).catch(function (error) {
                reject(error);
            });
        });
    },

    /**
     * Hit's the Azure Web App's Kudu service's webjob api for the log and
     * status of a webjob
     * @param  {string} name - Name of the webjob
     * @return {promise} - Resolves to the Kudu API response
     */
    getWebjobInfo: function (name) {
        return new Promise(function (resolve, reject) {
            var targetUrl = config.website + '/api/triggeredwebjobs/' + name,
            errorCheck;

            request.get(targetUrl, {'auth': config.auth()},
                function (error, response, body) {
                    if (error) {
                        debug('Get Webjob Info Error: ', error);
                        reject(error);
                    }

                    debug('Get Webjob Info Response: ', response);
                    debug('Get Webjob Info Body: ', body);

                    errorCheck = filesfolders.checkForError(response);
                    if (errorCheck) {
                        return reject(errorCheck);
                    } 
                    
                    resolve(response);
                }
            );
        });
    },

    /**
     * Takes a webjob log URL and returns the content as plain text
     * @param  {string} targetUrl - Url of the webjob log
     * @return {promise} - Resolves to the Kudu API response
     */
    getWebjobLog: function (targetUrl) {
        return new Promise(function (resolve, reject) {
            var errorCheck;

            request.get(targetUrl, {'auth': config.auth()},
                function (error, response, body) {
                    if (error) {
                        debug('Get Webjob Log Error: ', error);
                        reject(error);
                    }

                    debug('Get Webjob Log Response: ', response);
                    debug('Get Webjob Log Body: ', body);

                    errorCheck = filesfolders.checkForError(response);
                    if (errorCheck) {
                        return reject(errorCheck);
                    } 

                    resolve(body);
                }
            );
        });
    }, 

    /**
     * Trigger's a webjob on the Azure Web App's Kudu service
     * @param  {string} name - Name of the webjob
     * @return {promise} - Resolves to the Kudu API response
     */
    triggerWebjob: function (name) {
        return new Promise(function (resolve, reject) {
            var targetUrl = config.website + '/api/triggeredwebjobs/' + name + '/run',
                errorCheck;

            debug('Triggering Webjob ' + name);

            request.post(targetUrl, {'auth': config.auth()}, 
                function (error, response, body) {
                    if (error) {
                        debug('Trigger Error: ', error);
                        reject(error);
                    }

                    debug('Trigger Response: ', response);
                    debug('Trigger Body: ', body);

                    errorCheck = filesfolders.checkForError(response);
                    if (errorCheck) {
                        return reject(errorCheck);
                    }

                    resolve(response);
                }
            );
        });
    },

    /**
     * Small helper function used in all methods above, checking the Azure response
     * for errors. This is required because Azure likes to return an HTML document
     * describing the error, but it returns said HTML document with status 200 -
     * the AJAX requests therefore think that everything is fine.
     * @param  {AJAX response object} response - The response that should be checked
     * @return {boolean} - If there's no error, we return false
     */
    checkForError: function (response) {
        // Azure shouldn't return HTML, so something is up
        response = (response[0] && response[0].headers) ? response[0] : response;

        if (response.headers && response.headers['content-type'] && response.headers['content-type'] === 'text/html') {
            debug('Azure returned text/html, checking for errors');

            if (response.body && response.body.indexOf('401 - Unauthorized') > -1) {
                return 'Invalid Credentials: The Azure Website rejected the given username or password.';
            }
        }

        return false;
    }
};

module.exports = filesfolders;