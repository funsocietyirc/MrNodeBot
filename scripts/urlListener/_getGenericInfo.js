'use strict';

const _ = require('lodash');
const rp = require('request-promise-native');
const getTitle = require('./_getTitle');

// Get GitHub Information
const getGitHub = (user, repo, results) => rp({
        uri: `https://api.github.com/repos/${user}/${repo}`,
        headers: {
            'user-agent': 'MrNodeBot'
        },
        json: true
    })
    .then(data => {
        if (!data) {
            return getTitle(results);
        }
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
        console.log('Error in getGitHub link function');
        console.dir(err);
        return getTitle(results)
    });

// get BitBucket Information
const getBitBucket = (user, repo, results) => rp({
        uri: `https://api.bitbucket.org/2.0/repositories/${user}/${repo}`,
        headers: {
            'user-agent': 'MrNodeBot'
        },
        json: true
    })
    .then(data => {
        if (!data) {
            return getTitle(results);
        }
        results.bitBucket = {
            name: data.name,
            ownerUserName: data.owner.username,
            ownerDisplayName: data.owner.display_name,
            lastPush: data.updated_on,
            fullName: data.full_name,
            language: data.language,
            hasIssues: data.has_issues,
            desc: data.description
        };
        return results;
    })
    .catch(err => {
        console.log('Error in getBitbucket link function');
        console.dir(err);
        return getTitle(results);
    });

module.exports = (url, matches, results) => {
    // Bail if we have no result, default back to getTitle
    if (_.isEmpty(url) || !matches.length) {
        return getTitle(results);
    }

    let domain = matches[1].toLowerCase();

    switch (domain) {
        case 'github.com':
            // 2: User, 3: Repo
            return getGitHub(matches[2], matches[3], results);
            break;
        case 'bitbucket.org':
            // 2: User, 3: Repo
            return getBitBucket(matches[2], matches[3], results);
            break;
        default:
            return getTitle(results);
            break;
    }
};
