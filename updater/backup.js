var express         = require('express'),
    debug           = require('debug')('gu-backup'),
    router          = express.Router(),
    Promise         = require('bluebird'),

    filesfolders    = require('./filesfolders');

var createScriptRunning, createScriptLog,
    restoreScriptRunning, restoreScriptLog,
    deleteScriptRunning, deleteScriptLog;

/**
 * Router endpoint for 'deployment', initiating the deployment of all backup scripts
 * to Kudu's webjob api.
 * @param  {Express request} req
 * @param  {Express response} res
 * @return {Express response JSON} - JSON describing success or failure of deployment
 */
router.get('/deploy', function (req, res) {
    debug('Deploying Backup Scripts');

    var create = filesfolders.uploadWebjob('./public/powershell/createBackup.ps1', 'createBackup.ps1'),
        remove = filesfolders.uploadWebjob('./public/powershell/removeBackup.ps1', 'removeBackup.ps1'),
        restore = filesfolders.uploadWebjob('./public/powershell/restoreBackup.ps1', 'restoreBackup.ps1');

    return Promise.all([create, remove, restore])
    .then(function (results) {
        debug('Upload done, result: ' + results);
        return res.json({ status: 'Scripts deployed' });
    }).catch(function (error) {
        debug('Scripts deployment error: ', error);
        return res.json({ error: error });
    });
});

/**
 * Router endpoint triggering the 'create backup' webjob, which will
 * instruct Kudu to make a backup of the page (essentially just copying files)
 * @param  {Express request} req
 * @param  {Express response} res
 * @return {Express response JSON} - JSON describing success or failure
 */
router.post('/create', function (req, res) {
    debug('Triggering Create Backup Webjob');

    return filesfolders.triggerWebjob('createBackup.ps1')
    .then(function (result) {
        debug('Trigger successful, result: ' + result);
        return res.json(result);
    });
});

/**
 * Router endpoint triggering the 'restore backup' webjob, which will
 * instruct Kudu to restore a made backup (essentially just copying back files)
 * @param  {Express request} req
 * @param  {Express response} res
 * @return {Express response JSON} - JSON describing success or failure
 */
router.post('/restore', function (req, res) {
    debug('Triggering Restore Backup Webjob');

    return filesfolders.triggerWebjob('restoreBackup.ps1')
    .then(function (result) {
        debug('Trigger successful, result: ' + result);
        return res.json(result);
    });
});

/**
 * Router endpoint triggering the 'delete backup' webjob, which will instruct Kudu
 * to delete a previously made backup
 * @param  {Express request} req
 * @param  {Express response} res
 * @return {Express response JSON} - JSON describing success or failure
 */
router.post('/delete', function (req, res) {
    debug('Triggering Delete Backup Webjob');

    return filesfolders.triggerWebjob('removeBackup.ps1')
    .then(function (result) {
        debug('Trigger successful, result: ' + result);
        return res.json(result);
    });
});

/**
 * Router endpoint returning the current status and log of the 'create backup'
 * script
 * @param  {Express request} req
 * @param  {Express response} res
 * @return {Express response text/plain} - Plain text of the log
 */
router.get('/create', function (req, res) {
    debug('Getting create script info');

    var responseBody;

    if (!createScriptRunning && !createScriptLog) {
        return filesfolders.getWebjobInfo('createBackup.ps1')
        .then(function (result) {
            debug(result);
            
            if (result && result.statusCode === 200) {
                responseBody = JSON.parse(result.body);
                createScriptLog = (responseBody.latest_run && responseBody.latest_run.output_url) ? responseBody.latest_run.output_url : '';
                createScriptRunning = (createScriptLog) ? true : false;
            }

            debug(createScriptLog);
            return createScriptLog;
        }).then(function () {
            return filesfolders.getWebjobLog(createScriptLog)
            .then(function (logcontent) {
                debug('We have content! Size: ' + logcontent.length);
                res.set('Content-Type', 'text/plain');
                return res.send(logcontent);
            });
        });
    } else {
        return filesfolders.getWebjobLog(createScriptLog)
        .then(function (logcontent) {
            res.set('Content-Type', 'text/plain');
            return res.send(logcontent);
        });
    }    
});

/**
 * Router endpoint returning the current status and log of the 'restore backup'
 * script
 * @param  {Express request} req
 * @param  {Express response} res
 * @return {Express response text/plain} - Plain text of the log
 */
router.get('/restore', function (req, res) {
    debug('Getting restore script info');

    var responseBody;

    if (!restoreScriptRunning && !restoreScriptLog) {
        return filesfolders.getWebjobInfo('restoreBackup.ps1')
        .then(function (result) {
            debug(result);
            
            if (result && result.statusCode === 200) {
                responseBody = JSON.parse(result.body);
                restoreScriptLog = (responseBody.latest_run && responseBody.latest_run.output_url) ? responseBody.latest_run.output_url : '';
                restoreScriptRunning = (restoreScriptLog) ? true : false;
            }

            debug(restoreScriptLog);
            return restoreScriptLog;
        }).then(function () {
            return filesfolders.getWebjobLog(restoreScriptLog)
            .then(function (logcontent) {
                debug('We have content! Size: ' + logcontent.length);
                res.set('Content-Type', 'text/plain');
                return res.send(logcontent);
            });
        });
    } else {
        return filesfolders.getWebjobLog(restoreScriptLog)
        .then(function (logcontent) {
            res.set('Content-Type', 'text/plain');
            return res.send(logcontent);
        });
    }    
});

/**
 * Router endpoint returning the current status and log of the 'delete backup'
 * script
 * @param  {Express request} req
 * @param  {Express response} res
 * @return {Express response text/plain} - Plain text of the log
 */
router.get('/delete', function (req, res) {
    debug('Getting create script info');

    var responseBody;

    if (!deleteScriptRunning && !deleteScriptLog) {
        return filesfolders.getWebjobInfo('removeBackup.ps1')
        .then(function (result) {
            debug(result);
            
            if (result && result.statusCode === 200) {
                responseBody = JSON.parse(result.body);
                deleteScriptLog = (responseBody.latest_run && responseBody.latest_run.output_url) ? responseBody.latest_run.output_url : '';
                deleteScriptRunning = (deleteScriptLog) ? true : false;
            }

            debug(deleteScriptLog);
            return deleteScriptLog;
        }).then(function () {
            return filesfolders.getWebjobLog(deleteScriptLog)
            .then(function (logcontent) {
                debug('We have content! Size: ' + logcontent.length);
                res.set('Content-Type', 'text/plain');
                return res.send(logcontent);
            });
        });
    } else {
        return filesfolders.getWebjobLog(deleteScriptLog)
        .then(function (logcontent) {
            res.set('Content-Type', 'text/plain');
            return res.send(logcontent);
        });
    }    
});

module.exports = router;