var UpdaterClient = UpdaterClient || {}; 

UpdaterClient.backup = {

    appendLog: function (text, loading, error) {
        var loader = '',
        errorText = (error) ? '<span class="error">Error: </span>' : '';

        if ($('#backup > #loading')) {
            $('#backup > #loading').remove();
        }

        loader = (loading) ? ' <img id="loading" src="/images/loading.gif" />' : '';
        return $('#backup > #outputArea').append('<p>' + errorText + text + loader + '</p>');
    },

    appendError: function (text) {
        return this.appendLog(text, false, true);
    },

    deployScripts: function (propagate) {
        var self = this;
        this.appendLog('Deploying backup scripts to Azure Website');

        $.ajax('/backup/deploy').done(function(response) {
            if (response.statusCode >= 200 && response.statusCode <= 400) {
                console.log(respose);

                if (responseBody.url) {
                    self.appendLog('Scripts successfully deployed.');
                    if (propagate) {
                        self.triggerScript(propagate);
                    }
                }
            }
        });
    },

    makeBackup: function (propagate) {
        var self = this;
        this.appendLog('Instructing Azure to create backup', true);
        
        $.post('/backup/create').done(function(response) {
            if (response.statusCode >= 200 && response.statusCode <= 400) {
                getScriptStatus('create');
            }
        });
    },

    deleteBackup: function (propagate) {
        var self = this;
        this.appendLog('Instructing Azure to delete backup', true);
        
        $.post('/backup/delete').done(function(response) {
            if (response.statusCode >= 200 && response.statusCode <= 400) {
                getScriptStatus('delete');
            }
        });
    },

    restoreBackup: function (propagate) {
        var self = this;
        this.appendLog('Instructing Azure to restore backup', true);
        
        $.post('/backup/restore').done(function(response) {
            if (response.statusCode >= 200 && response.statusCode <= 400) {
                getScriptStatus('restore');
            }
        });
    },

    getScriptStatus: function (script) {
        var self = this;

        $.ajax({
            url: '/backup/' + script,
            dataType: 'text'
        }).done(function(response) {
            scriptRunning = true;

            if (response) {                
                scriptLogArea = scriptLogArea || $('#backup > #scriptLogArea');
                scriptLog = scriptLog || $('#backup > #scriptLog');

                scriptLog.text(response);
                scriptLogArea.show();
                scriptLogArea.scrollTop(scriptLogArea.scrollHeight);

                if (response.indexOf('Status changed to Success') > -1) {
                    // We're done!
                    scriptLogArea.hide();
                    scriptLogArea.empty();
                    self.appendLog('All done!', false);
                } else {
                    self.getScriptStatus();
                }
            }
        });
    }
};