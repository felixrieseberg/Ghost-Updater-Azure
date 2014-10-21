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
    },

    timerButton: function (color) {
        var timerCircle = $('.circle'),
            timerTooltip = $('.circle > span'),
            textKeepTrying = '\nThis tool will keep trying to reach the website.',
            textRed = 'We have not heard back from the websites within the last five minutes, which can indicate a problem.' + textKeepTrying,
            textYellow = 'We have not heard back from the website within the last two minutes.' + textKeepTrying,
            textGrey = 'The connection status to your Azure Website is currently unknown.',
            textGreen = 'We are connected to your Azure Website.';

        switch (color) {
            case 'red':
                timerCircle.css('background-color', '#e55b5b');
                timerTooltip.text(textRed);
                break;
            case 'yellow':
                timerCircle.css('background-color', '#ffe811');
                timerTooltip.text(textYellow);
                break;
            case 'grey':
                timerCircle.css('background-color', '#7f7f7f');
                timerTooltip.text(textGrey);
                break;
            case 'green':
                timerCircle.css('background-color', '#799a2e');
                timerTooltip.text(textGreen);
                break;
            default:
                break;
        }
    }

};