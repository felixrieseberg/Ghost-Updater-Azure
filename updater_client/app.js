var UpdaterClient = UpdaterClient || {};

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
};