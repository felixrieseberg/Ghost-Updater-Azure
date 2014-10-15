var express         = require('express'),
    debug           = require('debug')('Backup'),
    router          = express.Router(),
    Promise         = require('bluebird'),

    filesfolders    = require('./filesfolders');

var createScriptRunning, createScriptLog,
    restoreScriptRunning, restoreScriptLog,
    deleteScriptRunning, deleteScriptLog;

router.get('/deploy', function (req, res) {
    debug('Deploying Backup Scripts');

    var create = filesfolders.uploadWebjob('./bin/createBackup.ps1', 'createBackup.ps1'),
        remove = filesfolders.uploadWebjob('./bin/removeBackup.ps1', 'removeBackup.ps1'),
        restore = filesfolders.uploadWebjob('./bin/restoreBackup.ps1', 'restoreBackup.ps1');

    return Promise.all([create, remove, restore])
    .then(function (results) {
        debug('Upload done, result: ' + results);
        return res.json({ status: 'Scripts deployed' });
    });
});

router.post('/create', function (req, res) {
    debug('Triggering Create Backup Webjob');

    return filesfolders.triggerWebjob('createBackup.ps1')
    .then(function (result) {
        debug('Trigger successful, result: ' + result);
        return res.json(result);
    });
});

router.post('/restore', function (req, res) {
    debug('Triggering Restore Backup Webjob');

    return filesfolders.triggerWebjob('restoreBackup.ps1')
    .then(function (result) {
        debug('Trigger successful, result: ' + result);
        return res.json(result);
    });
});

router.post('/delete', function (req, res) {
    debug('Triggering Delete Backup Webjob');

    return filesfolders.triggerWebjob('deleteBackup.ps1')
    .then(function (result) {
        debug('Trigger successful, result: ' + result);
        return res.json(result);
    });
});

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

router.get('/delete', function (req, res) {
    debug('Getting create script info');

    var responseBody;

    if (!deleteScriptRunning && !deleteScriptLog) {
        return filesfolders.getWebjobInfo('deleteBackup.ps1')
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