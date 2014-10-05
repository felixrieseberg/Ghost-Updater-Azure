var config = {
    website: process.env.website || '',
    user: process.env.user || '',
    password: process.env.password || '',
    latestGhost: process.env.latestGhost || '',
    zippath: './ghost.zip',
    standalone: true
}

config.auth = function () {
    return {
        'user': config.username,
        'pass': config.password
    }
}

module.exports = config;