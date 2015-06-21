var UpdaterClient = UpdaterClient || {};

UpdaterClient.validation = {

    /**
     * One giant validation method, taking an event and running
     * some basic validation against a targeted input element.
     * @param  {object} e - event
     */
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