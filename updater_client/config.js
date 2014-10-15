var UpdaterClient = UpdaterClient || {};

UpdaterClient.config = {
    url: '',
    username: '',
    password: '',
    zippath: '',
    standalone: undefined,
    backup: false,

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

