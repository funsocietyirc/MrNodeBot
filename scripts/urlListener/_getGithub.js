'use strict';
const rp = require('request-promise-native');
const logger = require('../../lib/logger');

// Get GitHub Information
module.exports = (user, repo, results) => rp({
    uri: `https://api.github.com/repos/${user}/${repo}`,
    headers: {
        'user-agent': 'MrNodeBot'
    },
    json: true
})
    .then(data => {
        // No data, bail
        if (!data) return results;

        // Format The response
        results.gitHub = {
            name: data.name,
            owner: data.owner.login,
            desc: data.description,
            isFork: data.fork,
            lastPush: data.pushed_at,
            stars: data.stargazers_count,
            watchers: data.watchers_count,
            language: data.language,
            forks: data.forks_count,
            issues: data.open_issues_count,
            fullName: data.full_name,
        };
        return results;
    })
    .catch(err => {
        logger.warn('Error in getGitHub link function', {
            err
        });
        return results;
    });
