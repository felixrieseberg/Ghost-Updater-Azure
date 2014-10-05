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
        debug('Upload done, result: ' + result);
    });
}

function uploadUpdaterScript() {
    debug('Deploying Updater Webjob');

    filesfolders.uploadWebjob('./bin/updater.ps1', 'updater.ps1')
    .then(function (result) {
        debug('Upload done, result: ' + result);
    });
}

function triggerUpdaterScript() {
    debug('Triggering Updater Webjob');
    filesfolders.triggerWebjob('updater.ps1')
    .then(function (result) {
        debug('Trigger successful, result: ' + result);
    });
}

router.get('/upload', function(req, res) {
    res.json('Uploading Ghost to target website');
    uploadGhost();
});

router.get('/deploy', function(req, res) {
    res.json('Deploying updater script to target website');
    uploadUpdaterScript();
});

router.get('/trigger', function(req, res) {
    res.json('Triggering updater script to target website');
    triggerUpdaterScript();
});


module.exports = router;