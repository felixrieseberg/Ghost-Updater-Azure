var config = {
    website: process.env.website || 'https://ghostupdatetest.scm.azurewebsites.net',
    user: process.env.user || '$ghostupdatetest',
    password: process.env.password || 'bHY0wH2NvhQubnuqRhsZwjTd9ixbpeg2e2xDdppWTlMcWrmcu174ot1MTrGp',
    latestGhost: process.env.latestGhost || 'https://ghost.org/zip/ghost-latest.zip',
}

config.auth = {
    'user': config.user,
    'pass': config.password
}

module.exports = config;