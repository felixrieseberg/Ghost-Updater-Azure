/*! Ghost-Updater-Azure - v0.5.0 - 2014-10-09 */var UpdaterClient = UpdaterClient || {};

UpdaterClient.init = function () {
    $('input').bind('input', UpdaterClient.validation.validateConfig);
    $('#ghost-zip').change(UpdaterClient.updater.setGhostPackage);
    $('.js-panelswitch').click(UpdaterClient.updater.switchPanel);
    $('#btn-next-s1').click(UpdaterClient.updater.setConfig);
    $('#btn-start-s3').click(UpdaterClient.updater.startInstallation);

    $.ajax('/nw').done(function(response) {
        if (response.isNodeWebkit) {
            UpdaterClient.config.standalone = true;
            $('#ghost-zip-container').show();
        }
    });    

    $('#step1').fadeIn(900);
};var UpdaterClient = UpdaterClient || {};

UpdaterClient.config = {
    url: '',
    username: '',
    password: '',
    zippath: '',
    standalone: undefined
};var UpdaterClient = UpdaterClient || {}; 

var url, scriptLog, scriptLogArea, scriptRunning;

UpdaterClient.updater = {

    appendLog: function (text, loading, error) {
        var loader = '',
        errorText = (error) ? '<span class="error">Error: </span>' : '';

        if ($('#loading')) {
            $('#loading').remove();
        }

        loader = (loading) ? ' <img id="loading" src="/images/loading.gif" />' : '';
        return $('#outputArea').append('<p>' + errorText + text + loader + '</p>');
    },

    appendError: function (text) {
        return this.appendLog(text, false, true);
    },

    switchPanel: function (input) {
        var panel = (input.target) ? input.target.dataset.target : input;
        $('.wrapper').hide();
        $(panel).show();
    },

    setConfig: function () {
        var self = UpdaterClient.updater;

        if (UpdaterClient.validation.validateConfig('default')) {
            $.ajax({
                url: '/updater/config',
                data: { 
                    url: UpdaterClient.config.url, 
                    username: UpdaterClient.config.username, 
                    password: UpdaterClient.config.password, 
                    zippath: UpdaterClient.config.zippath 
                }
            })
            .done(function(response) {
                console.log(response);
                $('#backuplink').attr('href', url + '/ghost/debug');
                self.switchPanel('#step2');
            });
        }
    },

    uploadGhost: function (propagate) {
        var self = UpdaterClient.updater, 
            nochanges = ' No changes to your site have been made.',
            error;

        this.appendLog('Uploading Ghost package to Azure Website (this might take a while)', true);

        $.ajax('/updater/upload').done(function(response) {
            console.log('Upload response: ', response);

            if (response.err || response.statusCode >= 400) {
                console.log('Error: ', response);

                if (response.statusCode === 401) {
                    error = 'Azure rejected the given credentials - username and password are incorrect,';
                    error += 'or are not correct for ' + UpdaterClient.config.url + '.' + nochanges;
                } else if (response.err.code === 'ENOTFOUND') {
                    error = 'Website ' + UpdaterClient.config.url + ' could not be found. Please ensure that you are connected to the Internet ';
                    error += 'and that the address is correct and restart the updater.' + nochanges;
                } else {
                    error = response.err + nochanges;
                }
                self.appendError(error);
            } else if (response.statusCode === 201) {
                self.appendLog('Ghost package successfully uploaded.');
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

        if (!scriptRunning) {
            this.appendLog('Trying to get status of update script on Azure Website', true);
        }

        $.ajax({
            url: '/updater/info',
            dataType: 'text'
        }).done(function(response) {
            scriptRunning = true;

            if (response) {                
                scriptLogArea = scriptLogArea || $('#scriptLogArea');
                scriptLog = scriptLog || $('#scriptLog');

                scriptLog.text(response);
                scriptLogArea.show();
                scriptLogArea.scrollTop(scriptLogArea.scrollHeight);

                if (response.indexOf('Status changed to Success') > -1) {
                    // We're done!
                    scriptLogArea.hide();
                    self.appendLog('All done, your blog has been updated!', false);
                } else {
                    self.getScriptStatus();
                }
            }
        });

    },

    startInstallation: function () {
        UpdaterClient.updater.switchPanel('#step3');
        UpdaterClient.updater.uploadGhost(true);
    }
};var UpdaterClient = UpdaterClient || {};

UpdaterClient.validation = {

    validateConfig: function (e) {
        var urlRegex = /\**..(.azurewebsites.net)/,
            result = true,
            username, password, zippath, url;
        
        e = (e.target) ? e.target.id : e;

        switch (e) {
            case 'blog-url':
                UpdaterClient.config.url = $('#blog-url').val();
                url = UpdaterClient.config.url;
                if (!url || !urlRegex.test(url)) {
                    $('#blog-url').addClass('invalid');
                    result = false;
                } else if (urlRegex.test(url)) {
                    $('#blog-url').removeClass('invalid');
                }

                break;
            case 'blog-username':
                UpdaterClient.config.username = $('#blog-username').val();
                username = UpdaterClient.config.username;
                if (!username) {
                    $('#blog-username').addClass('invalid');
                    result = false;
                } else if (username) {
                    $('#blog-username').removeClass('invalid');
                }

                break;
            case 'blog-password':
                UpdaterClient.config.password = $('#blog-password').val();
                password = UpdaterClient.config.password;
                if (!password) {
                    $('#blog-password').addClass('invalid');
                    result = false;
                } else if (password) {
                    $('#blog-password').removeClass('invalid');
                }

                break;
            case 'ghost-zip':
                UpdaterClient.config.zippath = $('#ghost-zip').val();
                zippath = UpdaterClient.config.zippath;
                if (!zippath) {
                    $('#ghost-zip').addClass('invalid');
                    result = false;
                } else if (zippath) {
                    $('#ghost-zip').removeClass('invalid');
                }
                
                break;
            default:
                var testUrl = this.validateConfig('blog-url'),
                    testPassword = this.validateConfig('blog-password'),
                    testUsername = this.validateConfig('blog-username'),
                    testZippath;

                if (UpdaterClient.config.standalone) {
                    testZippath = this.validateConfig('ghost-zip');
                } else {
                    testZippath = true;
                }
                    
                if (!testUrl || !testUsername || !testPassword || !testZippath) {
                    result = false;
                }   

                break;
        }

        return result;
    }
};