var UpdaterClient = UpdaterClient || {};

UpdaterClient.config = {
    url: '',
    username: '',
    password: '',
    zippath: '',
    standalone: undefined,
    backup: false,

    /**
     * Takes the config entered by the user and hits the router configuration
     * endpoint, essentially telling the Node part of this app what the
     * configuration is.
     */
    setConfig: function () {
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
                UpdaterClient.utils.switchPanel('#backupdisclaimer');
            });
        }
    },

    /**
     * Ensures that we're running in NW.js - and show's the file
     * upload option, if that's the case
     * TODO: This seemed smart in the beginning, but pointless now.
     * We're always running as an app.
     */
    getConfig: function () {
        $.ajax('/nw').done(function (response) {
            console.log(response);
            if (response.isNodeWebkit) {
                UpdaterClient.config.standalone = true;
                $('#ghost-zip-container').show();
            }
        });
    }
};

