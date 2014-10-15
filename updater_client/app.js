var UpdaterClient = UpdaterClient || {};

UpdaterClient.init = function () {
    $('input').bind('input', UpdaterClient.validation.validateConfig);
    $('#ghost-zip').change(UpdaterClient.updater.setGhostPackage);
    $('.js-panelswitch').click(UpdaterClient.utils.switchPanel);
    $('#btn-setconfig').click(UpdaterClient.updater.setConfig);
    $('.js-update').click(UpdaterClient.updater.startInstallation);
    $('#btn-createbackup').click(UpdaterClient.backup.startBackup);

    $.ajax('/nw').done(function(response) {
        if (response.isNodeWebkit) {
            UpdaterClient.config.standalone = true;
            $('#ghost-zip-container').show();
        }
    });

    $('#backupdisclaimer').fadeIn(900);
};

UpdaterClient.utils = {

    switchPanel: function (input) {
        var panel = (input.target) ? input.target.dataset.target : input;
        $('.wrapper').hide();
        $(panel).show();
    }

};