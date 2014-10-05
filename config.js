var config = {
    website: process.env.website || 'https://ghostautoupdatetest.scm.azurewebsites.net',
    user: process.env.user || '$ghostautoupdatetest',
    password: process.env.password || 'MksdwSjBuG8iTYEYl4hayRP0tSZwf9Zljbt1QGDoPZ3ijvwt7iRXHr2TviHP',
    latestGhost: process.env.latestGhost || 'https://ghost.org/zip/ghost-latest.zip',
}

config.auth = {
    'user': config.user,
    'pass': config.password
}

module.exports = config;