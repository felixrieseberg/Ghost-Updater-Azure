var UpdaterClient = UpdaterClient || {}; 

var bScriptLog, bScriptLogArea;

UpdaterClient.backup = {

    scriptsDeployed: false,

    appendLog: function (text, loading, error) {
        var loader = '',
        errorText = (error) ? '<span class="error">Error: </span>' : '';

        if ($('#loading')) {
            $('#loading').remove();
        }

        loader = (loading) ? ' <img id="loading" src="/images/loading.gif" />' : '';
        return $('#backupOutputArea').append('<p>' + errorText + text + loader + '</p>');
    },

    appendError: function (text) {
        return this.appendLog(text, false, true);
    },

    deployScripts: function (callback) {
        var self = this;
        this.appendLog('Deploying backup scripts to Azure Website', true);

        $.ajax('/backup/deploy').done(function () {
            self.appendLog('Scripts successfully deployed');
            self.scriptsDeployed = true;

            if (callback) {
                callback.call(self);
            }
        });
    },

    makeBackup: function () {
        var self = this;
        this.appendLog('Instructing Azure to create backup (this might take a while)', true);
        
        $.post('/backup/create').done(function (response) {
            if (response) {
                console.log('Triggered create, getting status');
                self.getScriptStatus('create');
            }
        });
    },

    deleteBackup: function () {
        var self = this;
        this.appendLog('Instructing Azure to delete backup', true);
        
        $.post('/backup/delete').done(function (response) {
            if (response) {
                self.getScriptStatus('delete');
            }
        });
    },

    restoreBackup: function () {
        var self = this;
        this.appendLog('Instructing Azure to restore backup (this might take a while)', true);
        
        $.post('/backup/restore').done(function (response) {
            if (response) {
                self.getScriptStatus('restore');
            }
        });
    },

    getScriptStatus: function (script) {
        var self = this;

        $.ajax({
            url: '/backup/' + script,
            dataType: 'text'
        }).done(function (response) {
            if (response) {                
                bScriptLogArea = bScriptLogArea || $('#backupbScriptLogArea');
                bScriptLog = bScriptLog || $('#backupScriptLog');

                bScriptLog.text(response);
                bScriptLogArea.show();
                bScriptLogArea.scrollTop(bScriptLogArea.scrollHeight);

                if (response.indexOf('Status changed to Success') > -1) {
                    // We're done!
                    self.appendLog('All done, initiating update!', false);

                    bScriptLogArea.hide().delay(500).queue(function() {
                         bScriptLogArea.empty();
                         UpdaterClient.updater.startInstallation();
                    });

                } else {
                    bScriptLog.delay(300).queue(function() {
                        self.getScriptStatus(script);
                    });
                }
            }
        });
    },

    startBackup: function() {
        UpdaterClient.config.backup = true;
        UpdaterClient.utils.switchPanel('#backup');
        UpdaterClient.backup.deployScripts(UpdaterClient.backup.makeBackup);
    }
};