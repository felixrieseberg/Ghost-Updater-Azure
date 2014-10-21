var UpdaterClient = UpdaterClient || {}; 

UpdaterClient.updater = {

    updateFinished: false,
    scriptRunning: false,
    scriptLogTitle: null,
    scriptLogArea: null,
    scriptLog: null,
    timerCircle: null,
    timerYellow: null,
    timerRed: null,

    appendLog: function (text, loading, error) {
        return UpdaterClient.utils.appendLog(text, loading, error, '#updateOutputArea');
    },

    appendError: function (text) {
        return this.appendLog(text, false, true);
    },

    uploadGhost: function (propagate) {
        var self = UpdaterClient.updater, 
            nochanges = ' No changes to your site have been made.',
            error;

        this.appendLog('Uploading Ghost package to Azure Website (this might take a while)', true);

        $.ajax('/updater/upload').done(function(response) {
            console.log('Upload response: ', response);

            if (response.error || response.statusCode >= 400) {
                console.log('Error: ', response);

                if (response.statusCode === 401) {
                    error = 'Azure rejected the given credentials - username and password are incorrect,';
                    error += 'or are not correct for ' + UpdaterClient.config.url + '.' + nochanges;
                } else if (response.statusCode === 412) {
                    error = 'The filesystem at ' + UpdaterClient.config.url + ' does not accept the upload of the Ghost package.';
                    error +=  nochanges;
                } else if (response.error.code === 'ENOTFOUND' || (response.error.message && response.error.message.indexOf('ENOTFOUND') > -1)) {
                    error = 'Website ' + UpdaterClient.config.url + ' could not be found. Please ensure that you are connected to the Internet ';
                    error += 'and that the address is correct and restart the updater.' + nochanges;
                } else {
                    error = response.error + nochanges;
                }
                self.appendError(error);
            } else if (response.statusCode === 201) {
                self.appendLog('Ghost package successfully uploaded');
                if (propagate) {
                    self.deployScript(propagate);
                }
            }

        });
    },

    deployScript: function (propagate) {
        var self = this;
        this.appendLog('Deploying update script to Azure Website');

        $.ajax('/updater/deploy').done(function(response) {
            if (response.statusCode >= 200 && response.statusCode <= 400) {
                var responseBody = JSON.parse(response.body);
                
                if (responseBody.url) {
                    self.appendLog('Script successfully deployed (' + responseBody.name + ')');
                    if (propagate) {
                        self.triggerScript(propagate);
                    }
                }
            }
        });
    },

    triggerScript: function (propagate) {
        var self = this;
        this.appendLog('Starting Update script on Azure Website', true);
        
        $.ajax('/updater/trigger').done(function(response) {
            if (response.statusCode >= 200 && response.statusCode <= 400) {
                if (propagate) {
                    self.getScriptStatus(propagate);
                }
            }
        });
    },

    getScriptStatus: function () {
        var self = this;

        if (!this.scriptRunning) {
            this.appendLog('Trying to get status of update script on Azure Website', true);
            this.scriptRunning = true;
        }

        $.ajax({
            url: '/updater/info',
            dataType: 'text'
        }).done(function (response) {

            if (response && !self.updateFinished) {   
                clearTimeout(self.timerYellow);
                clearTimeout(self.timerRed);

                self.timerYellow = setTimeout(function () {
                    UpdaterClient.utils.timerButton('yellow');
                }, 120000);
                self.timerRed = setTimeout(function () {
                    UpdaterClient.utils.timerButton('red');
                }, 300000);
                UpdaterClient.utils.timerButton('green');

                self.scriptLogTitle = self.scriptLogTitle || $('.scriptLogTitle');
                self.scriptLogTitle.show();            
                self.scriptLog = self.scriptLog || $('#updateScriptLog');
                self.scriptLog.text(response);
                self.scriptLog.show();
                self.scriptLogArea = self.scriptLogArea || $('#updateScriptLogArea');
                self.scriptLogArea.show();
                self.scriptLogArea.scrollTop(self.scriptLogArea.scrollHeight);

                if (response.indexOf('Status changed to Success') > -1) {
                    // We're done!
                    self.scriptLogArea.hide();
                    self.scriptLogTitle.hide();
                    self.scriptLog.empty();
                    self.appendLog('All done, your blog has been updated!', false);
                    self.updateFinished = true;

                    setTimeout(function() { UpdaterClient.utils.switchPanel('#updatefinished'); }, 500);
                }
                
                setTimeout(function() { self.getScriptStatus(); }, 800);
            }
        }).fail(function (error) {
            console.log(error);

            if (!self.updateFinished) {
                setTimeout(function() { self.getScriptStatus(); }, 1000);
            }
        });

    },

    startInstallation: function () {
        UpdaterClient.utils.switchPanel('#update');
        UpdaterClient.updater.uploadGhost(true);
    }
};