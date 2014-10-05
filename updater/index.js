var express         = require('express'),
    config          = require('../config'),
    debug           = require('debug')('Updater'),
    Promise         = require('bluebird'),
    router          = express.Router(),
    fs              = require('fs'),
    request         = require('request'),

    filesfolders    = require('./filesfolders');

Promise.promisifyAll(require('request'));

function uploadGhost() {
    debug('Uploading Ghost to Azure Website');
    filesfolders.upload('ghost.zip', 'site/temp/ghost.zip')
    .then(function (result) {
        debug('Upload done, result: ' + res);
    }).then(function() {
        //Check result
        // Unzip
    });
}

function postCommand(body) {
    body = JSON.stringify(body);

    return request.postAsync({
        'auth': config.auth,
        'url': config.website + '/api/command',
        'body': body,
        'headers': {
            'Content-Type': 'application/json',
            'Content-Length': body.length
        }
    }).then(function(response, body) {
        debug('Response received', response);
        return response;
    }).catch(console.log);
}

function unzipGhost() {

}


// Upload ZIP with CMD file?
// And then execute that?

router.get('/', function(req, res) {
    postCommand({
        "cmd": 'unzip ghost',
        "dir": 'site\\temp'
    })
    res.json('done');
});

module.exports = router;