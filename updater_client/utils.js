var UpdaterClient = UpdaterClient || {}; 

UpdaterClient.utils = {

    switchPanel: function (input) {
        var panel = (input.target) ? input.target.dataset.target : input;
        $('.wrapper').hide();
        $(panel).show();
    },

    appendLog: function (text, loading, error, target) {
        var loader = '',
        errorText = (error) ? '<span class="error">Error: </span>' : '';

        if ($('#loading')) {
            $('#loading').remove();
        }

        loader = (loading) ? ' <img id="loading" src="/images/loading.gif" />' : '';
        return $(target).append('<p>' + errorText + text + loader + '</p>');
    }

};