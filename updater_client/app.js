var UpdaterClient = UpdaterClient || {};

UpdaterClient.init = function () {
    UpdaterClient.config.getConfig();

    // Wire up buttons to actions
    $('input').bind('input', UpdaterClient.validation.validateConfig);
    $('#ghost-zip').change(UpdaterClient.updater.setGhostPackage);

    // Defining actions and handlers here is okay, but feels dirty.
    // This allows us to define actions with the data-action attribute.
    $('body').on('click', '[data-action]', function() {
        var action = $(this).data('action'),
            split = (action) ? action.split('.') : null,
            fn = window;
        
        for (var i = 0; i < split.length; i++) {
            fn = (fn) ? fn[split[i]] : null;
        }

        if (typeof fn === 'function') {
            fn.apply(null, arguments);
        }
    });

    $('#config').fadeIn(900);
};