var express         = require('express'),
    debug           = require('debug')('Updater'),
    _               = require('underscore'),
    router          = express.Router(),

    config          = require('../config'),
    filesfolders    = require('./filesfolders');

var updaterScriptRunning, updaterScriptLog;

router.get('/config', function (req, res) {
    var website, scmPosition;

    debug('Config variables received', req.query);

    // Clean URL
    website = 'https://' + req.query.url;
    scmPosition = website.indexOf('.azurewebsites.net');
    website = website.substr(0, scmPosition) + '.scm' + website.substr(scmPosition);

    config.website = website;
    config.username = req.query.username;
    config.password = req.query.password;
    if (config.standalone && req.query.zippath) {
        config.zippath = req.query.zippath;
    }

    debug('Config is now:', config.website, config.username, config.password, config.zippath);

    res.json({ website: config.website, username: config.username, password: config.password, zippath: config.zippath });
});

router.get('/upload', function (req, res) {
    debug('Uploading Ghost to Azure Website');

    // Check if file already exists - if so, nuke the folder.
    filesfolders.list('site/temp')
    .then(function (result) {
        var filteredResponse,
            response = JSON.parse(result[1]) || null;

        debug('Get List Response: ', response);

        filteredResponse = _.findWhere(response, {path: 'D:\\home\\site\\temp\\ghost.zip'});
        debug('Filtered response: ', filteredResponse);
        if (filteredResponse) {
            debug('Ghost.zip already exists, deleting /temp folder.');
            return filesfolders.rmDir('site/temp');
        }
        return;
    }).then(function() {
        filesfolders.upload(config.zippath, 'site/temp/ghost.zip')
        .then(function (result) {
            debug('Upload done, result: ' + result);
            res.json(result);
        }).catch(function(error) {
            res.json({ err: error });
        });
    });
});

router.get('/deploy', function (req, res) {
    debug('Deploying Updater Webjob');

    return filesfolders.uploadWebjob('./bin/updater.ps1', 'updater.ps1')
    .then(function (result) {
        debug('Upload done, result: ' + result);
        res.json(result);
    });
});

router.get('/trigger', function (req, res) {
    debug('Triggering Updater Webjob');

    return filesfolders.triggerWebjob('updater.ps1')
    .then(function (result) {
        debug('Trigger successful, result: ' + result);
        return res.json(result);
    });
});

router.get('/info', function (req, res) {
    debug('Getting log info');

    var responseBody;

    if (!updaterScriptRunning && !updaterScriptLog) {
        return filesfolders.getWebjobInfo('updater.ps1')
        .then(function (result) {
            debug(result);
            
            if (result && result.statusCode === 200) {
                responseBody = JSON.parse(result.body);
                updaterScriptLog = (responseBody.latest_run && responseBody.latest_run.output_url) ? responseBody.latest_run.output_url : '';
                updaterScriptRunning = (updaterScriptLog) ? true : false;
            }

            debug(updaterScriptLog);
            return updaterScriptLog;
        }).then(function () {
            return filesfolders.getWebjobLog(updaterScriptLog)
            .then(function (logcontent) {
                debug('We have content! Size: ' + logcontent.length);
                res.set('Content-Type', 'text/plain');
                return res.send(logcontent);
            });
        });
    } else {
        return filesfolders.getWebjobLog(updaterScriptLog)
        .then(function (logcontent) {
            res.set('Content-Type', 'text/plain');
            return res.send(logcontent);
        });
    }    
});

module.exports = router;