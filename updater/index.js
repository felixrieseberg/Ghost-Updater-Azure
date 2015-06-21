var express         = require('express'),
    debug           = require('debug')('gu-updater'),
    _               = require('underscore'),
    router          = express.Router(),

    config          = require('../config'),
    filesfolders    = require('./filesfolders');

var updaterScriptRunning, updaterScriptLog;

/**
 * Router endpoint enabling configuration.
 * TODO: This probably shouldn't be a GET?
 * @param  {Express request} req
 * @param  {Express response} res
 * @return {Express response.json} - JSON describing the new set configuration
 */
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

/**
 * Router endpoint triggering the file upload of the locally selected Ghost zip file
 * @param  {Express request} req
 * @param  {Express response} res
 * @return {Express response.json} - JSON describing success or failure
 */
router.get('/upload', function (req, res) {
    debug('Uploading Ghost to Azure Website');

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
            res.json({error: error});
        });
    }).catch(function (error) {
        debug(error);
        res.json({error: error});
    });
});

/**
 * Router endpoint triggering the deployment of the 'updater' webjob to the 
 * Kudu service. This script is the big one actually performing the upgrade.
 * @param  {Express request} req
 * @param  {Express response} res
 * @return {Express response.json} - JSON describing success or failure
 */
router.get('/deploy', function (req, res) {
    debug('Deploying Updater Webjob');

    return filesfolders.uploadWebjob('./public/powershell/updater.ps1', 'updater.ps1')
    .then(function (result) {
        debug('Upload done, result: ' + result);
        res.json(result);
    });
});

/**
 * Router endpoint triggering the 'updater' webjob. Hit this endpoint and
 * Kudu will attempt upgrading the Ghost installation.
 * @param  {Express request} req
 * @param  {Express response} res
 * @return {Express response.json} - JSON describing success or failure
 */
router.get('/trigger', function (req, res) {
    debug('Triggering Updater Webjob');

    return filesfolders.triggerWebjob('updater.ps1')
    .then(function (result) {
        debug('Trigger successful, result: ' + result);
        return res.json(result);
    });
});

/**
 * Router endpoint returning the current log and status of the 'updater' webjob,
 * shoudl said webjob be running
 * @param  {Express request} req
 * @param  {Express response} res
 * @return {Express response text/plain} - Plain text of the log
 */
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