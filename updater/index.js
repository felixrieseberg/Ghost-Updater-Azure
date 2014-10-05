var express         = require('express'),
    config          = require('../config'),
    debug           = require('debug')('Updater'),
    Promise         = require('bluebird'),
    router          = express.Router(),
    fs              = require('fs'),
    filesfolders    = require('./filesfolders');

function uploadGhost() {
    debug('Uploading Ghost to Azure Website');

    return filesfolders.upload('ghost.zip', 'site/temp/ghost.zip')
    .then(function (result) {
        debug('Upload done, result: ' + result);
        return true;
    });
}

function uploadUpdaterScript() {
    debug('Deploying Updater Webjob');

    return filesfolders.uploadWebjob('./bin/updater.ps1', 'updater.ps1')
    .then(function (result) {
        debug('Upload done, result: ' + result);
        return true;
    });
}

function triggerUpdaterScript() {
    debug('Triggering Updater Webjob');
    return filesfolders.triggerWebjob('updater.ps1')
    .then(function (result) {
        debug('Trigger successful, result: ' + result);
        return true;
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