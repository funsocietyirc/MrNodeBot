'use strict';
const rp = require('request-promise-native');
const logger = require('../../lib/logger');

module.exports = async (user, repo, results) => {
    try {
        // Get the request
        const data = await rp({
            uri: `https://api.bitbucket.org/2.0/repositories/${user}/${repo}`,
            headers: {
                'user-agent': 'MrNodeBot'
            },
            json: true
        });

        // Check we have a result
        if (!data) return results;

        // Append results
        return Object.assign(results, {
            bitBucket: {
                name: data.name,
                ownerUserName: data.owner.username,
                ownerDisplayName: data.owner.display_name,
                lastPush: data.updated_on,
                fullName: data.full_name,
                language: data.language,
                hasIssues: data.has_issues,
                desc: data.description,
                privateRepo: false,
            }
        });
    }
    catch (err) {
        // Private Repo
        if (err.statusCode === 403) return Object.assign(results, {
            bitBucket: {
                privateRepo: true
            }
        });

        // Log Error
        logger.warn('Error in getBitbucket link function', {
            message: err.message || '',
            stack: err.stack || '',
        });

        return results;
    }
};